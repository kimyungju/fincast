import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const toggleFavorite = mutation({
  args: { podcastId: v.id("podcasts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_clerkId_podcastId", (q) =>
        q.eq("clerkId", identity.subject).eq("podcastId", args.podcastId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("favorites", {
      clerkId: identity.subject,
      podcastId: args.podcastId,
      favoritedAt: Date.now(),
    });
    return true;
  },
});

export const isFavorited = query({
  args: { podcastId: v.id("podcasts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_clerkId_podcastId", (q) =>
        q.eq("clerkId", identity.subject).eq("podcastId", args.podcastId)
      )
      .unique();

    return existing !== null;
  },
});

export const getUserFavorites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .order("desc")
      .collect();

    const podcasts = await Promise.all(
      favorites.map(async (fav) => {
        const podcast = await ctx.db.get(fav.podcastId);
        return podcast ? { ...podcast, favoritedAt: fav.favoritedAt } : null;
      })
    );

    return podcasts.filter(Boolean);
  },
});

export const getFavoriteCount = query({
  args: { podcastId: v.id("podcasts") },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_podcastId", (q) => q.eq("podcastId", args.podcastId))
      .collect();
    return favorites.length;
  },
});
