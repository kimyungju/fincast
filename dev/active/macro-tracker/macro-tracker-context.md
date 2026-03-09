# Macro Economics Tracker — Context Reference

**Last Updated: 2026-03-09 (Session 5)**

---

## Current State: FAVORITES FEATURE COMPLETE (uncommitted)

- Full star/favorite system implemented (backend + frontend + page)
- TopicSelector search padding fix + selected text color fix
- Sidebar star icon SVG fixed to match other icons
- **All Session 5 changes are uncommitted**
- Topic detail auto-summary, daily sparklines, theme scoring all working from prior sessions

---

## Key Architectural Decisions

### D1: Async Theme Tagging (not blocking publish)
After `createPodcast` returns, fire `tagPodcastThemes` without awaiting. Podcast appears instantly; themes populate ~10s later via Convex reactivity.

### D2: Google Trends via 3-Hour Cron (NOT real-time)
Google Trends scores fetched every 3 hours via `convex/crons.ts` → `convex/trendsCron.ts:refreshAllTrendsScores`.

### D3: Momentum-Based Scoring
Fetch 30-day window, compare recent 25% avg vs earlier 75% avg. Mapping: momentum 0.5→heatScore 0, 1.0→1.5, 1.5→3.0. Returns `null` on rate-limit → theme keeps existing score.

### D4: SVG Sparklines (no recharts dependency)
Inline SVG polyline. Lightweight, no new dependency.

### D5: Daily Sparkline Granularity (not weekly)
Changed from 8-week to 7-day daily buckets (`getDailyMentionCounts`). "Day / Day" delta instead of "Week / Week". More appropriate for a hackathon project timeline.

### D6: Auto-Generated Theme Summaries from Web Search (Session 4)
`generateThemeSummary` uses GPT web_search to find trending articles about the theme label, then summarizes them. Auto-fired via `useEffect` on topic detail page when `latestSummary` is missing. Source article details stored on `macroThemes.summaryArticles`.

### D7: Article Details on Theme Mentions (Session 4)
`themeMentions` has `articleDetails` field alongside the flat `sourceArticles` URL array. The `create-news-podcast` page passes full article objects when calling `tagPodcastThemes`.

### D8: Star/Favorites System (Session 5)
**Schema**: `favorites` table with `clerkId` (string), `podcastId` (Id<"podcasts">), `favoritedAt` (number). Indexes: `by_clerkId`, `by_clerkId_podcastId`, `by_podcastId`.
**Backend** (`convex/favorites.ts`): `toggleFavorite` (idempotent mutation), `isFavorited` (query), `getUserFavorites` (query with full podcast data), `getFavoriteCount` (query).
**Cascade delete**: `deletePodcast` in `convex/podcast.ts` removes all related favorites.
**Frontend**: Star overlay on PodcastCard (top-right), favorite button on PodcastDetailPlayer, dedicated `/favorites` page.
**Design**: Yellow (`yellow-400`) not orange. Favorites only on `/favorites` page — no home page section (user explicitly removed it).

---

## Scoring Architecture

**heatScore** (0-3.0): Derived from Google Trends momentum by cron every 3 hours.
**heatStatus**: Derived from momentum (hot >1.15, warming 1.03-1.15, stable 0.88-1.03, cooling <0.88, dormant 14+ days).
**relevanceScore** on mentions: Fixed at `1.0`.
**trendingScore** on podcasts: Sum of linked themes' heatScores.

---

