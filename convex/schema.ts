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
    summaryArticles: v.optional(v.array(v.object({
      url: v.string(),
      title: v.string(),
      source: v.string(),
    }))),
    totalMentions: v.number(),
    lastMentionAt: v.number(),
    trendsScore: v.optional(v.number()),
    trendsUpdatedAt: v.optional(v.number()),
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
    articleDetails: v.optional(v.array(v.object({
      url: v.string(),
      title: v.string(),
      source: v.string(),
    }))),
    timestamp: v.number(),
  })
    .index("by_theme", ["themeId"])
    .index("by_theme_and_time", ["themeId", "timestamp"])
    .index("by_source", ["sourceId"]),

  favorites: defineTable({
    clerkId: v.string(),
    podcastId: v.id("podcasts"),
    favoritedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_clerkId_podcastId", ["clerkId", "podcastId"])
    .index("by_podcastId", ["podcastId"]),

});
