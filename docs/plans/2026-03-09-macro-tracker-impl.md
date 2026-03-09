# Macro Economics Tracker — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add macro theme tracking, heat scores, trending topics sidebar, topic detail pages, and async theme tagging to Castory's podcast platform — all working end-to-end for a live hackathon demo.

**Architecture:** Two new Convex tables (`macroThemes`, `themeMentions`) feed a real-time heat score system. When a podcast is published, an async GPT call tags macro themes and records mentions. Mentions recompute heat scores, which drive the trending sidebar and home feed ordering. Convex reactivity pushes all changes to connected clients instantly.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Convex, OpenAI GPT-4.1-mini, Tailwind CSS 4, shadcn/ui

**Note:** No test infrastructure exists in this hackathon project. Verification is done by running `npm run dev` and checking the UI. Each task ends with a commit.

---

## Task 1: Schema Changes

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Add `macroThemes` and `themeMentions` tables, extend `podcasts`**

Replace the entire `convex/schema.ts` with:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  podcasts: defineTable({
    audioStorageId: v.optional(v.id("_storage")),
    user: v.id("users"),
    podcastTitle: v.string(),
    podcastDescription: v.string(),
    audioUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    author: v.string(),
    authorId: v.string(),
    authorImageUrl: v.string(),
    voicePrompt: v.string(),
    imagePrompt: v.string(),
    voiceType: v.string(),
    audioDuration: v.number(),
    views: v.number(),
    // NEW: theme tracking
    themeIds: v.optional(v.array(v.id("macroThemes"))),
    trendingScore: v.optional(v.number()),
  })
    .index("by_authorId", ["authorId"])
    .index("by_trendingScore", ["trendingScore"])
    .searchIndex("search_author", { searchField: "author" })
    .searchIndex("search_title", { searchField: "podcastTitle" })
    .searchIndex("search_body", { searchField: "podcastDescription" }),

  users: defineTable({
    email: v.string(),
    imageUrl: v.string(),
    clerkId: v.string(),
    name: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  macroThemes: defineTable({
    slug: v.string(),
    label: v.string(),
    category: v.string(),
    regions: v.array(v.string()),
    assetClasses: v.array(v.string()),
    heatScore: v.number(),
    heatStatus: v.string(),
    latestSummary: v.optional(v.string()),
    riskChain: v.optional(v.string()),
    totalMentions: v.number(),
    lastMentionAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_heatScore", ["heatScore"])
    .index("by_category", ["category"])
    .searchIndex("search_label", { searchField: "label" }),

  themeMentions: defineTable({
    themeId: v.id("macroThemes"),
    sourceType: v.string(),
    sourceId: v.id("podcasts"),
    sentiment: v.string(),
    relevanceScore: v.number(),
    summary: v.string(),
    sourceArticles: v.optional(v.array(v.string())),
    timestamp: v.number(),
  })
    .index("by_theme", ["themeId"])
    .index("by_theme_and_time", ["themeId", "timestamp"])
    .index("by_source", ["sourceId"]),
});
```

**Step 2: Verify schema pushes**

Run: `npx convex dev` (should auto-push schema)
Expected: Schema accepted, no errors. The `macroThemes` and `themeMentions` tables appear in the Convex dashboard.

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add macroThemes and themeMentions tables, extend podcasts with themeIds and trendingScore"
```

---

## Task 2: Backend — Theme Queries and Mutations

**Files:**
- Create: `convex/themes.ts`

**Step 1: Create `convex/themes.ts` with all queries and mutations**

```typescript
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Helper: compute heat status from score ───

function computeHeatStatus(
  heatScore: number,
  lastMentionAt: number,
  now: number,
): string {
  const daysSinceMention = (now - lastMentionAt) / (1000 * 60 * 60 * 24);
  if (daysSinceMention > 14) return "dormant";
  if (heatScore > 2.0) return "hot";
  if (heatScore >= 1.3) return "warming";
  if (heatScore >= 0.7) return "stable";
  return "cooling";
}

// ─── Queries ───

export const getTrendingThemes = query({
  args: {},
  handler: async (ctx) => {
    const themes = await ctx.db
      .query("macroThemes")
      .withIndex("by_heatScore")
      .order("desc")
      .take(20);
    return themes;
  },
});

export const getThemeBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("macroThemes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getThemeMentions = query({
  args: {
    themeId: v.id("macroThemes"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("themeMentions")
      .withIndex("by_theme_and_time", (q) => q.eq("themeId", args.themeId))
      .order("desc")
      .take(limit);
  },
});

export const searchThemes = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query === "") {
      return await ctx.db
        .query("macroThemes")
        .withIndex("by_heatScore")
        .order("desc")
        .take(20);
    }
    return await ctx.db
      .query("macroThemes")
      .withSearchIndex("search_label", (q) => q.search("label", args.query))
      .take(20);
  },
});

export const getWeeklyMentionCounts = query({
  args: {
    themeId: v.id("macroThemes"),
    weeks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numWeeks = args.weeks ?? 8;
    const now = Date.now();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const startTime = now - numWeeks * msPerWeek;

    const mentions = await ctx.db
      .query("themeMentions")
      .withIndex("by_theme_and_time", (q) =>
        q.eq("themeId", args.themeId).gte("timestamp", startTime),
      )
      .collect();

    // Bucket into weeks (index 0 = oldest week)
    const counts: number[] = new Array(numWeeks).fill(0);
    for (const m of mentions) {
      const weekIndex = Math.floor((m.timestamp - startTime) / msPerWeek);
      const clamped = Math.min(weekIndex, numWeeks - 1);
      counts[clamped] += m.relevanceScore;
    }

    return counts;
  },
});

export const getSentimentBreakdown = query({
  args: { themeId: v.id("macroThemes") },
  handler: async (ctx, args) => {
    const mentions = await ctx.db
      .query("themeMentions")
      .withIndex("by_theme", (q) => q.eq("themeId", args.themeId))
      .collect();

    const total = mentions.length;
    if (total === 0) return { hawkish: 0, dovish: 0, neutral: 0 };

    let hawkish = 0;
    let dovish = 0;
    let neutral = 0;
    for (const m of mentions) {
      if (m.sentiment === "hawkish") hawkish++;
      else if (m.sentiment === "dovish") dovish++;
      else neutral++;
    }

    return {
      hawkish: Math.round((hawkish / total) * 100),
      dovish: Math.round((dovish / total) * 100),
      neutral: Math.round((neutral / total) * 100),
    };
  },
});

export const getPodcastsByTheme = query({
  args: { themeId: v.id("macroThemes") },
  handler: async (ctx, args) => {
    // Convex has no JOIN — get all podcasts that reference this theme
    const allPodcasts = await ctx.db.query("podcasts").collect();
    const matching = allPodcasts.filter((p) =>
      p.themeIds?.includes(args.themeId),
    );
    // Sort by views descending
    matching.sort((a, b) => b.views - a.views);
    return matching;
  },
});

// ─── Mutations ───

export const createTheme = mutation({
  args: {
    slug: v.string(),
    label: v.string(),
    category: v.string(),
    regions: v.array(v.string()),
    assetClasses: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("macroThemes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("macroThemes", {
      slug: args.slug,
      label: args.label,
      category: args.category,
      regions: args.regions,
      assetClasses: args.assetClasses,
      heatScore: 0,
      heatStatus: "dormant",
      totalMentions: 0,
      lastMentionAt: 0,
    });
  },
});

export const recordMention = mutation({
  args: {
    themeId: v.id("macroThemes"),
    sourceType: v.string(),
    sourceId: v.id("podcasts"),
    sentiment: v.string(),
    relevanceScore: v.number(),
    summary: v.string(),
    sourceArticles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Insert the mention
    await ctx.db.insert("themeMentions", {
      themeId: args.themeId,
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      sentiment: args.sentiment,
      relevanceScore: args.relevanceScore,
      summary: args.summary,
      sourceArticles: args.sourceArticles,
      timestamp: now,
    });

    // 2. Recompute heat score for this theme
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - msPerWeek;
    const twentyEightDaysAgo = now - 4 * msPerWeek;

    // Get all mentions in last 28 days for this theme
    const recentMentions = await ctx.db
      .query("themeMentions")
      .withIndex("by_theme_and_time", (q) =>
        q.eq("themeId", args.themeId).gte("timestamp", twentyEightDaysAgo),
      )
      .collect();

    // Split into last 7 days vs trailing 28 days
    let recentSum = 0;
    let trailingSum = 0;
    for (const m of recentMentions) {
      if (m.timestamp >= sevenDaysAgo) {
        recentSum += m.relevanceScore;
      }
      trailingSum += m.relevanceScore;
    }

    // Baseline = average weekly relevance over 4 weeks
    const baselineMentions = trailingSum / 4;
    const heatScore = recentSum / Math.max(baselineMentions, 1);

    // Get the theme to read totalMentions
    const theme = await ctx.db.get(args.themeId);
    if (!theme) throw new ConvexError("Theme not found");

    const heatStatus = computeHeatStatus(heatScore, now, now);

    // 3. Update the theme
    await ctx.db.patch(args.themeId, {
      heatScore,
      heatStatus,
      totalMentions: theme.totalMentions + 1,
      lastMentionAt: now,
    });

    // 4. Recompute trendingScore for all podcasts linked to this theme
    const allPodcasts = await ctx.db.query("podcasts").collect();
    const linkedPodcasts = allPodcasts.filter((p) =>
      p.themeIds?.includes(args.themeId),
    );

    for (const podcast of linkedPodcasts) {
      if (!podcast.themeIds) continue;

      // Sum heat scores of all linked themes
      let score = 0;
      for (const tid of podcast.themeIds) {
        const t = await ctx.db.get(tid);
        if (t) score += t.heatScore;
      }
      await ctx.db.patch(podcast._id, { trendingScore: score });
    }
  },
});

export const updateThemeSummary = mutation({
  args: {
    themeId: v.id("macroThemes"),
    summary: v.string(),
    riskChain: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.themeId, {
      latestSummary: args.summary,
      riskChain: args.riskChain,
    });
  },
});

// Internal: link themes to a podcast and set its trendingScore
export const linkThemesToPodcast = mutation({
  args: {
    podcastId: v.id("podcasts"),
    themeIds: v.array(v.id("macroThemes")),
  },
  handler: async (ctx, args) => {
    // Compute trending score = sum of heat scores
    let trendingScore = 0;
    for (const tid of args.themeIds) {
      const theme = await ctx.db.get(tid);
      if (theme) trendingScore += theme.heatScore;
    }

    await ctx.db.patch(args.podcastId, {
      themeIds: args.themeIds,
      trendingScore,
    });
  },
});
```

**Step 2: Verify**

Run: `npx convex dev` — should compile with no errors.

**Step 3: Commit**

```bash
git add convex/themes.ts
git commit -m "feat: add theme queries, mutations, and heat score computation"
```

---

## Task 3: Backend — OpenAI Theme Tagging Actions

**Files:**
- Create: `convex/themeActions.ts`

This file uses `"use node"` since it calls OpenAI. It's separate from `convex/themes.ts` because Convex requires `"use node"` files to only export actions.

**Step 1: Create `convex/themeActions.ts`**

```typescript
"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

export const tagPodcastThemes = action({
  args: {
    podcastId: v.id("podcasts"),
    scriptText: v.string(),
    sourceArticleUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new ConvexError("OPENAI_API_KEY is not set");

    const openai = new OpenAI({ apiKey });

    // 1. Get existing themes to guide GPT mapping
    const existingThemes = await ctx.runQuery(api.themes.getTrendingThemes);
    const themeList = existingThemes
      .map((t) => `${t.slug} (${t.label} — ${t.category})`)
      .join("\n");

    // 2. Ask GPT to identify themes
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a macro economics analyst. Given a podcast script, identify the macro economic themes discussed. Return ONLY a JSON array — no other text.

Each item must have:
- slug: URL-friendly lowercase identifier (e.g. "us-inflation", "fed-policy")
- label: Human-readable name (e.g. "US Inflation", "Fed Policy")
- category: One of: "Monetary Policy", "Geopolitics", "Commodities", "Trade", "Labor", "Energy", "Fiscal Policy", "Markets", "Technology", "Real Estate", "Regulation"
- regions: Array of region codes: "US", "EU", "UK", "CN", "JP", "EM" (emerging markets), "Global"
- assetClasses: Array from: "rates", "FX", "equities", "commodities", "credit", "crypto"
- sentiment: "hawkish", "dovish", or "neutral"
- relevanceScore: 0 to 1, how central this theme is to the script
- summary: One sentence summarizing what the script says about this theme

Map to these existing themes where possible (use the same slug):
${themeList || "(no existing themes)"}

If a genuinely new theme is identified, include it with a new slug.`,
        },
        {
          role: "user",
          content: args.scriptText.slice(0, 8000),
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Failed to parse theme tags:", text);
      return;
    }

    interface ThemeTag {
      slug: string;
      label: string;
      category: string;
      regions: string[];
      assetClasses: string[];
      sentiment: string;
      relevanceScore: number;
      summary: string;
    }

    let tags: ThemeTag[];
    try {
      tags = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("JSON parse error for theme tags:", jsonMatch[0]);
      return;
    }

    // 3. For each tag: create/find theme, record mention, collect themeIds
    const themeIds: string[] = [];

    for (const tag of tags) {
      // Create or find theme
      const themeId = await ctx.runMutation(api.themes.createTheme, {
        slug: tag.slug,
        label: tag.label,
        category: tag.category,
        regions: tag.regions || [],
        assetClasses: tag.assetClasses || [],
      });

      themeIds.push(themeId);

      // Record mention
      await ctx.runMutation(api.themes.recordMention, {
        themeId,
        sourceType: "news-podcast",
        sourceId: args.podcastId,
        sentiment: tag.sentiment || "neutral",
        relevanceScore: Math.min(Math.max(tag.relevanceScore || 0.5, 0), 1),
        summary: tag.summary || "",
        sourceArticles: args.sourceArticleUrls,
      });
    }

    // 4. Link themes to podcast
    if (themeIds.length > 0) {
      await ctx.runMutation(api.themes.linkThemesToPodcast, {
        podcastId: args.podcastId,
        themeIds: themeIds as any,
      });
    }

    // 5. Generate/update summaries for each tagged theme
    for (const themeId of themeIds) {
      try {
        await ctx.runAction(api.themeActions.generateThemeSummary, {
          themeId: themeId as any,
        });
      } catch (e) {
        console.error("Failed to generate summary for theme:", themeId, e);
      }
    }
  },
});

