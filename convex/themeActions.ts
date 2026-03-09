"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";
import { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Action 1 – Tag a podcast script with macro-economic themes via GPT
// ---------------------------------------------------------------------------

export const tagPodcastThemes = action({
  args: {
    podcastId: v.id("podcasts"),
    scriptText: v.string(),
    sourceArticleUrls: v.optional(v.array(v.string())),
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
      .map((t) => `${t.slug} (${t.label} — ${t.category})`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a macro economics analyst. Given a podcast script, identify macro economic themes. Return ONLY a JSON array. Each item: { slug, label, category, regions: string[], assetClasses: string[], sentiment: "hawkish"|"dovish"|"neutral", relevanceScore: 0-1, summary: string }. Map to existing themes where possible:\n${existingThemeList}\nCategories: "Monetary Policy", "Geopolitics", "Commodities", "Trade", "Labor", "Energy", "Fiscal Policy", "Markets", "Technology", "Real Estate", "Regulation". Regions: "US", "EU", "UK", "CN", "JP", "EM", "Global". Asset classes: "rates", "FX", "equities", "commodities", "credit", "crypto".`,
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
      relevanceScore?: number;
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
        relevanceScore: Math.min(Math.max(tag.relevanceScore || 0.5, 0), 1),
        summary: tag.summary || "",
        sourceArticles: args.sourceArticleUrls,
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

    const mentions = await ctx.runQuery(api.themes.getThemeMentions, {
      themeId: args.themeId,
      limit: 10,
    });

    if (mentions.length === 0) {
      return;
    }

    const mentionSummaries = mentions
      .map((m, i) => `${i + 1}. [${m.sentiment}] ${m.summary}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            'You are a macro economics analyst. Given recent mentions of a theme, return ONLY a JSON object with "summary" (2-3 sentences) and "riskChain" ("Event → Mechanism → Market Impact").',
        },
        {
          role: "user",
          content: mentionSummaries,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (!objMatch) {
      return;
    }

    let parsed: { summary?: string; riskChain?: string };
    try {
      parsed = JSON.parse(objMatch[0]);
    } catch {
      console.error("JSON parse error for theme summary:", objMatch[0]);
      return;
    }

    await ctx.runMutation(api.themes.updateThemeSummary, {
      themeId: args.themeId,
      summary: parsed.summary || "",
      riskChain: parsed.riskChain || "",
    });
  },
});
