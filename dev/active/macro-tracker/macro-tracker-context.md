# Macro Economics Tracker — Context Reference

**Last Updated: 2026-03-09 (Session 3)**

---

## Current State: SIDEBAR UI FIXED + MOMENTUM SCORING, NEEDS COMMIT

- Sidebar trending topics redesigned (compact, no sparkline, full titles)
- Google Trends scoring rewritten: momentum-based (recent vs historical) instead of absolute values
- Momentum scoring skips rate-limited themes (keeps existing score)
- DB has mixed data: 3 themes with real momentum data, 12 with manually-set varied scores
- The 3-hour cron will gradually replace all manual scores with real momentum data
- **Uncommitted session changes**: `components/TrendingTopics.tsx`, `convex/trendsCron.ts`
- **Pre-existing uncommitted** (from IDE/other work): `app/(root)/topics/[topicSlug]/page.tsx`, `convex/schema.ts`, `convex/themeActions.ts`, `convex/themes.ts`
- Latest commits: `24cde78 refactor: simplify trending topics sidebar items` (auto-committed by hook?)

---

## Key Architectural Decisions

### D1: Async Theme Tagging (not blocking publish)
After `createPodcast` returns, fire `tagPodcastThemes` without awaiting. Podcast appears instantly; themes populate ~10s later via Convex reactivity.

### D2: Google Trends via 3-Hour Cron (NOT real-time)
**Decision**: Google Trends scores fetched every 3 hours via `convex/crons.ts` → `convex/trendsCron.ts:refreshAllTrendsScores`. NOT called during podcast publish or seeding.
**Rationale**: Google Trends data doesn't change minute-to-minute. Avoids rate limiting, reduces latency on publish.

### D3: Momentum-Based Scoring (Session 3 change)
**Problem**: Single-keyword Google Trends queries normalize peak to 100, so every keyword gets ~100 → everything "hot".
**Fix**: Fetch 30-day window, compare recent 25% average vs earlier 75% average. Momentum >1 = rising, <1 = falling.
**Mapping**: momentum 0.5→heatScore 0, 1.0→1.5, 1.5→3.0. Thresholds: >1.15 hot, ≥1.03 warming, ≥0.88 stable, else cooling.
**Failure handling**: Returns `null` on rate-limit → theme keeps existing score (NOT overwritten with fallback).
**Delay**: 8s between requests (was 2s) to reduce rate-limiting.

### D4: SVG Sparklines (no recharts dependency)
Inline SVG polyline. Lightweight, no new dependency.

### D5: Replace Generic Topics with Macro Themes
TopicSelector queries `macroThemes` table instead of hardcoded `newsTopics` array.

### D6: Precomputed trendingScore on Podcasts
`trendingScore` = sum of linked themes' heatScores, stored on podcast doc.

---

## Scoring Architecture

**heatScore** (0-3.0): Derived from Google Trends momentum by cron every 3 hours.
- Fetches 30-day data, computes `momentum = recentAvg / earlyAvg`
- `heatScore = (clamp(momentum, 0.5, 1.5) - 0.5) * 3.0`
- Stored on `macroThemes.heatScore` + `trendsScore` (momentum*100) + `trendsUpdatedAt`
- On API failure: theme is SKIPPED, keeps existing score

**heatStatus**: Derived from momentum:
- momentum `> 1.15` → "hot"
- momentum `1.03–1.15` → "warming"
- momentum `0.88–1.03` → "stable"
- momentum `< 0.88` → "cooling"
- No mentions 14+ days → "dormant" (gray) — computed in `themes.ts:computeHeatStatus`

**relevanceScore** on mentions: Fixed at `1.0`. No longer from Google Trends.

**totalMentions**: Count of `themeMentions` rows (incremented by `recordMention`).

**trendingScore** on podcasts: Sum of linked themes' heatScores. Updated by `recordMention` (per-podcast) and `recomputeAllTrendingScores` (bulk, after cron).

**Full pipeline**:
1. Publish podcast → GPT identifies themes → `recordMention` with `relevanceScore: 1.0`
2. Every 3h: cron fetches Google Trends momentum → updates heatScores (skips rate-limited) → recomputes all trendingScores
3. Convex reactivity pushes updates to all connected clients

