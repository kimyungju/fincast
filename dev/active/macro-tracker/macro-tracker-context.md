# Macro Economics Tracker — Context Reference

**Last Updated: 2026-03-09 (Session 4)**

---

## Current State: THEME SUMMARY AUTO-GENERATION IMPLEMENTED

- Topic detail pages now auto-generate summaries from live web-searched articles
- `generateThemeSummary` rewired: fetches trending articles via GPT web_search → summarizes → stores summary + riskChain + source article links
- Source article links appear below summary as `SOURCE_NAME ↗ Source` buttons
- **Uncommitted**: `app/(root)/topics/[topicSlug]/page.tsx` (auto-trigger + loading state)
- All backend changes (schema, themes.ts, themeActions.ts) already committed

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
**Problem**: Seeded themes had no `latestSummary` — the "Latest Developments" section never rendered.
**Solution**: `generateThemeSummary` now uses GPT web_search (same pattern as `fetchNewsForTopic`) to find trending articles about the theme label, then summarizes them.
**Trigger**: Auto-fired via `useEffect` on topic detail page when `latestSummary` is missing. Uses `useRef` to prevent double-firing. Convex reactivity auto-updates UI once summary is stored.
**Storage**: Summary, riskChain, and source article details (url, title, source) stored on `macroThemes` via `summaryArticles` field.

### D7: Article Details on Theme Mentions (Session 4)
`themeMentions` now has `articleDetails` field (array of {url, title, source}) alongside the flat `sourceArticles` URL array. The `create-news-podcast` page passes full article objects when calling `tagPodcastThemes`.

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
| `convex/schema.ts` | Tables: podcasts, users, macroThemes (with summaryArticles, trendsScore), themeMentions (with articleDetails) |
| `convex/themes.ts` | Queries (getThemeById, getThemeBySlug, getDailyMentionCounts, getThemeArticles, etc.) + Mutations (recordMention with articleDetails, updateThemeSummary with summaryArticles) |
| `convex/themeActions.ts` | tagPodcastThemes (accepts sourceArticleDetails), generateThemeSummary (web search → summarize → store articles) |
| `convex/trendsCron.ts` | Momentum-based Google Trends scoring, 8s delays, skip on failure |
| `convex/crons.ts` | 3-hour interval cron |
| `convex/news.ts` | fetchNewsForTopic (GPT web_search), generateNewsScript |
| `convex/seedThemes.ts` | Seeds 15 themes with heatScore 0 |
| `convex/podcast.ts` | CRUD, getTrendingPodcasts sorts by trendingScore |

## Key Files — Frontend

| File | Purpose |
|------|---------|
| `app/(root)/topics/[topicSlug]/page.tsx` | Topic detail: auto-generates summary if missing, shows summary + source links + metrics + podcasts |
| `app/(root)/create-news-podcast/page.tsx` | 5-step wizard — passes full article details to tagPodcastThemes |
| `components/TrendingTopics.tsx` | Compact sidebar list with daily sparkline (7 days) |
| `components/RiskChainDisplay.tsx` | Risk chain callout (orange left border) |
| `components/MentionSparkline.tsx` | SVG polyline sparkline |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--color-charcoal` | `#0a0a0a` | Darkest background |
| `--color-dark-gray` | `#1a1a1a` | Card backgrounds |
| `--color-mid-gray` | `#2a2a2a` | Borders, dividers |
| `--color-orange` | `#ff6b35` | Primary accent |
| `--color-cream` | `#f5f1e8` | Text on dark |

Classes: `card-brutal`, `btn-brutal`, `input-class`, `noise-texture`, `text-display`
Fonts: Syne 900 uppercase (headings), Crimson Pro italic (descriptions)

---

## Known Issues / Gotchas

- **Google Trends rate limiting**: Returns HTML/CAPTCHA. Momentum helper returns `null`, caller skips theme. 8s delays.
- **Seed data has heatScore 0**: Run `npx convex run trendsCron:refreshAllTrendsScores` after seeding.
- **`noise-texture` BREAKS `fixed` positioning**: Sets `position: relative` which overrides Tailwind's `fixed`.
- **Summary auto-generation fires once per page visit**: `useRef` prevents double-fire but if the action fails silently, the loading state persists until page refresh.
- **`getThemeArticles` query still exists** in `convex/themes.ts` but is no longer used by the topic page (source articles now come from `theme.summaryArticles`). Can be cleaned up or kept for future use.

---

## Commands Reference

```bash
npx convex run seedThemes:seedMacroThemes
npx convex run trendsCron:refreshAllTrendsScores
npm run dev
npx tsc --noEmit
npm run lint
```