export const generateThemeSummary = action({
  args: { themeId: v.id("macroThemes") },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new ConvexError("OPENAI_API_KEY is not set");

    const openai = new OpenAI({ apiKey });

    // Get the theme
    const theme = await ctx.runQuery(api.themes.getThemeBySlug, { slug: "" });
    // Actually we need to get by ID — use getThemeMentions to get context
    const mentions = await ctx.runQuery(api.themes.getThemeMentions, {
      themeId: args.themeId,
      limit: 10,
    });

    if (mentions.length === 0) return;

    const mentionSummaries = mentions
      .map((m, i) => `${i + 1}. [${m.sentiment}] ${m.summary}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a macro economics analyst writing brief summaries for asset managers. Be concise and precise. Return ONLY a JSON object with two fields:
- "summary": 2-3 sentence consolidated overview of the latest developments
- "riskChain": A risk implication chain in the format "Event → Mechanism → Market Impact" (one chain, most important)`,
        },
        {
          role: "user",
          content: `Here are the latest mention summaries for this macro theme:\n\n${mentionSummaries}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      await ctx.runMutation(api.themes.updateThemeSummary, {
        themeId: args.themeId,
        summary: parsed.summary || "",
        riskChain: parsed.riskChain || "",
      });
    } catch {
      console.error("Failed to parse theme summary:", text);
    }
  },
});
```

**Step 2: Verify**

Run: `npx convex dev` — should compile with no errors.

**Step 3: Commit**

```bash
git add convex/themeActions.ts
git commit -m "feat: add tagPodcastThemes and generateThemeSummary OpenAI actions"
```

---

## Task 4: Seed Data Script

**Files:**
- Create: `convex/seedThemes.ts`

This creates a one-time mutation to populate initial macro themes so the demo starts with data.

**Step 1: Create `convex/seedThemes.ts`**

```typescript
import { mutation } from "./_generated/server";

const SEED_THEMES = [
  {
    slug: "us-inflation",
    label: "US Inflation",
    category: "Monetary Policy",
    regions: ["US"],
    assetClasses: ["rates", "FX", "equities"],
    heatScore: 2.4,
    heatStatus: "hot",
  },
  {
    slug: "fed-policy",
    label: "Fed Policy",
    category: "Monetary Policy",
    regions: ["US", "Global"],
    assetClasses: ["rates", "FX", "equities", "credit"],
    heatScore: 2.1,
    heatStatus: "hot",
  },
  {
    slug: "ecb-policy",
    label: "ECB Policy",
    category: "Monetary Policy",
    regions: ["EU"],
    assetClasses: ["rates", "FX"],
    heatScore: 1.5,
    heatStatus: "warming",
  },
  {
    slug: "boj-policy",
    label: "BOJ Policy",
    category: "Monetary Policy",
    regions: ["JP"],
    assetClasses: ["rates", "FX"],
    heatScore: 1.8,
    heatStatus: "warming",
  },
  {
    slug: "china-trade",
    label: "China Trade",
    category: "Trade",
    regions: ["CN", "US", "Global"],
    assetClasses: ["equities", "commodities", "FX"],
    heatScore: 1.9,
    heatStatus: "warming",
  },
  {
    slug: "oil-prices",
    label: "Oil Prices",
    category: "Commodities",
    regions: ["Global"],
    assetClasses: ["commodities", "equities", "FX"],
    heatScore: 1.4,
    heatStatus: "warming",
  },
  {
    slug: "us-labor-market",
    label: "US Labor Market",
    category: "Labor",
    regions: ["US"],
    assetClasses: ["rates", "equities"],
    heatScore: 1.1,
    heatStatus: "stable",
  },
  {
    slug: "eurozone-growth",
    label: "Eurozone Growth",
    category: "Fiscal Policy",
    regions: ["EU"],
    assetClasses: ["rates", "equities", "FX"],
    heatScore: 0.9,
    heatStatus: "stable",
  },
  {
    slug: "usd-strength",
    label: "USD Strength",
    category: "Markets",
    regions: ["US", "Global"],
    assetClasses: ["FX", "commodities"],
    heatScore: 1.6,
    heatStatus: "warming",
  },
  {
    slug: "emerging-markets",
    label: "Emerging Markets",
    category: "Markets",
    regions: ["EM", "Global"],
    assetClasses: ["equities", "FX", "credit"],
    heatScore: 0.8,
    heatStatus: "stable",
  },
  {
    slug: "global-supply-chains",
    label: "Global Supply Chains",
    category: "Trade",
    regions: ["Global"],
    assetClasses: ["equities", "commodities"],
    heatScore: 0.5,
    heatStatus: "cooling",
  },
  {
    slug: "ai-productivity",
    label: "AI & Productivity",
    category: "Technology",
    regions: ["US", "Global"],
    assetClasses: ["equities"],
    heatScore: 2.3,
    heatStatus: "hot",
  },
  {
    slug: "us-housing",
    label: "US Housing",
    category: "Real Estate",
    regions: ["US"],
    assetClasses: ["rates", "credit"],
    heatScore: 0.6,
    heatStatus: "cooling",
  },
  {
    slug: "crypto-regulation",
    label: "Crypto Regulation",
    category: "Regulation",
    regions: ["US", "EU"],
    assetClasses: ["crypto"],
    heatScore: 1.2,
    heatStatus: "stable",
  },
  {
    slug: "climate-energy-transition",
    label: "Climate & Energy Transition",
    category: "Energy",
    regions: ["Global", "EU"],
    assetClasses: ["commodities", "equities"],
    heatScore: 0.4,
    heatStatus: "cooling",
  },
];

export const seedMacroThemes = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("macroThemes").first();
    if (existing) {
      return "Already seeded — skipping";
    }

    const now = Date.now();

    for (const theme of SEED_THEMES) {
      await ctx.db.insert("macroThemes", {
        ...theme,
        totalMentions: Math.floor(theme.heatScore * 10),
        lastMentionAt: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        latestSummary: undefined,
        riskChain: undefined,
      });
    }

    return `Seeded ${SEED_THEMES.length} macro themes`;
  },
});
```

**Step 2: Run the seed**

In the Convex dashboard or via the CLI:
```bash
npx convex run seedThemes:seedMacroThemes
```
Expected: "Seeded 15 macro themes"

**Step 3: Commit**

```bash
git add convex/seedThemes.ts
git commit -m "feat: add seed script with 15 starter macro themes"
```

---

## Task 5: ThemeBadge and MentionSparkline Components

**Files:**
- Create: `components/ThemeBadge.tsx`
- Create: `components/MentionSparkline.tsx`

**Step 1: Create `components/ThemeBadge.tsx`**

```tsx
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  hot: { color: "bg-red-500", bg: "bg-red-500/10", label: "Hot" },
  warming: { color: "bg-orange-1", bg: "bg-orange-1/10", label: "Warming" },
  stable: { color: "bg-yellow-400", bg: "bg-yellow-400/10", label: "Stable" },
  cooling: { color: "bg-blue-400", bg: "bg-blue-400/10", label: "Cooling" },
  dormant: { color: "bg-gray-400", bg: "bg-gray-400/10", label: "Dormant" },
};

const ThemeBadge = ({
  status,
  label,
  size = "sm",
}: {
  status: string;
  label?: string;
  size?: "sm" | "md";
}) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.dormant;

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border-2 border-current/20 ${config.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
        <span className="text-10 font-bold uppercase tracking-wider text-white-1">
          {label ?? config.label}
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 border-4 ${config.bg}`}
      style={{ borderColor: "var(--color-mid-gray)" }}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
      <span className="text-12 font-bold uppercase tracking-wider text-white-1">
        {label ?? config.label}
      </span>
    </span>
  );
};

