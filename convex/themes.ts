import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

// ---------------------------------------------------------------------------
// Helper – not exported
// ---------------------------------------------------------------------------

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

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

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getTrendingThemes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("macroThemes")
      .withIndex("by_heatScore")
      .order("desc")
      .take(20);
  },
});

export const getThemeById = query({
  args: { themeId: v.id("macroThemes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.themeId);
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
    return await ctx.db
      .query("themeMentions")
      .withIndex("by_theme_and_time", (q) => q.eq("themeId", args.themeId))
      .order("desc")
      .take(args.limit ?? 20);
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

export const getDailyMentionCounts = query({
  args: {
    themeId: v.id("macroThemes"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numDays = args.days ?? 7;
    const msPerDay = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const startTime = now - numDays * msPerDay;

    const mentions = await ctx.db
      .query("themeMentions")
      .withIndex("by_theme_and_time", (q) =>
        q.eq("themeId", args.themeId).gte("timestamp", startTime),
      )
      .collect();

    // Bucket into daily counts (index 0 = oldest day)
    const buckets: number[] = new Array(numDays).fill(0);
    for (const mention of mentions) {
      const dayIndex = Math.floor((mention.timestamp - startTime) / msPerDay);
      const clampedIndex = Math.min(dayIndex, numDays - 1);
      buckets[clampedIndex] += mention.relevanceScore;
    }

    return buckets;
  },
});

export const getSentimentBreakdown = query({
  args: { themeId: v.id("macroThemes") },
  handler: async (ctx, args) => {
    const mentions = await ctx.db
      .query("themeMentions")
      .withIndex("by_theme_and_time", (q) => q.eq("themeId", args.themeId))
      .collect();

    if (mentions.length === 0) {
      return { hawkish: 0, dovish: 0, neutral: 0 };
    }

    let hawkish = 0;
    let dovish = 0;
    let neutral = 0;

    for (const mention of mentions) {
      if (mention.sentiment === "hawkish") hawkish++;
      else if (mention.sentiment === "dovish") dovish++;
      else neutral++;
    }

    const total = mentions.length;
    return {
      hawkish: Math.round((hawkish / total) * 100),
      dovish: Math.round((dovish / total) * 100),
      neutral: Math.round((neutral / total) * 100),
    };
  },
});

export const getThemeArticles = query({
  args: {
    themeId: v.id("macroThemes"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const mentions = await ctx.db
      .query("themeMentions")
      .withIndex("by_theme_and_time", (q) => q.eq("themeId", args.themeId))
      .order("desc")
      .take(args.limit ?? 30);

    const seen = new Set<string>();
    const articles: Array<{
      url: string;
      title: string;
      source: string;
      sentiment: string;
      mentionSummary: string;
    }> = [];

    for (const mention of mentions) {
      const details = mention.articleDetails ?? [];
      const urlsOnly = mention.sourceArticles ?? [];

      for (const d of details) {
        if (!seen.has(d.url)) {
          seen.add(d.url);
          articles.push({
            url: d.url,
            title: d.title,
            source: d.source,
            sentiment: mention.sentiment,
            mentionSummary: mention.summary,
          });
        }
      }

      // Fallback for old mentions without articleDetails
      for (const url of urlsOnly) {
        if (!seen.has(url)) {
          seen.add(url);
          const domain = extractDomain(url);
          articles.push({
            url,
            title: domain,
            source: domain,
            sentiment: mention.sentiment,
            mentionSummary: mention.summary,
          });
        }
      }
    }

    return articles;
  },
});

export const getPodcastsByTheme = query({
  args: { themeId: v.id("macroThemes") },
  handler: async (ctx, args) => {
    const allPodcasts = await ctx.db.query("podcasts").collect();
    const filtered = allPodcasts.filter(
      (p) => p.themeIds && p.themeIds.includes(args.themeId),
    );
    filtered.sort((a, b) => b.views - a.views);
    return filtered;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createTheme = mutation({
  args: {
    slug: v.string(),
    label: v.string(),
    category: v.string(),
    regions: v.array(v.string()),
    assetClasses: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("macroThemes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      return existing._id;
    }

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
    articleDetails: v.optional(v.array(v.object({
      url: v.string(),
      title: v.string(),
      source: v.string(),
    }))),
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
      articleDetails: args.articleDetails,
      timestamp: now,
    });

    // 2. Update mention count and timestamp (heatScore is updated by cron)
    const theme = await ctx.db.get(args.themeId);
    if (!theme) throw new ConvexError("Theme not found");

    const heatStatus = computeHeatStatus(theme.heatScore, now, now);

    await ctx.db.patch(args.themeId, {
      heatStatus,
      totalMentions: theme.totalMentions + 1,
      lastMentionAt: now,
    });

    // 3. Recompute trendingScore for all podcasts linked to this theme
    const allPodcasts = await ctx.db.query("podcasts").collect();
    const linkedPodcasts = allPodcasts.filter(
      (p) => p.themeIds && p.themeIds.includes(args.themeId),
    );

    for (const podcast of linkedPodcasts) {
      let trendingScore = 0;
      for (const tid of podcast.themeIds!) {
        const t = await ctx.db.get(tid);
        if (t) trendingScore += t.heatScore;
      }
      await ctx.db.patch(podcast._id, { trendingScore });
    }
  },
});

export const updateThemeSummary = mutation({
  args: {
    themeId: v.id("macroThemes"),
    summary: v.string(),
    riskChain: v.string(),
    summaryArticles: v.optional(v.array(v.object({
      url: v.string(),
      title: v.string(),
      source: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.themeId, {
      latestSummary: args.summary,
      riskChain: args.riskChain,
      summaryArticles: args.summaryArticles,
    });
  },
});

export const updateThemeHeatScore = mutation({
  args: {
    themeId: v.id("macroThemes"),
    heatScore: v.number(),
    heatStatus: v.string(),
    trendsScore: v.optional(v.number()),
    trendsUpdatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.themeId, {
      heatScore: args.heatScore,
      heatStatus: args.heatStatus,
      ...(args.trendsScore !== undefined && { trendsScore: args.trendsScore }),
      ...(args.trendsUpdatedAt !== undefined && {
        trendsUpdatedAt: args.trendsUpdatedAt,
      }),
    });
  },
});

export const recomputeAllTrendingScores = mutation({
  args: {},
  handler: async (ctx) => {
    const allPodcasts = await ctx.db.query("podcasts").collect();

    for (const podcast of allPodcasts) {
      if (!podcast.themeIds || podcast.themeIds.length === 0) continue;

      let trendingScore = 0;
      for (const tid of podcast.themeIds) {
        const theme = await ctx.db.get(tid);
        if (theme) trendingScore += theme.heatScore;
      }
      await ctx.db.patch(podcast._id, { trendingScore });
    }
  },
});

export const linkThemesToPodcast = mutation({
  args: {
    podcastId: v.id("podcasts"),
    themeIds: v.array(v.id("macroThemes")),
  },
  handler: async (ctx, args) => {
    let trendingScore = 0;
    for (const themeId of args.themeIds) {
      const theme = await ctx.db.get(themeId);
      if (theme) trendingScore += theme.heatScore;
    }

    await ctx.db.patch(args.podcastId, {
      themeIds: args.themeIds,
      trendingScore,
    });
  },
});
