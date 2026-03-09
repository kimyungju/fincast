# Star / Favorite Podcasts — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users star/favorite any podcast, persist favorites in a join table, show a "Your Favorites" section on the home page, and add a dedicated /favorites page.

**Architecture:** New `favorites` Convex table (join table: clerkId + podcastId). Single `toggleFavorite` mutation (idempotent check-then-toggle). `isFavorited` query per card, `getUserFavorites` for listing. Star button on PodcastCard (overlay top-right) and PodcastDetailPlayer (inline with actions). Horizontal scroll favorites row on home page. Full grid at `/favorites`.

**Tech Stack:** Convex (schema, mutations, queries), React 19, Next.js App Router, lucide-react (`Star`), Tailwind CSS, existing brutalist design system.

---

## Task 1: Add `favorites` table to Convex schema

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Add the favorites table definition**

In `convex/schema.ts`, add a new table after the `themeMentions` table (before the closing `});`):

```typescript
  favorites: defineTable({
    clerkId: v.string(),
    podcastId: v.id("podcasts"),
    favoritedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_clerkId_podcastId", ["clerkId", "podcastId"]),
```

**Step 2: Verify Convex dev server picks up the schema change**

Run: `npx convex dev` (if not already running)
Expected: Schema push succeeds, new `favorites` table created.

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "add favorites table to schema"
```

---

## Task 2: Create `convex/favorites.ts` — toggleFavorite mutation

**Files:**
- Create: `convex/favorites.ts`

**Step 1: Write the toggleFavorite mutation**

Create `convex/favorites.ts`:

```typescript
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
      return false; // unfavorited
    }

    await ctx.db.insert("favorites", {
      clerkId: identity.subject,
      podcastId: args.podcastId,
      favoritedAt: Date.now(),
    });
    return true; // favorited
  },
});
```

**Step 2: Verify it compiles**

Check Convex dev server output — no errors.

**Step 3: Commit**

```bash
git add convex/favorites.ts
git commit -m "add toggleFavorite mutation"
```

---

## Task 3: Add queries — isFavorited, getUserFavorites, getFavoriteCount

**Files:**
- Modify: `convex/favorites.ts`

**Step 1: Add the isFavorited query**

Append to `convex/favorites.ts`:

```typescript
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
```

**Step 2: Add the getUserFavorites query**

Append to `convex/favorites.ts`:

```typescript
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
```

**Step 3: Add the getFavoriteCount query**

Append to `convex/favorites.ts`:

```typescript
export const getFavoriteCount = query({
  args: { podcastId: v.id("podcasts") },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_clerkId_podcastId", (q) =>
        q.eq("clerkId", args.podcastId)
      )
      .collect();
    // Can't use compound index for "all users for this podcast"
    // so we filter manually
    const all = await ctx.db.query("favorites").collect();
    return all.filter((f) => f.podcastId === args.podcastId).length;
  },
});
```

Actually — the compound index `by_clerkId_podcastId` starts with `clerkId`, so we can't use it to query by `podcastId` alone. Two options: (a) add a `by_podcastId` index, or (b) do a full table scan filtered. Since favorite counts are optional/nice-to-have and the table will be small for a hackathon, either works. Let's add the index for correctness:

**Step 3b: Add `by_podcastId` index to schema**

In `convex/schema.ts`, update the favorites table to add another index:

```typescript
  favorites: defineTable({
    clerkId: v.string(),
    podcastId: v.id("podcasts"),
    favoritedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_clerkId_podcastId", ["clerkId", "podcastId"])
    .index("by_podcastId", ["podcastId"]),
```

Then rewrite `getFavoriteCount` to use the index:

```typescript
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
```

**Step 4: Verify it compiles**

Check Convex dev server — no errors.

**Step 5: Commit**

```bash
git add convex/favorites.ts convex/schema.ts
git commit -m "add isFavorited, getUserFavorites, getFavoriteCount queries"
```

---

## Task 4: Clean up deleted podcasts — cascade delete favorites

**Files:**
- Modify: `convex/podcast.ts`

**Step 1: Add favorite cleanup to deletePodcast mutation**

In `convex/podcast.ts`, inside the `deletePodcast` handler, before `return await ctx.db.delete(args.podcastId)`, add:

```typescript
    // Clean up favorites referencing this podcast
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_podcastId", (q) => q.eq("podcastId", args.podcastId))
      .collect();
    for (const fav of favorites) {
      await ctx.db.delete(fav._id);
    }
```

**Step 2: Verify it compiles**

Check Convex dev server — no errors.

**Step 3: Commit**

```bash
git add convex/podcast.ts
git commit -m "cascade delete favorites when podcast is deleted"
```

---

## Task 5: Star button on PodcastCard

**Files:**
- Modify: `components/PodcastCard.tsx`

**Step 1: Add star button with optimistic toggle**

In `components/PodcastCard.tsx`:

1. Add imports:
```typescript
import { useQuery, useMutation } from "convex/react";
import { Star } from "lucide-react";
```
(Replace existing `useMutation` import with the combined one)

2. Inside the component, add state and hooks after existing state:
```typescript
  const isFavorited = useQuery(api.favorites.isFavorited, { podcastId });
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);
  const [optimisticFav, setOptimisticFav] = React.useState<boolean | null>(null);

  const favorited = optimisticFav ?? isFavorited ?? false;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newState = !favorited;
    setOptimisticFav(newState);
    try {
      await toggleFavorite({ podcastId });
    } catch {
      setOptimisticFav(null); // revert on error
    }
  };

  // Sync optimistic state when server state updates
  React.useEffect(() => {
    if (isFavorited !== undefined) {
      setOptimisticFav(null);
    }
  }, [isFavorited]);