export default ThemeBadge;
```

**Step 2: Create `components/MentionSparkline.tsx`**

```tsx
const MentionSparkline = ({
  data,
  width = 80,
  height = 24,
  color = "var(--color-orange)",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) => {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * innerWidth;
      const y = padding + innerHeight - (val / max) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");

  // Fill area path
  const firstX = padding;
  const lastX = padding + innerWidth;
  const fillPath = `M ${firstX},${padding + innerHeight} L ${points.split(" ").map((p) => p).join(" L ")} L ${lastX},${padding + innerHeight} Z`;

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      {/* Fill */}
      <path d={fillPath} fill={color} opacity={0.15} />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last point dot */}
      {data.length > 0 && (
        <circle
          cx={padding + innerWidth}
          cy={padding + innerHeight - (data[data.length - 1] / max) * innerHeight}
          r={2}
          fill={color}
        />
      )}
    </svg>
  );
};

export default MentionSparkline;
```

**Step 3: Commit**

```bash
git add components/ThemeBadge.tsx components/MentionSparkline.tsx
git commit -m "feat: add ThemeBadge and MentionSparkline reusable components"
```

---

## Task 6: TrendingTopics Component + RightSidebar Update

**Files:**
- Create: `components/TrendingTopics.tsx`
- Modify: `components/RightSidebar.tsx`

**Step 1: Create `components/TrendingTopics.tsx`**

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import ThemeBadge from "./ThemeBadge";
import MentionSparkline from "./MentionSparkline";
import { TrendingUp } from "lucide-react";

const TrendingTopicItem = ({ theme }: { theme: any }) => {
  const sparklineData = useQuery(api.themes.getWeeklyMentionCounts, {
    themeId: theme._id,
    weeks: 4,
  });

  return (
    <Link
      href={`/topics/${theme.slug}`}
      className="flex items-center gap-3 p-3 border-2 border-transparent hover:border-orange-1 hover:bg-orange-1/5 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-14 font-bold text-white-1 truncate group-hover:text-orange-1 transition-colors uppercase tracking-wide">
            {theme.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeBadge status={theme.heatStatus} />
          <span className="text-10 text-white-4">
            {theme.totalMentions} mention{theme.totalMentions !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      {sparklineData && sparklineData.length > 1 && (
        <MentionSparkline data={sparklineData} />
      )}
    </Link>
  );
};

const TrendingTopics = () => {
  const themes = useQuery(api.themes.getTrendingThemes);

  if (!themes) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-orange-1" />
        <h2 className="text-16 font-black text-white-1 uppercase tracking-wide">
          Trending Topics
        </h2>
      </div>
      <div className="flex flex-col gap-1">
        {themes.slice(0, 10).map((theme) => (
          <TrendingTopicItem key={theme._id} theme={theme} />
        ))}
      </div>
    </section>
  );
};

export default TrendingTopics;
```

