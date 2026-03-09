# Macro Economics Tracker — Context Reference

**Last Updated: 2026-03-09 (Session 2)**

---

## Current State: AI CHATBOT ADDED, LAYOUT BUG FIXED, NEEDS PUSH

- Macro tracker + AI chatbot feature complete, build passing
- Latest commit: `9ca8e4d fix: redesign chatbot to match brutalist design system` (+ layout bug fix uncommitted)
- Branch: `main`, needs push to `origin/main`
- **Uncommitted**: removed `noise-texture` from ChatBot panel (layout bug fix)
- **Remaining**: Commit layout fix, push, live demo test with `npm run dev`

---

## Key Architectural Decisions

### D1: Async Theme Tagging (not blocking publish)
After `createPodcast` returns, fire `tagPodcastThemes` without awaiting. Podcast appears instantly; themes populate ~10s later via Convex reactivity.

### D2: Google Trends via 3-Hour Cron (NOT real-time)
**Decision**: Google Trends scores fetched every 3 hours via `convex/crons.ts` → `convex/trendsCron.ts:refreshAllTrendsScores`. NOT called during podcast publish or seeding.
**Rationale**: Google Trends data doesn't change minute-to-minute. Avoids rate limiting, reduces latency on publish.
**How it works**: Cron fetches Google Trends (0-100) for each theme, maps to heatScore (0-3.0) via `trendsScoreToHeat()`, updates all themes, then recomputes all podcast `trendingScore`s.

### D3: SVG Sparklines (no recharts dependency)
Inline SVG polyline. Lightweight, no new dependency.

### D4: Replace Generic Topics with Macro Themes
TopicSelector queries `macroThemes` table instead of hardcoded `newsTopics` array.

### D5: Precomputed trendingScore on Podcasts
`trendingScore` = sum of linked themes' heatScores, stored on podcast doc.

---

## Scoring Architecture

**heatScore** (0-3.0): Derived from Google Trends by cron every 3 hours.
- `trendsScore` (0-100) from Google Trends API
- `heatScore = (trendsScore / 100) * 3.0`
- Stored on `macroThemes.heatScore` + raw `trendsScore` + `trendsUpdatedAt`

**heatStatus**: Derived from heatScore:
- `> 2.0` → "hot" (red)
- `1.3–2.0` → "warming" (orange)
- `0.7–1.3` → "stable" (yellow)
- `< 0.7` → "cooling" (blue)
- No mentions 14+ days → "dormant" (gray)

**relevanceScore** on mentions: Fixed at `1.0`. No longer from Google Trends.

**totalMentions**: Count of `themeMentions` rows (incremented by `recordMention`).

**trendingScore** on podcasts: Sum of linked themes' heatScores. Updated by `recordMention` (per-podcast) and `recomputeAllTrendingScores` (bulk, after cron).

**Full pipeline**:
1. Publish podcast → GPT identifies themes → `recordMention` with `relevanceScore: 1.0`
2. Every 3h: cron fetches Google Trends → updates all heatScores → recomputes all trendingScores
3. Convex reactivity pushes updates to all connected clients

---

## Key Files — Backend (ALL COMPLETE)

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Tables: podcasts, users, macroThemes (with trendsScore, trendsUpdatedAt), themeMentions |
| `convex/themes.ts` | Queries (getTrendingThemes, getThemeBySlug, getDailyMentionCounts, etc.) + Mutations (createTheme, recordMention, updateThemeHeatScore, recomputeAllTrendingScores, linkThemesToPodcast) |
| `convex/themeActions.ts` | OpenAI actions: tagPodcastThemes (GPT theme ID, fixed relevanceScore=1.0), generateThemeSummary |
| `convex/trendsCron.ts` | `refreshAllTrendsScores` action — fetches Google Trends for all themes, updates heatScore/heatStatus |
| `convex/crons.ts` | Registers 3-hour interval cron calling refreshAllTrendsScores |
| `convex/google-trends-api.d.ts` | Type declarations for google-trends-api package |
| `convex/seedThemes.ts` | Mutation: seeds 15 themes with heatScore 0 (cron populates real scores) |
| `convex/podcast.ts` | getTrendingPodcasts sorts by trendingScore desc |
| `convex/chat.ts` | **NEW** — AI chatbot action: gathers DB context (theme/podcast/trending), calls GPT-4.1-mini (temp 0.3), auth-guarded |