```

3. Add the star button inside the image container div (after the `{/* Corner Accent */}` div, before the closing `</div>` of the image container):
```tsx
            {/* Favorite Star */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              className="absolute top-3 right-3 z-10 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95"
              title={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                size={24}
                className={`drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-all duration-200 ${
                  favorited
                    ? "fill-orange-1 text-orange-1 scale-110"
                    : "fill-transparent text-cream stroke-[2.5]"
                }`}
              />
            </button>
```

**Step 2: Verify it renders correctly**

Run: `npm run dev`
Navigate to home page. Star icons should appear on each podcast card (top-right of image). Clicking should toggle fill. Clicking star should NOT navigate to podcast detail.

**Step 3: Commit**

```bash
git add components/PodcastCard.tsx
git commit -m "add star/favorite button to podcast cards"
```

---

## Task 6: Star button on PodcastDetailPlayer

**Files:**
- Modify: `components/PodcastDetailPlayer.tsx`

**Step 1: Add favorite button to detail player**

In `components/PodcastDetailPlayer.tsx`:

1. Add imports:
```typescript
import { useQuery, useMutation } from "convex/react";
import { Star, Play } from "lucide-react";
```
(Combine with existing Play import, replace existing `useMutation`)

2. Add to props interface — the component already receives `podcastId` as string, so we cast it.

3. Inside the component, add after existing state:
```typescript
  const isFavorited = useQuery(api.favorites.isFavorited, {
    podcastId: podcastId as Id<"podcasts">,
  });
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);
  const [optimisticFav, setOptimisticFav] = React.useState<boolean | null>(null);

  const favorited = optimisticFav ?? isFavorited ?? false;

  const handleToggleFavorite = async () => {
    const newState = !favorited;
    setOptimisticFav(newState);
    try {
      await toggleFavorite({ podcastId: podcastId as Id<"podcasts"> });
    } catch {
      setOptimisticFav(null);
    }
  };

  React.useEffect(() => {
    if (isFavorited !== undefined) {
      setOptimisticFav(null);
    }
  }, [isFavorited]);
```

4. Add a favorite button next to the owner badge / delete button area. Inside the `<div className="flex items-center gap-2">` that contains author info, after the delete button block (after the last `{isOwner && ...}` block):
```tsx
            <button
              onClick={handleToggleFavorite}
              className="ml-2 flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              title={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                size={20}
                className={`transition-all duration-200 ${
                  favorited
                    ? "fill-orange-1 text-orange-1"
                    : "fill-transparent text-white-3 stroke-[2.5]"
                }`}
              />
              <span className="text-12 font-bold text-white-3 uppercase tracking-wide">
                {favorited ? "Favorited" : "Favorite"}
              </span>
            </button>
```

**Step 2: Verify it renders on podcast detail page**

Navigate to any podcast detail page. Favorite button should appear next to author info. Clicking should toggle.

**Step 3: Commit**

```bash
git add components/PodcastDetailPlayer.tsx
git commit -m "add favorite button to podcast detail page"
```

---

## Task 7: Favorites section on Home page

**Files:**
- Modify: `app/(root)/page.tsx`

**Step 1: Add favorites row to the home page**

In `app/(root)/page.tsx`:

1. Add import:
```typescript
import { useQuery } from "convex/react";
```
(Already imported — just verify)

2. Inside the `Home` component, add a query for favorites:
```typescript
  const favorites = useQuery(api.favorites.getUserFavorites);
```

3. Add a favorites section ABOVE the "Trending Podcasts" section (inside the outer `<div>`, before the existing `<section>`):

```tsx
      {/* Favorites Section — only shown if user has favorites */}
      {favorites && favorites.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h1 className="text-20 font-bold text-white-1">Your Favorites</h1>
            {favorites.length > 10 && (
              <Link
                href="/favorites"
                className="text-14 font-bold text-orange-1 uppercase tracking-wide hover:underline"
              >
                View all
              </Link>
            )}
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {favorites.slice(0, 10).map((podcast) => (
              <div key={podcast._id} className="min-w-[280px] max-w-[320px] flex-shrink-0">
                <PodcastCard
                  imgURL={podcast.imageUrl ?? ""}
                  title={podcast.podcastTitle}
                  description={podcast.podcastDescription}
                  podcastId={podcast._id}
                />
              </div>
            ))}
          </div>
        </section>
      )}