---

## Key Files — Backend (ALL COMPLETE)

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Tables: podcasts, users, macroThemes (with trendsScore, trendsUpdatedAt), themeMentions |
| `convex/themes.ts` | Queries (getTrendingThemes, getThemeBySlug, getDailyMentionCounts, etc.) + Mutations (createTheme, recordMention, updateThemeHeatScore, recomputeAllTrendingScores, linkThemesToPodcast) |
| `convex/themeActions.ts` | OpenAI actions: tagPodcastThemes (GPT theme ID, fixed relevanceScore=1.0), generateThemeSummary |
| `convex/trendsCron.ts` | `refreshAllTrendsScores` action — momentum-based Google Trends scoring, 8s delays, skip on failure |
| `convex/crons.ts` | Registers 3-hour interval cron calling refreshAllTrendsScores |
| `convex/google-trends-api.d.ts` | Type declarations for google-trends-api package |
| `convex/seedThemes.ts` | Mutation: seeds 15 themes with heatScore 0 (cron populates real scores) |
| `convex/podcast.ts` | getTrendingPodcasts sorts by trendingScore desc |
| `convex/chat.ts` | AI chatbot action: gathers DB context (theme/podcast/trending), calls GPT-4.1-mini (temp 0.3), auth-guarded |

## Key Files — Frontend (ALL COMPLETE)

| File | Purpose |
|------|---------|
| `app/(root)/page.tsx` | Home page — trendingScore sort + theme badges on cards |
| `app/(root)/topics/[topicSlug]/page.tsx` | Topic detail page (text-3xl/4xl heading, metrics, sentiment, related podcasts) |
| `app/(root)/create-news-podcast/page.tsx` | 5-step wizard — async tagging after publish |
| `components/RightSidebar.tsx` | Scrollable TrendingTopics with hidden scrollbar, sticky user profile |
| `components/TrendingTopics.tsx` | Compact sidebar list — full titles, badge + mention count, NO sparkline |
| `components/PodcastCard.tsx` | Theme badges (up to 3 per card) |
| `components/TopicSelector.tsx` | Queries macro themes from Convex with search |
| `components/ThemeBadge.tsx` | Heat status badge (sm/md, 5 statuses) |
| `components/MentionSparkline.tsx` | SVG polyline sparkline (used on topic detail page, removed from sidebar) |
| `components/ChatBot.tsx` | Floating AI chat panel (3 states, context-aware chips, markdown renderer) |

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

- **Google Trends rate limiting from Convex cloud**: Returns HTML/CAPTCHA. Momentum helper returns `null`, caller skips theme. 8s delays between calls.
- **Single-keyword normalization bug (FIXED)**: Absolute scores always ~100. Fixed by momentum approach (recent vs historical comparison).
- **Seed data has heatScore 0**: Run `npx convex run trendsCron:refreshAllTrendsScores` after seeding. Will gradually populate over multiple cron runs due to rate limiting.
- **Current DB has 12 manually-set scores**: These will be replaced by real data as cron runs succeed. No action needed.
- **`getDailyMentionCounts`** (renamed from `getWeeklyMentionCounts`): Uses daily granularity (7 days default).
- **Hero heading**: Uses `text-3xl md:text-4xl` — previous attempts with `clamp(2rem, 8vw, 6rem)` were way too large.
- **Sidebar scrollbar**: Hidden via `.scrollbar-hide` CSS utility in `globals.css`.
- **`google-trends-api`** needs custom `.d.ts` — `convex/google-trends-api.d.ts`.
- **`noise-texture` BREAKS `fixed` positioning**: `.noise-texture` in `globals.css` sets `position: relative` which overrides Tailwind's `fixed` utility. NEVER use on fixed-positioned elements.

---

## Commands Reference

```bash
# Seed themes (heatScore 0, run cron after)
npx convex run seedThemes:seedMacroThemes

# Populate real Google Trends scores (may need multiple runs due to rate limiting)
npx convex run trendsCron:refreshAllTrendsScores

# Verify build
npx next build

# Verify types
npx convex typecheck

# Dev server
npm run dev
```