**Step 2: Update `components/RightSidebar.tsx`**

Replace the entire file:

```tsx
"use client";

import { useUser, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAudio } from "@/app/providers/AudioProvider";
import { ChevronRight } from "lucide-react";
import TrendingTopics from "./TrendingTopics";

const RightSidebar = ({ inline = false }: { inline?: boolean }) => {
  const { user } = useUser();
  const { audio } = useAudio();

  const content = (
    <>
      <SignedIn>
        <Link
          href={`/profile/${user?.id}`}
          className="flex items-center gap-3 pb-8"
        >
          <UserButton />
          <div className="flex items-center justify-between w-full">
            <h1 className="text-16 truncate font-semibold text-white-1">
              {user?.firstName} {user?.lastName}
            </h1>
            <ChevronRight size={20} className="text-white-4" />
          </div>
        </Link>
      </SignedIn>

      <TrendingTopics />
    </>
  );

  if (inline) {
    return <div className="space-y-6 text-white-1">{content}</div>;
  }

  return (
    <section className={cn("right_sidebar text-white-1", { "h-[calc(100vh-140px)]": audio?.audioUrl })}>
      {content}
    </section>
  );
};

export default RightSidebar;
```

**Step 3: Verify**

Run: `npm run dev` — right sidebar should show trending topics with heat badges. Verify clicking a topic navigates to `/topics/<slug>` (page will 404 until Task 8).

