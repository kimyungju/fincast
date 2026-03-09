"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";

// ---------------------------------------------------------------------------
// Chatbot action — answers macro-economics questions grounded in platform data
// ---------------------------------------------------------------------------

export const sendMessage = action({
  args: {
    message: v.string(),
    conversationHistory: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
    contextHints: v.optional(
      v.object({
        themeSlug: v.optional(v.string()),
        podcastId: v.optional(v.id("podcasts")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ConvexError("OPENAI_API_KEY is not set");
    }

    const openai = new OpenAI({ apiKey });

    // ----- Gather context from the database -----

    const contextParts: string[] = [];

    // 1. If themeSlug provided, load the theme and its recent mentions
    if (args.contextHints?.themeSlug) {
      const theme = await ctx.runQuery(api.themes.getThemeBySlug, {
        slug: args.contextHints.themeSlug,
      });

      if (theme) {
        contextParts.push(
          `## Current Theme: ${theme.label}\n` +
            `- Category: ${theme.category}\n` +
            `- Heat Score: ${theme.heatScore.toFixed(1)} (${theme.heatStatus})\n` +
            `- Regions: ${theme.regions.join(", ") || "N/A"}\n` +
            `- Asset Classes: ${theme.assetClasses.join(", ") || "N/A"}\n` +
            `- Total Mentions: ${theme.totalMentions}\n` +
            `- Google Trends Score: ${theme.trendsScore ?? "N/A"}\n` +
            (theme.latestSummary
              ? `- Latest Summary: ${theme.latestSummary}\n`
              : "") +
            (theme.riskChain ? `- Risk Chain: ${theme.riskChain}\n` : ""),
        );

        // Load 10 recent mentions for this theme
        const mentions = await ctx.runQuery(api.themes.getThemeMentions, {
          themeId: theme._id,
          limit: 10,
        });

        if (mentions.length > 0) {
          const mentionLines = mentions
            .map(
              (m: { sentiment: string; summary: string; timestamp: number }, i: number) =>
                `  ${i + 1}. [${m.sentiment}] ${m.summary} (${new Date(m.timestamp).toLocaleDateString()})`,
            )
            .join("\n");
          contextParts.push(
            `### Recent Mentions for ${theme.label}:\n${mentionLines}`,
          );
        }
      }
    }

    // 2. If podcastId provided, load the podcast
    if (args.contextHints?.podcastId) {
      const podcast = await ctx.runQuery(api.podcast.getPodcastById, {
        podcastId: args.contextHints.podcastId,
      });

      if (podcast) {
        contextParts.push(
          `## Current Podcast: "${podcast.podcastTitle}"\n` +
            `- Author: ${podcast.author}\n` +
            `- Description: ${podcast.podcastDescription}\n` +
            `- Views: ${podcast.views}\n` +
            `- Trending Score: ${podcast.trendingScore ?? "N/A"}\n` +
            `- Script excerpt:\n${podcast.voicePrompt.slice(0, 3000)}`,
        );
      }
    }

    // 3. Always load top 15 trending themes for cross-referencing
    const trendingThemes = await ctx.runQuery(api.themes.getTrendingThemes);
    const top15 = trendingThemes.slice(0, 15);

    if (top15.length > 0) {
      const themeLines = top15
        .map(
          (t: {
            label: string;
            heatScore: number;
            heatStatus: string;
            category: string;
            latestSummary?: string;
            riskChain?: string;
          }) =>
            `- ${t.label} [${t.category}]: heat ${t.heatScore.toFixed(1)} (${t.heatStatus})` +
            (t.latestSummary ? ` — ${t.latestSummary}` : "") +
            (t.riskChain ? ` | Risk: ${t.riskChain}` : ""),
        )
        .join("\n");
      contextParts.push(`## Trending Macro Themes (Top 15):\n${themeLines}`);
    }

    // ----- Build system prompt -----

    const contextBlock =
      contextParts.length > 0
        ? `\n\n--- PLATFORM DATA ---\n${contextParts.join("\n\n")}\n--- END PLATFORM DATA ---`
        : "";

    const systemPrompt =
      `You are Castory AI, a macro-economics research assistant built into the Castory podcast platform. ` +
      `Your users are asset managers and financial professionals who want signal, not noise.\n\n` +
      `Guidelines:\n` +
      `- Be concise and direct. Asset managers value brevity.\n` +
      `- Ground your answers in the platform data provided below when relevant. Cite specific themes, heat scores, and mention counts.\n` +
      `- When explaining macro transmission mechanisms, use the "Event → Mechanism → Market Impact" chain format.\n` +
      `- If the platform data doesn't contain information to answer a question, say so honestly rather than speculating.\n` +
      `- You can discuss general macro-economics knowledge, but always prefer platform-specific data when available.\n` +
      `- When referencing themes, use their exact labels from the platform data.\n` +
      `- Keep responses under 300 words unless the user asks for deep analysis.` +
      contextBlock;

    // ----- Trim conversation history to last 20 messages -----

    const trimmedHistory = args.conversationHistory.slice(-20);

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...trimmedHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: args.message },
    ];

    // ----- Call OpenAI -----

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.3,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new ConvexError("No response from OpenAI");
    }

    return responseText;
  },
});
