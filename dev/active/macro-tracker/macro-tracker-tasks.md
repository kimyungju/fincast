# Macro Economics Tracker — Task Checklist

**Last Updated: 2026-03-09 (Session 5)**

---

## All Phases Complete (Sessions 1-3)

Phases 1-6 (Data Foundation, Seed Data, UI Components, Core Pages, Pipeline Wiring, Verification) all complete.

---

## Session 3 Changes

- [x] Sidebar trending topics redesign (compact, no sparkline)
- [x] Momentum-based Google Trends scoring
- [x] Heat score DB data manually set for varied distribution

## Session 4 Changes

- [x] Changed sparkline from 8-week to 7-day daily buckets
- [x] Removed sentiment section from topic detail page
- [x] Schema: added `summaryArticles` to macroThemes, `articleDetails` to themeMentions
- [x] Auto-generate theme summaries from GPT web_search on topic page visit
- [x] Source article links shown below summary
- [x] TopicSelector custom topic button fix
- [x] All committed

## Session 5 Changes

### Star/Favorites Feature (COMPLETE, uncommitted)
- [x] `convex/schema.ts` — Added `favorites` table (clerkId, podcastId, favoritedAt) with 3 indexes
- [x] `convex/favorites.ts` — NEW: toggleFavorite, isFavorited, getUserFavorites, getFavoriteCount
- [x] `convex/podcast.ts` — Cascade delete favorites in `deletePodcast`
- [x] `components/PodcastCard.tsx` — Star icon overlay (top-right), optimistic toggle, yellow fill
- [x] `components/PodcastDetailPlayer.tsx` — Favorite button with Star icon + text label
- [x] `app/(root)/favorites/page.tsx` — NEW: Dedicated favorites grid page
- [x] `constants/index.ts` — Added Favorites sidebar link (3rd position)
- [x] `public/icons/star.svg` — NEW: White filled star icon (fill="white", opacity="0.4")

### UI Fixes (COMPLETE, uncommitted)
- [x] Sidebar star icon: fixed from `stroke="currentColor"` to `fill="white"` + `opacity="0.4"`
- [x] TopicSelector search: fixed icon/text overlap via inline `style={{ paddingLeft: '2.75rem' }}`
- [x] TopicSelector selected state: changed from `text-orange-1` to `text-white-1`

### Removed (user request)
- [x] Home page "Your Favorites" section — built then removed per user preference

---

## Remaining Work

1. **Commit all Session 5 changes** — favorites feature + TopicSelector fixes
2. **Push to remote**
3. **Live demo test** — test star/unfavorite flow, verify /favorites page, verify cascade delete
4. **Optional cleanup**: `getThemeArticles` query in `themes.ts` unused (articles come from `theme.summaryArticles`)