```

4. Also add `Link` to the imports if not already there:
```typescript
import Link from "next/link";
```
(Already imported — verify)

**Step 2: Verify on home page**

Favorite a podcast, return to home page. "Your Favorites" row should appear above trending. Horizontal scroll should work.

**Step 3: Commit**

```bash
git add "app/(root)/page.tsx"
git commit -m "add favorites section to home page"
```

---

## Task 8: Create `/favorites` page

**Files:**
- Create: `app/(root)/favorites/page.tsx`

**Step 1: Create the favorites page**

Create `app/(root)/favorites/page.tsx`:

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import PodcastCard from "@/components/PodcastCard";
import LoaderSpinner from "@/components/LoaderSpinner";
import EmptyState from "@/components/EmptyState";

const Favorites = () => {
  const favorites = useQuery(api.favorites.getUserFavorites);

  return (
    <div className="mt-9 flex flex-col gap-9">
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-20 font-bold text-white-1">Your Favorites</h1>
          {favorites && (
            <span className="text-14 font-bold text-white-4">
              {favorites.length} {favorites.length === 1 ? "podcast" : "podcasts"}
            </span>
          )}
        </div>
      </section>

      {favorites === undefined ? (
        <LoaderSpinner />
      ) : favorites.length > 0 ? (
        <div className="podcast_grid">
          {favorites.map((podcast) => (
            <PodcastCard
              key={podcast._id}
              imgURL={podcast.imageUrl ?? ""}
              title={podcast.podcastTitle}
              description={podcast.podcastDescription}
              podcastId={podcast._id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No favorites yet"
          buttonLink="/discover"
          buttonText="Discover Podcasts"
        />
      )}
    </div>
  );
};

export default Favorites;
```

**Step 2: Verify the page renders**

Navigate to `/favorites`. Should show the grid of favorited podcasts or the empty state.

**Step 3: Commit**

```bash
git add "app/(root)/favorites/page.tsx"
git commit -m "add dedicated favorites page"
```

---

## Task 9: Add Favorites to Left Sidebar navigation

**Files:**
- Modify: `constants/index.ts`

**Step 1: Add the Favorites nav item**

The sidebar uses SVG icons from `/icons/`. We need a star SVG. Two options:
- (a) Create a simple star SVG file at `public/icons/star.svg`
- (b) Use an existing icon

Let's create a simple star SVG.

Create `public/icons/star.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
```

Then in `constants/index.ts`, add the Favorites link. Insert it after the "Home" entry (or after "Discover" — placing it second makes it prominent):

```typescript
  {
    route: "/favorites",
    label: "Favorites",
    imgURL: "/icons/star.svg",
  },
```

Place it after the "Discover" entry (index 1), so the order becomes: Home, Discover, Favorites, Create Podcast, News Podcast, Profile.

**Step 2: Verify sidebar**

Check that "Favorites" appears in the sidebar with a star icon, highlights when active.

**Step 3: Commit**

```bash
git add constants/index.ts public/icons/star.svg
git commit -m "add favorites to sidebar navigation"
```

---

## Task 10: Verify end-to-end flow

**Step 1: Full smoke test**

1. Open app, sign in
2. Home page — no "Your Favorites" section (haven't favorited anything)
3. Click star on a podcast card → star fills orange, no navigation
4. Go to home page → "Your Favorites" section appears with the podcast
5. Click star again → star unfills, section disappears from home
6. Navigate to `/favorites` → shows empty state
7. Favorite 2-3 podcasts → they appear on /favorites page in grid
8. Go to a podcast detail page → "Favorite" button visible, click to toggle
9. Delete a podcast (as owner) → verify it's removed from favorites
10. Sign out → star buttons hidden / no favorites section

**Step 2: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: favorites e2e polish"
```

---

## Summary of Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `convex/schema.ts` | Modify | Add `favorites` table with 3 indexes |
| `convex/favorites.ts` | Create | `toggleFavorite`, `isFavorited`, `getUserFavorites`, `getFavoriteCount` |
| `convex/podcast.ts` | Modify | Cascade delete favorites in `deletePodcast` |
| `components/PodcastCard.tsx` | Modify | Star button overlay on thumbnail |
| `components/PodcastDetailPlayer.tsx` | Modify | Favorite button next to author actions |
| `app/(root)/page.tsx` | Modify | "Your Favorites" horizontal scroll section |
| `app/(root)/favorites/page.tsx` | Create | Full favorites grid page |
| `constants/index.ts` | Modify | Add Favorites sidebar link |
| `public/icons/star.svg` | Create | Star icon for sidebar |