**Step 4: Commit**

```bash
git add components/TrendingTopics.tsx components/RightSidebar.tsx
git commit -m "feat: replace right sidebar with trending macro topics"
```

---

## Task 7: Home Page — Trending Score Sort + PodcastCard Badges

**Files:**
- Modify: `convex/podcast.ts` (`getTrendingPodcasts` query)
- Modify: `app/(root)/page.tsx`
- Modify: `components/PodcastCard.tsx`

**Step 1: Update `getTrendingPodcasts` in `convex/podcast.ts`**

Replace the existing `getTrendingPodcasts` query (lines 69-74):

```typescript
export const getTrendingPodcasts = query({
  args: {},
  handler: async (ctx) => {
    const podcasts = await ctx.db.query("podcasts").collect();
    // Sort by trendingScore desc, fallback to views
    podcasts.sort((a, b) => {
      const scoreA = a.trendingScore ?? 0;
      const scoreB = b.trendingScore ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.views - a.views;
    });
    return podcasts;
  },
});
```

**Step 2: Update `components/PodcastCard.tsx` — add `themes` prop and badges**

Replace the entire file:

```tsx
"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { normalizeImageSrc } from "@/lib/utils";
import { Headphones } from "lucide-react";
import ThemeBadge from "./ThemeBadge";

interface ThemeInfo {
  label: string;
  heatStatus: string;
}

const PodcastCard = ({
  imgURL,
  title,
  description,
  podcastId,
  themes,
}: {
  imgURL: string;
  title: string;
  description: string;
  podcastId: Id<"podcasts">;
  themes?: ThemeInfo[];
}) => {
  const router = useRouter();
  const updateViews = useMutation(api.podcast.updatePodcastViews);
  const [src, setSrc] = React.useState(() => normalizeImageSrc(imgURL));
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = async () => {
    await updateViews({ podcastId });
    router.push(`/podcast/${podcastId}`, { scroll: true });
  };

  return (
    <button
      type="button"
      className="cursor-pointer group animate-rotate-in text-left w-full"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <figure className="relative">
        {/* Main Card Container */}
        <div className="card-brutal overflow-hidden transition-all duration-300 group-hover:border-orange-1">
          {/* Image Container with Overlay */}
          <div className="relative aspect-square overflow-hidden noise-texture">
            <Image
              src={src}
              width={400}
              height={400}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setSrc("/placeholder.svg")}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Hover Play Icon */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}>
              <div className="bg-orange-1 border-4 border-charcoal p-4 rounded-none shadow-brutal-lg">
                <Headphones className="w-8 h-8 text-charcoal" />
              </div>
            </div>

            {/* Corner Accent */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-1 transform translate-x-8 -translate-y-8 rotate-45 opacity-60" />
          </div>

          {/* Content Section */}
          <div className="p-4 bg-black-1 border-t-4 border-orange-1 relative">
            {/* Accent Stripe */}
            <div className="absolute left-0 top-0 w-1 h-full bg-orange-1" />

            <div className="pl-3">
              {/* Title */}
              <h1 className="text-18 font-bold text-white-1 mb-2 line-clamp-2 group-hover:text-orange-1 transition-colors uppercase tracking-wide">
                {title}
              </h1>

              {/* Description */}
              <h2 className="text-14 text-white-4 line-clamp-2 font-serif italic">
                {description}
              </h2>

              {/* Theme Badges */}
              {themes && themes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-mid-gray/30">
                  {themes.slice(0, 3).map((t) => (
                    <ThemeBadge key={t.label} status={t.heatStatus} label={t.label} />
                  ))}
                  {themes.length > 3 && (
                    <span className="text-10 text-white-4 font-bold self-center">
                      +{themes.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Decorative Element — only show if no themes */}
              {(!themes || themes.length === 0) && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-mid-gray/30">
                  <div className="h-1 w-12 bg-orange-1" />
                  <span className="text-10 text-white-4 uppercase tracking-widest font-bold">
                    Episode
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </figure>
    </button>
  );
};

export default PodcastCard;
```

**Step 3: Update `app/(root)/page.tsx` — pass themes to PodcastCard**

Replace the entire file:

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import PodcastCard from "@/components/PodcastCard";
import { Loader, Mic2 } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

