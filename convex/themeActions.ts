"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";
import { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Action 1 – Tag a podcast script with macro-economic themes via GPT,
//            then score each theme using Google Trends
// ---------------------------------------------------------------------------

export const tagPodcastThemes = action({
  args: {
    podcastId: v.id("podcasts"),
    scriptText: v.string(),
    sourceArticleUrls: v.optional(v.array(v.string())),
    sourceArticleDetails: v.optional(v.array(v.object({
      url: v.string(),
      title: v.string(),
      source: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ConvexError("OPENAI_API_KEY is not set");
    }

    const openai = new OpenAI({ apiKey });

    // Fetch existing themes so GPT can map to them
    const existingThemes = await ctx.runQuery(api.themes.getTrendingThemes);
    const existingThemeList = existingThemes
      .map((t: { slug: string; label: string; category: string }) => `${t.slug} (${t.label} — ${t.category})`)
      .join("\n");

    // GPT identifies themes (relevanceScore is fixed — heatScore driven by cron)
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a macro economics analyst. Given a podcast script, identify macro economic themes discussed. Return ONLY a JSON array. Each item: { slug, label, category, regions: string[], assetClasses: string[], sentiment: "hawkish"|"dovish"|"neutral", summary: string }. Do NOT include relevanceScore — it will be sourced externally. Map to existing themes where possible:\n${existingThemeList}\nCategories: "Monetary Policy", "Geopolitics", "Commodities", "Trade", "Labor", "Energy", "Fiscal Policy", "Markets", "Technology", "Real Estate", "Regulation". Regions: "US", "EU", "UK", "CN", "JP", "EM", "Global". Asset classes: "rates", "FX", "equities", "commodities", "credit", "crypto".`,
        },
        {
          role: "user",
          content: args.scriptText.slice(0, 8000),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      console.error("Failed to parse theme tags from GPT response:", raw);
      return;
    }

    let tags: Array<{
      slug: string;
      label: string;
      category: string;
      regions?: string[];
      assetClasses?: string[];
      sentiment?: string;
      summary?: string;
    }>;
    try {
      tags = JSON.parse(arrayMatch[0]);
    } catch {
      console.error("JSON parse error for theme tags:", arrayMatch[0]);
      return;
    }

    const themeIds: Id<"macroThemes">[] = [];

    for (const tag of tags) {
      // relevanceScore is fixed at 1.0 — heatScore is driven by Google Trends cron
      const relevanceScore = 1.0;

      const themeId = await ctx.runMutation(api.themes.createTheme, {
        slug: tag.slug,
        label: tag.label,
        category: tag.category,
        regions: tag.regions || [],
        assetClasses: tag.assetClasses || [],
      });

      await ctx.runMutation(api.themes.recordMention, {
        themeId,
        sourceType: "news-podcast",
        sourceId: args.podcastId,
        sentiment: tag.sentiment || "neutral",
        relevanceScore: Math.min(Math.max(relevanceScore, 0), 1),
        summary: tag.summary || "",
        sourceArticles: args.sourceArticleUrls,
        articleDetails: args.sourceArticleDetails,
      });

      themeIds.push(themeId);
    }

    await ctx.runMutation(api.themes.linkThemesToPodcast, {
      podcastId: args.podcastId,
      themeIds: themeIds as Id<"macroThemes">[],
    });

    for (const themeId of themeIds) {
      try {
        await ctx.runAction(api.themeActions.generateThemeSummary, {
          themeId,
        });
      } catch (error) {
        console.error(
          `Failed to generate summary for theme ${themeId}:`,
          error,
        );
      }
    }
  },
});

// ---------------------------------------------------------------------------
// Action 2 – Generate / refresh the AI summary for a theme
// ---------------------------------------------------------------------------

export const generateThemeSummary = action({
  args: {
    themeId: v.id("macroThemes"),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ConvexError("OPENAI_API_KEY is not set");
    }

    const openai = new OpenAI({ apiKey });

    // 1. Get theme label for the web search
    const theme = await ctx.runQuery(api.themes.getThemeById, {
      themeId: args.themeId,
    });
    if (!theme) return;

    // 2. Fetch trending articles about this theme via web search
    const searchResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      tools: [{ type: "web_search" }],
      input: `Find the top 5 trending news articles about "${theme.label}" in macro economics from today. Return ONLY a JSON array with no other text. Each item should have: title (string), summary (2-3 sentence summary), source (publication name), url (article URL). Format: [{"title":"...","summary":"...","source":"...","url":"..."}]`,
    });

    const searchText = searchResponse.output_text;
    const jsonMatch = searchText.match(/\[[\s\S]*\]/);

    let articles: Array<{ title: string; summary: string; source: string; url: string }> = [];
    if (jsonMatch) {
      try {
        articles = JSON.parse(jsonMatch[0]);
      } catch {
        console.error("JSON parse error for theme articles:", jsonMatch[0]);
      }
    }

    // 3. Summarize the articles into a theme summary + risk chain
    const articleText = articles.length > 0
      ? articles.map((a, i) => `${i + 1}. [${a.source}] ${a.title}: ${a.summary}`).join("\n")
      : `Theme: ${theme.label} (${theme.category})`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            'You are a macro economics analyst. Given recent news articles about a theme, return ONLY a JSON object with "summary" (2-3 sentences) and "riskChain" ("Event → Mechanism → Market Impact").',
        },
        {
          role: "user",
          content: articleText,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (!objMatch) return;

    let parsed: { summary?: string; riskChain?: string };
    try {
      parsed = JSON.parse(objMatch[0]);
    } catch {
      console.error("JSON parse error for theme summary:", objMatch[0]);
      return;
    }

    // 4. Store summary, risk chain, and source articles
    const summaryArticles = articles.map((a) => ({
      url: a.url,
      title: a.title,
      source: a.source,
    }));

    await ctx.runMutation(api.themes.updateThemeSummary, {
      themeId: args.themeId,
      summary: parsed.summary || "",
      riskChain: parsed.riskChain || "",
      summaryArticles,
    });
  },
});
