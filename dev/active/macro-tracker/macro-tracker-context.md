# Macro Economics Tracker — Context Reference

**Last Updated: 2026-03-10 (Session 6)**

---

## Current State: SESSION 6 CHANGES UNCOMMITTED

All Session 5 changes were committed+pushed at start of session. Session 6 added:
- Renamed project from "Castory" to "Fincast" across 23 files
- AI-generated content-relevant cover art for news podcasts (replaces generic "podcast cover art" prompt)
- Removed theme badges from PodcastCard (moved to podcast detail page)
- Added "Create a Podcast" button on topic detail page (always visible, two styles)
- Updated PORTFOLIO.md with macro tracker content (5 challenges, expanded roadmap)
- Auth-logo SVG updated: Syne 800 font, wider spacing, uppercase "FINCAST"

**All Session 6 changes are uncommitted** (23 files modified).

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
Changed from 8-week to 7-day daily buckets (`getDailyMentionCounts`). More appropriate for hackathon timeline.

### D6: Auto-Generated Theme Summaries from Web Search (Session 4)
`generateThemeSummary` uses GPT web_search to find trending articles about the theme label, then summarizes them. Auto-fired via `useEffect` on topic detail page when `latestSummary` is missing. Source article details stored on `macroThemes.summaryArticles`.

### D7: Article Details on Theme Mentions (Session 4)
`themeMentions` has `articleDetails` field alongside the flat `sourceArticles` URL array. The `create-news-podcast` page passes full article objects when calling `tagPodcastThemes`.

### D8: Star/Favorites System (Session 5)
**Schema**: `favorites` table with `clerkId` (string), `podcastId` (Id<"podcasts">), `favoritedAt` (number). Indexes: `by_clerkId`, `by_clerkId_podcastId`, `by_podcastId`.
**Backend** (`convex/favorites.ts`): `toggleFavorite` (idempotent mutation), `isFavorited` (query), `getUserFavorites` (query with full podcast data), `getFavoriteCount` (query).
**Cascade delete**: `deletePodcast` in `convex/podcast.ts` removes all related favorites.
**Frontend**: Star overlay on PodcastCard (top-right), favorite button on PodcastDetailPlayer, dedicated `/favorites` page.
**Design**: Yellow (`yellow-400`) not orange. Favorites only on `/favorites` page — no home page section.

### D9: Content-Relevant Cover Art (Session 6)
**Backend** (`convex/news.ts:generateImagePrompt`): New action takes script text + topic, sends to GPT-4.1-mini to generate a DALL-E prompt focused on real-world subject matter (NOT podcast cover art). Script truncated to 3000 chars.
**Frontend** (`create-news-podcast/page.tsx`): After script generation, calls `generateImagePrompt` action instead of hardcoded template. Falls back to simple content-based template on error.
**Design decision**: "Editorial photograph or illustration, NOT podcast cover, NOT abstract art, NOT geometric shapes. Focus on real-world subject matter."

### D10: Theme Badges Only on Detail Page (Session 6)
**Removed** from PodcastCard — all cards now show clean "Episode" bar.
**Added** to podcast detail page (`podcast/[podcastId]/page.tsx`) — themes section with ThemeBadge components linked to `/topics/[slug]`.
**Rationale**: Cleaner card grid, themes are supplementary info better suited for detail view.

### D11: Project Renamed Castory → Fincast (Session 6)
Global rename across all UI, config, backend, docs, SVGs. Draft persistence keys changed from `castory:*` to `fincast:*`.

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
| `convex/schema.ts` | Tables: podcasts, users, macroThemes, themeMentions, favorites |
| `convex/themes.ts` | Queries (getThemeById, getThemeBySlug, getDailyMentionCounts, etc.) + Mutations (recordMention, updateThemeSummary) |
| `convex/themeActions.ts` | tagPodcastThemes, generateThemeSummary (web search → summarize → store articles) |
| `convex/trendsCron.ts` | Momentum-based Google Trends scoring, 8s delays, skip on failure |
| `convex/crons.ts` | 3-hour interval cron |
| `convex/news.ts` | fetchNewsForTopic, generateNewsScript, **generateImagePrompt** (Session 6) |
| `convex/seedThemes.ts` | Seeds 15 themes with heatScore 0 |
| `convex/podcast.ts` | CRUD, getTrendingPodcasts, cascade deletes favorites |
| `convex/favorites.ts` | toggleFavorite, isFavorited, getUserFavorites, getFavoriteCount |
| `convex/chat.ts` | **Fincast AI** chatbot action (renamed from Castory AI) |

## Key Files — Frontend

| File | Purpose |
|------|---------|
| `app/(root)/topics/[topicSlug]/page.tsx` | Topic detail: summary, metrics, podcasts, **"Create Podcast" button (2 styles)** |
| `app/(root)/create-news-podcast/page.tsx` | 5-step wizard — **AI-generated image prompt** (Session 6), draft key `fincast:*` |
| `app/(root)/podcast/[podcastId]/page.tsx` | Podcast detail — **themes section with linked ThemeBadges** (Session 6) |
| `app/(root)/favorites/page.tsx` | Favorites grid page |
| `components/PodcastCard.tsx` | Card with star overlay — **themes removed** (Session 6), always shows "Episode" bar |
| `components/PodcastDetailPlayer.tsx` | Detail player with favorite button |
| `components/LeftSidebar.tsx` | Logo text: **Fincast** |
| `components/MobileNav.tsx` | Logo text: **Fincast** |
| `public/icons/auth-logo.svg` | **Updated**: Syne 800 uppercase, wider spacing (x=50), viewBox 210 |

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
- **`.input-class` overrides Tailwind padding**: Has `padding: 1rem` in CSS. Use inline `style={{ paddingLeft: '2.75rem' }}` for search inputs with icons.
- **Sidebar SVG icons**: Must use `fill="white"` + `opacity="0.4"`, not `stroke="currentColor"`.
- **TopicSelector selected state**: Don't apply `text-orange-1` — orange border + background tint is sufficient.
- **Draft persistence keys changed**: `castory:*` → `fincast:*`. Users with old drafts will lose them (localStorage key mismatch).
- **Auth-logo SVG uses Syne font**: Browser must have Syne loaded or it falls back to Helvetica Neue.

---

## Commands Reference

```bash
npx convex run seedThemes:seedMacroThemes
npx convex run trendsCron:refreshAllTrendsScores
npm run dev
npx tsc --noEmit
npm run lint
```