const Home = () => {
  const trendingPodcasts = useQuery(api.podcast.getTrendingPodcasts);
  const allThemes = useQuery(api.themes.getTrendingThemes);

  // Build a lookup map: themeId -> { label, heatStatus }
  const themeMap = new Map<string, { label: string; heatStatus: string }>();
  if (allThemes) {
    for (const t of allThemes) {
      themeMap.set(t._id, { label: t.label, heatStatus: t.heatStatus });
    }
  }

  return (
    <div className="mt-9 flex flex-col gap-9">
      <section className="flex flex-col gap-5">
        <h1 className="text-20 font-bold text-white-1">Trending Podcasts</h1>

        {trendingPodcasts === undefined ? (
          <div className="flex-center h-40">
            <Loader size={24} className="animate-spin text-orange-1" />
          </div>
        ) : trendingPodcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 border-4 border-dashed border-mid-gray">
            <Mic2 size={48} className="text-white-4" />
            <p className="text-18 font-bold text-white-4">No podcasts yet</p>
            <p className="text-14 text-white-4 font-serif italic">
              Be the first to create one!
            </p>
            <Link
              href="/create-podcast"
              className="btn-brutal mt-2 text-14 px-6 py-3"
            >
              Create Podcast
            </Link>
          </div>
        ) : (
          <div className="podcast_grid">
            {trendingPodcasts.map(({ _id, podcastTitle, podcastDescription, imageUrl, themeIds }) => {
              const themes = (themeIds ?? [])
                .map((id: Id<"macroThemes">) => themeMap.get(id))
                .filter(Boolean) as { label: string; heatStatus: string }[];

              return (
                <PodcastCard
                  key={_id}
                  imgURL={imageUrl ?? ""}
                  title={podcastTitle}
                  description={podcastDescription}
                  podcastId={_id}
                  themes={themes}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
```

**Step 4: Verify**

Run: `npm run dev` — home page should load, podcasts sorted by trendingScore (existing ones will have no score, so they appear in default order). Theme badges appear on any podcast that gets tagged later.

**Step 5: Commit**

```bash
git add convex/podcast.ts components/PodcastCard.tsx "app/(root)/page.tsx"
git commit -m "feat: sort home feed by trendingScore, add theme badges to podcast cards"
```

---

## Task 8: Topic Detail Page

**Files:**
- Create: `app/(root)/topics/[topicSlug]/page.tsx`
- Create: `components/SentimentBreakdown.tsx`
- Create: `components/RiskChainDisplay.tsx`

**Step 1: Create `components/SentimentBreakdown.tsx`**

```tsx
const SentimentBreakdown = ({
  hawkish,
  dovish,
  neutral,
}: {
  hawkish: number;
  dovish: number;
  neutral: number;
}) => {
  const total = hawkish + dovish + neutral;
  if (total === 0) {
    return (
      <p className="text-12 text-white-4 font-serif italic">No sentiment data yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Bar */}
      <div className="flex h-3 w-full border-2 border-mid-gray overflow-hidden">
        {hawkish > 0 && (
          <div
            className="bg-red-500 h-full"
            style={{ width: `${hawkish}%` }}
          />
        )}
        {neutral > 0 && (
          <div
            className="bg-yellow-400 h-full"
            style={{ width: `${neutral}%` }}
          />
        )}
        {dovish > 0 && (
          <div
            className="bg-blue-400 h-full"
            style={{ width: `${dovish}%` }}
          />
        )}
      </div>
      {/* Labels */}
      <div className="flex justify-between text-10 font-bold uppercase tracking-wider">
        <span className="text-red-400">Hawkish {hawkish}%</span>
        <span className="text-yellow-400">Neutral {neutral}%</span>
        <span className="text-blue-400">Dovish {dovish}%</span>
      </div>
    </div>
  );
};

export default SentimentBreakdown;
```

**Step 2: Create `components/RiskChainDisplay.tsx`**

```tsx
import { AlertTriangle } from "lucide-react";

const RiskChainDisplay = ({ riskChain }: { riskChain: string }) => {
  if (!riskChain) return null;

  return (
    <div className="p-4 border-4 border-orange-1/30 bg-orange-1/5">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-orange-1" />
        <span className="text-12 font-bold uppercase tracking-wider text-orange-1">
          Risk Implication
        </span>
      </div>
      <p className="text-14 text-white-1 font-medium">
        {riskChain}
      </p>
    </div>
  );
};

export default RiskChainDisplay;
```

**Step 3: Create `app/(root)/topics/[topicSlug]/page.tsx`**

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader, ArrowLeft, TrendingUp, BarChart3, Mic2 } from "lucide-react";
import Link from "next/link";
import ThemeBadge from "@/components/ThemeBadge";
import MentionSparkline from "@/components/MentionSparkline";
import SentimentBreakdown from "@/components/SentimentBreakdown";
import RiskChainDisplay from "@/components/RiskChainDisplay";
import PodcastCard from "@/components/PodcastCard";

const TopicDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.topicSlug as string;

  const theme = useQuery(api.themes.getThemeBySlug, { slug });
  const sparklineData = useQuery(
    api.themes.getWeeklyMentionCounts,
    theme ? { themeId: theme._id, weeks: 8 } : "skip",
  );
  const sentiment = useQuery(
    api.themes.getSentimentBreakdown,
    theme ? { themeId: theme._id } : "skip",
  );
  const podcasts = useQuery(
    api.themes.getPodcastsByTheme,
    theme ? { themeId: theme._id } : "skip",
  );
  const allThemes = useQuery(api.themes.getTrendingThemes);

  // Theme lookup for podcast cards
  const themeMap = new Map<string, { label: string; heatStatus: string }>();
  if (allThemes) {
    for (const t of allThemes) {
      themeMap.set(t._id, { label: t.label, heatStatus: t.heatStatus });
    }
  }

  if (theme === undefined) {
    return (
      <div className="flex-center h-60">
        <Loader size={30} className="animate-spin text-orange-1" />
      </div>
    );
  }

  if (theme === null) {
    return (
      <div className="mt-9 flex flex-col items-center gap-4 py-16">
        <p className="text-18 font-bold text-white-4">Topic not found</p>
        <button
          onClick={() => router.back()}
          className="btn-brutal px-6 py-3 text-14"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Compute week-over-week delta
  let weekDelta = 0;
  if (sparklineData && sparklineData.length >= 2) {
    const thisWeek = sparklineData[sparklineData.length - 1];
    const lastWeek = sparklineData[sparklineData.length - 2];
    weekDelta = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white-4 hover:text-orange-1 transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        <span className="text-12 font-bold uppercase tracking-wider">Back</span>
      </button>

      {/* Header */}
      <div className="card-brutal p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-display text-white-1 mb-3">{theme.label}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeBadge status={theme.heatStatus} size="md" />
              <span className="text-12 font-bold uppercase tracking-wider text-white-4 border-2 border-mid-gray px-2 py-0.5">
                {theme.category}
              </span>
              {theme.regions.map((r) => (
                <span key={r} className="text-10 font-bold uppercase tracking-wider text-white-4 bg-mid-gray/30 px-2 py-0.5">
                  {r}
                </span>
              ))}
              {theme.assetClasses.map((a) => (
                <span key={a} className="text-10 font-bold uppercase tracking-wider text-orange-1/70 bg-orange-1/10 px-2 py-0.5">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        {theme.latestSummary && (
          <div className="mb-6 p-4 border-l-4 border-orange-1 bg-orange-1/5">
            <p className="text-14 text-white-2 font-serif italic leading-relaxed">
              {theme.latestSummary}
            </p>
          </div>
        )}

        {/* Risk Chain */}
        {theme.riskChain && <RiskChainDisplay riskChain={theme.riskChain} />}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-brutal p-4">
          <p className="text-10 uppercase tracking-wider text-white-4 font-bold mb-1">Heat Score</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-1" />
            <span className="text-24 font-black text-white-1">{theme.heatScore.toFixed(1)}</span>
          </div>
        </div>
        <div className="card-brutal p-4">
          <p className="text-10 uppercase tracking-wider text-white-4 font-bold mb-1">Total Mentions</p>
          <span className="text-24 font-black text-white-1">{theme.totalMentions}</span>
        </div>
        <div className="card-brutal p-4">
          <p className="text-10 uppercase tracking-wider text-white-4 font-bold mb-1">Week / Week</p>
          <div className="flex items-center gap-1">
            <span className={`text-24 font-black ${weekDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
              {weekDelta >= 0 ? "+" : ""}{weekDelta}%
            </span>
          </div>
        </div>
        <div className="card-brutal p-4">
          <p className="text-10 uppercase tracking-wider text-white-4 font-bold mb-1">Activity</p>
          {sparklineData && <MentionSparkline data={sparklineData} width={120} height={40} />}
        </div>
      </div>

      {/* Sentiment */}
      <div className="card-brutal p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-orange-1" />
          <h2 className="text-16 font-black text-white-1 uppercase tracking-wide">Sentiment</h2>
        </div>
        {sentiment && (
          <SentimentBreakdown
            hawkish={sentiment.hawkish}
            dovish={sentiment.dovish}
            neutral={sentiment.neutral}
          />
        )}
      </div>

      {/* Related Podcasts */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Mic2 className="w-5 h-5 text-orange-1" />
          <h2 className="text-16 font-black text-white-1 uppercase tracking-wide">Related Podcasts</h2>
        </div>

        {podcasts === undefined ? (
          <div className="flex-center h-20">
            <Loader size={20} className="animate-spin text-orange-1" />
          </div>
        ) : podcasts.length === 0 ? (
          <div className="card-brutal p-8 flex flex-col items-center gap-4">
            <p className="text-14 text-white-4 font-serif italic">No podcasts about this topic yet</p>
            <Link
              href={`/create-news-podcast?topic=${encodeURIComponent(theme.label)}`}
              className="btn-brutal px-6 py-3 text-14"
            >
              Create a Podcast About {theme.label}
            </Link>
          </div>
        ) : (
          <div className="podcast_grid">
            {podcasts.map((p) => {
              const pThemes = (p.themeIds ?? [])
                .map((id) => themeMap.get(id))
                .filter(Boolean) as { label: string; heatStatus: string }[];

              return (
                <PodcastCard
                  key={p._id}
                  imgURL={p.imageUrl ?? ""}
                  title={p.podcastTitle}
                  description={p.podcastDescription}
                  podcastId={p._id}
                  themes={pThemes}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicDetailPage;
```

**Step 4: Verify**

Run: `npm run dev` — navigate to `/topics/us-inflation` (or any seeded slug). Should show the topic detail page with metrics. Podcasts section will be empty until podcasts are tagged.

**Step 5: Commit**

```bash
git add components/SentimentBreakdown.tsx components/RiskChainDisplay.tsx "app/(root)/topics/[topicSlug]/page.tsx"
git commit -m "feat: add topic detail page with metrics, sentiment, and related podcasts"
```

---

## Task 9: TopicSelector + Create Flow — Wire Async Theme Tagging

**Files:**
- Modify: `components/TopicSelector.tsx`
- Modify: `app/(root)/create-news-podcast/page.tsx`

**Step 1: Replace `components/TopicSelector.tsx` with theme-aware version**

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import ThemeBadge from "./ThemeBadge";

interface TopicSelectorProps {
  selectedTopic: string | null;
  onSelect: (topic: string) => void;
}

const TopicSelector = ({ selectedTopic, onSelect }: TopicSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const trendingThemes = useQuery(api.themes.getTrendingThemes);
  const searchResults = useQuery(
    api.themes.searchThemes,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip",
  );

  const displayThemes = searchQuery.length >= 2 ? searchResults : trendingThemes;

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white-4" />
        <Input
          className="input-class pl-12 text-16"
          placeholder="Search macro topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Trending label */}
      {!searchQuery && (
        <p className="text-12 font-bold uppercase tracking-wider text-white-4">
          Trending Topics
        </p>
      )}

      {/* Topics grid */}
      {!displayThemes ? (
        <div className="flex-center py-8">
          <Loader size={24} className="animate-spin text-orange-1" />
        </div>
      ) : displayThemes.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-14 text-white-4">No topics found</p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSelect(searchQuery)}
              className="btn-brutal mt-4 px-4 py-2 text-12"
            >
              Use &quot;{searchQuery}&quot; as custom topic
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {displayThemes.map((theme) => {
            const isSelected = selectedTopic === theme.label;

            return (
              <button
                key={theme._id}
                type="button"
                onClick={() => onSelect(theme.label)}
                className={`group min-w-0 overflow-hidden p-5 text-left transition-all ${
                  isSelected
                    ? "card-brutal border-orange-1 bg-orange-1/10"
                    : "card-brutal hover:border-orange-1"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <ThemeBadge status={theme.heatStatus} />
                  <span className="text-10 text-white-4 font-bold">
                    {theme.heatScore.toFixed(1)}
                  </span>
                </div>
                <p
                  className={`text-14 font-bold uppercase tracking-wide truncate ${
                    isSelected ? "text-orange-1" : "text-white-1"
                  }`}
                >
                  {theme.label}
                </p>
                <p className="text-10 text-white-4 mt-1 truncate">
                  {theme.category} · {theme.regions.join(", ")}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopicSelector;
```

**Step 2: Update `app/(root)/create-news-podcast/page.tsx` — add async theme tagging after publish**

Make these specific changes to the file:

**2a. Add the import for the theme tagging action (near top, after other imports):**

Add after line 37 (`import { readDraft, useDraftSave } from "@/lib/useDraftPersistence";`):
```typescript
// Will be used for async theme tagging after publish
```

**2b. Add the `useAction` for `tagPodcastThemes` inside the component:**

After line 92 (`const createPodcast = useMutation(api.podcast.createPodcast);`), add:
```typescript
const tagThemes = useAction(api.themeActions.tagPodcastThemes);
```

**2c. Update the `handlePublish` function to fire async tagging after publish:**

Replace the `handlePublish` function (lines 261-304) with:

```typescript
  const handlePublish = async () => {
    if (!audioUrl || !imageUrl || !voiceType) {
      toast.error("Please generate audio and thumbnail first");
      return;
    }
    if (!audioStorageId || !imageStorageId) {
      toast.error("Missing storage IDs — please regenerate");
      return;
    }
    if (!podcastTitle.trim() || !podcastDescription.trim()) {
      toast.error("Please fill in the title and description");
      return;
    }

    setIsSubmitting(true);

    try {
      const podcastId = await createPodcast({
        podcastTitle,
        podcastDescription,
        audioUrl,
        imageUrl,
        voiceType,
        imagePrompt,
        voicePrompt: script,
        views: 0,
        audioDuration,
        audioStorageId,
        imageStorageId,
      });

      toast.success("News podcast published!");
      clearDraft();

      // Fire async theme tagging — don't await, let it run in background
      const articleUrls = selectedArticleIndexes
        .map((i) => articles[i]?.url)
        .filter(Boolean);

      tagThemes({
        podcastId,
        scriptText: script,
        sourceArticleUrls: articleUrls,
      }).then(() => {
        console.log("Theme tagging complete for podcast:", podcastId);
      }).catch((err) => {
        console.error("Theme tagging failed:", err);
      });

      router.push("/");
    } catch (error) {
      console.error("Error publishing podcast:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to publish. Please try again."
      );
      setIsSubmitting(false);
    }
  };
```

**Step 3: Verify end-to-end**

Run: `npm run dev`
1. Go to create-news-podcast
2. TopicSelector should show macro themes (US Inflation, Fed Policy, etc.) instead of generic categories
3. Select a topic, go through the flow, publish
4. After publish, navigate to home — podcast appears immediately
5. Within ~10 seconds, theme badges should appear on the card (Convex reactivity)
6. Right sidebar trending scores should update
7. Topic detail page should now show the podcast under "Related Podcasts"

**Step 4: Commit**

```bash
git add components/TopicSelector.tsx "app/(root)/create-news-podcast/page.tsx"
git commit -m "feat: replace topic selector with macro themes, wire async theme tagging on publish"
```

---

## Task 10: Add Topics Link to Sidebar Navigation

**Files:**
- Modify: `constants/index.ts`

**Step 1: Remove the old `newsTopics` export (no longer used) and update sidebar**

The `newsTopics` constant is no longer used since TopicSelector now queries Convex. Remove it and leave only what's needed:

```typescript
export const sidebarLinks = [
  {
    route: "/",
    label: "Home",
    imgURL: "/icons/home.svg",
  },
  {
    route: "/discover",
    label: "Discover",
    imgURL: "/icons/discover.svg",
  },
  {
    route: "/create-podcast",
    label: "Create Podcast",
    imgURL: "/icons/microphone.svg",
  },
  {
    route: "/create-news-podcast",
    label: "News Podcast",
    imgURL: "/icons/newspaper.svg",
  },
  {
    route: "/profile",
    label: "Profile",
    imgURL: "/icons/profile.svg",
  },
];

export const voiceCategories = ["alloy", "shimmer", "nova", "echo", "fable", "onyx"];

export const scriptTones = [
  { value: "casual", label: "Casual" },
  { value: "professional", label: "Professional" },
  { value: "analytical", label: "Analytical" },
] as const;

export const scriptDurations = [
  { value: "short", label: "Short (~2 min)" },
  { value: "medium", label: "Medium (~5 min)" },
  { value: "long", label: "Long (~10 min)" },
] as const;
```

**Step 2: Verify no remaining imports of `newsTopics`**

Search codebase for `newsTopics` — only the old `TopicSelector.tsx` imported it, and we replaced that file entirely. Confirm no build errors.

**Step 3: Commit**

```bash
git add constants/index.ts
git commit -m "chore: remove unused newsTopics constant, clean up constants"
```

---

## Task 11: Final Verification — End-to-End Demo Flow

**Step 1: Ensure seed data exists**

```bash
npx convex run seedThemes:seedMacroThemes
```

**Step 2: Start dev server**

```bash
npm run dev
```

**Step 3: Verify each feature**

1. **Home page**: Loads with any existing podcasts. Trending Topics sidebar shows 10+ macro themes with heat badges.
2. **Click a topic in sidebar**: Navigates to `/topics/<slug>`. Shows topic detail with metrics, sparkline, sentiment breakdown.
3. **Create News Podcast**: Step 1 shows trending macro themes (not generic categories). Search works. Select a topic and complete the full flow.
4. **Publish**: Podcast appears on home immediately. Within ~10s, theme badges appear on the card. Sidebar heat scores may shift.
5. **Topic detail page**: After tagging completes, the new podcast appears under "Related Podcasts". Summary and risk chain populate if GPT call succeeds.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: macro economics tracker — complete end-to-end implementation"
```

---

## Summary of All Files Changed

| Action | File |
|--------|------|
| Modify | `convex/schema.ts` |
| Create | `convex/themes.ts` |
| Create | `convex/themeActions.ts` |
| Create | `convex/seedThemes.ts` |
| Modify | `convex/podcast.ts` |
| Create | `components/ThemeBadge.tsx` |
| Create | `components/MentionSparkline.tsx` |
| Create | `components/TrendingTopics.tsx` |
| Create | `components/SentimentBreakdown.tsx` |
| Create | `components/RiskChainDisplay.tsx` |
| Modify | `components/RightSidebar.tsx` |
| Modify | `components/PodcastCard.tsx` |
| Modify | `components/TopicSelector.tsx` |
| Modify | `app/(root)/page.tsx` |
| Create | `app/(root)/topics/[topicSlug]/page.tsx` |
| Modify | `app/(root)/create-news-podcast/page.tsx` |
| Modify | `constants/index.ts` |