## Key Files — Backend

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Tables: podcasts, users, macroThemes, themeMentions, **favorites** |
| `convex/themes.ts` | Queries (getThemeById, getThemeBySlug, getDailyMentionCounts, etc.) + Mutations (recordMention, updateThemeSummary) |
| `convex/themeActions.ts` | tagPodcastThemes, generateThemeSummary (web search → summarize → store articles) |
| `convex/trendsCron.ts` | Momentum-based Google Trends scoring, 8s delays, skip on failure |
| `convex/crons.ts` | 3-hour interval cron |
| `convex/news.ts` | fetchNewsForTopic (GPT web_search), generateNewsScript |
| `convex/seedThemes.ts` | Seeds 15 themes with heatScore 0 |
| `convex/podcast.ts` | CRUD, getTrendingPodcasts, **cascade deletes favorites** |
| `convex/favorites.ts` | **NEW** — toggleFavorite, isFavorited, getUserFavorites, getFavoriteCount |

## Key Files — Frontend

| File | Purpose |
|------|---------|
| `app/(root)/topics/[topicSlug]/page.tsx` | Topic detail: auto-generates summary if missing, shows summary + source links + metrics + podcasts |
| `app/(root)/create-news-podcast/page.tsx` | 5-step wizard — passes full article details to tagPodcastThemes |
| `app/(root)/favorites/page.tsx` | **NEW** — Favorites grid page with podcast count, LoaderSpinner, EmptyState |
| `components/TrendingTopics.tsx` | Compact sidebar list with daily sparkline (7 days) |
| `components/RiskChainDisplay.tsx` | Risk chain callout (orange left border) |
| `components/MentionSparkline.tsx` | SVG polyline sparkline |
| `components/PodcastCard.tsx` | Card with **star overlay** (top-right, yellow fill when favorited) |
| `components/PodcastDetailPlayer.tsx` | Detail player with **favorite button** (Star icon + text label) |
| `components/TopicSelector.tsx` | Theme picker with search — **inline padding override for search icon** |
| `constants/index.ts` | Sidebar links: Home, Discover, **Favorites**, Create Podcast, My Profile |
| `public/icons/star.svg` | White filled star, opacity 0.4 (matches sidebar icon convention) |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--color-charcoal` | `#0a0a0a` | Darkest background |
| `--color-dark-gray` | `#1a1a1a` | Card backgrounds |
| `--color-mid-gray` | `#2a2a2a` | Borders, dividers |
| `--color-orange` | `#ff6b35` | Primary accent |
| `--color-cream` | `#f5f1e8` | Text on dark |
| `yellow-400` | Tailwind default | Star/favorite color (not orange) |

Classes: `card-brutal`, `btn-brutal`, `input-class`, `noise-texture`, `text-display`
Fonts: Syne 900 uppercase (headings), Crimson Pro italic (descriptions)
Sidebar icons: `fill="white"` with `opacity="0.4"` (NOT `stroke="currentColor"`)

---

## Known Issues / Gotchas

- **Google Trends rate limiting**: Returns HTML/CAPTCHA. Momentum helper returns `null`, caller skips theme. 8s delays.
- **Seed data has heatScore 0**: Run `npx convex run trendsCron:refreshAllTrendsScores` after seeding.
- **`noise-texture` BREAKS `fixed` positioning**: Sets `position: relative` which overrides Tailwind's `fixed`.
- **Summary auto-generation fires once per page visit**: `useRef` prevents double-fire but if the action fails silently, loading state persists until page refresh.
- **`.input-class` overrides Tailwind padding**: Has `padding: 1rem` in CSS. Use inline `style={{ paddingLeft: '2.75rem' }}` for search inputs with icons (TopicSelector, discover page).
- **Sidebar SVG icons**: Must use `fill="white"` + `opacity="0.4"`, not `stroke="currentColor"`. Mismatch renders icons black.
- **TopicSelector selected state**: Don't apply `text-orange-1` — orange border + background tint is sufficient. Always use `text-white-1`.
- **`getThemeArticles` query** in `convex/themes.ts` is unused (source articles come from `theme.summaryArticles`). Can be cleaned up.

---

## Commands Reference

```bash
npx convex run seedThemes:seedMacroThemes
npx convex run trendsCron:refreshAllTrendsScores
npm run dev
npx tsc --noEmit
npm run lint
```