## Key Files — Frontend (ALL COMPLETE)

| File | Purpose |
|------|---------|
| `app/(root)/page.tsx` | Home page — trendingScore sort + theme badges on cards |
| `app/(root)/topics/[topicSlug]/page.tsx` | Topic detail page (text-3xl/4xl heading, metrics, sentiment, related podcasts) |
| `app/(root)/create-news-podcast/page.tsx` | 5-step wizard — async tagging after publish |
| `components/RightSidebar.tsx` | Scrollable TrendingTopics with hidden scrollbar, sticky user profile |
| `components/TrendingTopics.tsx` | Sidebar list using getDailyMentionCounts (7 days) for sparklines |
| `components/PodcastCard.tsx` | Theme badges (up to 3 per card) |
| `components/TopicSelector.tsx` | Queries macro themes from Convex with search |
| `components/ThemeBadge.tsx` | Heat status badge (sm/md, 5 statuses) |
| `components/MentionSparkline.tsx` | SVG polyline sparkline |
| `components/SentimentBreakdown.tsx` | Horizontal stacked bar |
| `components/RiskChainDisplay.tsx` | Styled risk chain display |
| `components/ChatBot.tsx` | **NEW** — Floating AI chat panel (3 states, context-aware chips, markdown renderer) |

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

- **Google Trends rate limiting**: Can return HTML/CAPTCHA. Helper falls back to 50. Cron uses 2s delays between calls.
- **Seed data has heatScore 0**: Run `npx convex run trendsCron:refreshAllTrendsScores` after seeding to populate real scores.
- **`getDailyMentionCounts`** (renamed from `getWeeklyMentionCounts`): Uses daily granularity (7 days default).
- **Hero heading**: Uses `text-3xl md:text-4xl` — previous attempts with `clamp(2rem, 8vw, 6rem)` were way too large.
- **Sidebar scrollbar**: Hidden via `.scrollbar-hide` CSS utility in `globals.css`.
- **`google-trends-api`** needs custom `.d.ts` — `convex/google-trends-api.d.ts`.
- **`noise-texture` BREAKS `fixed` positioning**: `.noise-texture` in `globals.css` sets `position: relative` which overrides Tailwind's `fixed` utility (CSS cascade order). NEVER use `noise-texture` on fixed-positioned elements.

---

## Git History (latest first)

```
9ca8e4d fix: redesign chatbot to match brutalist design system
d721656 fix: add auth guard to chat action + optimize markdown renderer
4973423 feat: mount ChatBot in root layout
a787892 feat: add ChatBot floating panel component
40e6c09 feat: add chatbot Convex action with database context gathering
d9f8218 feat: add chatbot animation CSS (slide-up, typing dots)
40897b8 refactor: rename getWeeklyMentionCounts to getDailyMentionCounts
25d924b fix: reduce hero heading font size to text-3xl/text-4xl
5997193 fix: use fluid clamp() font sizing for topic hero heading
1b0264b fix: scrollable trending sidebar + dynamic hero font sizing
deb1bab feat: move Google Trends to 3-hour cron job
4e612d6 feat: use Google Trends for relevanceScore instead of GPT
d5094c1 docs: add macro tracker design, implementation plan, and dev docs
```

---

## Commands Reference

```bash
# Seed themes (heatScore 0, run cron after)
npx convex run seedThemes:seedMacroThemes

# Populate real Google Trends scores
npx convex run trendsCron:refreshAllTrendsScores

# Verify build
npx next build

# Verify types
npx convex typecheck

# Dev server
npm run dev
```
