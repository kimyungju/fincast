# Macro Economics Tracker — Context Reference

**Last Updated: 2026-03-09**

---

## Current State: ALL CODE COMPLETE, BUILD PASSING, PUSHED TO REMOTE

- All 11 tasks implemented and committed
- `npx next build` passes clean (all routes including `/topics/[topicSlug]`)
- `npx convex typecheck` passes clean
- Seed data populated (15 macro themes)
- Latest commit: `4e612d6 feat: use Google Trends for relevanceScore instead of GPT`
- Branch: `main`, pushed to `origin/main`
- **Only remaining item**: Live demo test with `npm run dev` in browser

---

## Key Architectural Decisions

### D1: Async Theme Tagging (not blocking publish)
**Decision**: After `createPodcast` returns, fire `tagPodcastThemes` without awaiting. Podcast appears instantly; themes populate ~10s later via Convex reactivity.
**Rationale**: Snappy UX during live demo. GPT calls take 5-10s — blocking would make publish feel slow.

### D2: Real-Time Heat Score Recomputation (Option A)
**Decision**: Recompute heatScore inside `recordMention` mutation, not via scheduled batch.
**Rationale**: Live demo impact — scores update immediately when a podcast is tagged.

### D3: SVG Sparklines (no recharts dependency)
**Decision**: Inline SVG polyline for sparkline charts.
**Rationale**: Lightweight, no new dependency, fits brutalist aesthetic.

### D4: Replace Generic Topics with Macro Themes
**Decision**: TopicSelector queries `macroThemes` table instead of hardcoded `newsTopics` array.

### D5: Precomputed trendingScore on Podcasts
**Decision**: Store `trendingScore` (sum of linked themes' heatScores) directly on podcast doc.
**Rationale**: Convex has no JOINs. Computing at query time would require loading all themes for every podcast.

### D6: Google Trends for relevanceScore (NOT GPT)
**Decision**: Use `google-trends-api` npm package to fetch real Google Trends interest scores (0-100) as the source for `relevanceScore`, instead of having GPT assign arbitrary scores.
**Rationale**: (1) Cost savings — no extra GPT tokens for scoring, (2) Objectivity — real public interest data, not GPT hallucinated numbers. User explicitly requested this change.
**Implementation**: `getGoogleTrendsScore(keyword)` helper in `convex/themeActions.ts` queries 7-day US interest, normalizes to 0-1. Falls back to 50/100 on error.
**Type declaration**: `convex/google-trends-api.d.ts` added since package lacks TypeScript types.

---

## Scoring Architecture Explained

**"Mentions"** = number of times a theme was identified in a podcast by the GPT tagging pipeline. Each `recordMention` call creates a row in `themeMentions` and increments `totalMentions` on the theme. Currently, seed data provides fake `totalMentions` values (18-24).

**relevanceScore** (0-1): Sourced from Google Trends. Measures how publicly trending a keyword is right now. This is the WEIGHT of each mention.

**heatScore** (ratio): Computed internally by `recordMention` mutation:
```
recentMentions = sum(relevanceScore) for last 7 days
baseline = avg weekly sum(relevanceScore) over trailing 28 days
heatScore = recentMentions / max(baseline, 1)
```
This measures MOMENTUM — is the theme spiking above its own baseline?

**heatStatus**: Derived from heatScore:
- `> 2.0` → "hot" (red)
- `1.3–2.0` → "warming" (orange)
- `0.7–1.3` → "stable" (yellow)
- `< 0.7` → "cooling" (blue)
- No mentions 14+ days → "dormant" (gray)

**trendingScore** on podcasts: Sum of linked themes' heatScores. Used to rank the home feed.

**Full pipeline**: Publish → GPT identifies themes → Google Trends provides relevanceScore → recordMention stores mention + recomputes heatScore → linkThemesToPodcast sets trendingScore → Convex reactivity updates all connected clients.

---

## Key Files — Backend (ALL COMPLETE)

| File | Purpose | Status |
|------|---------|--------|
| `convex/schema.ts` | Database schema — podcasts, users, macroThemes, themeMentions | ✅ Done |
| `convex/themes.ts` | Theme queries + mutations (heat score, mentions, search) | ✅ Done |
| `convex/themeActions.ts` | OpenAI + Google Trends actions (tagPodcastThemes, generateThemeSummary) | ✅ Done |
| `convex/google-trends-api.d.ts` | Type declarations for google-trends-api package | ✅ Done |
| `convex/seedThemes.ts` | One-time seed mutation for 15 starter themes | ✅ Done |
| `convex/podcast.ts` | Modified getTrendingPodcasts to sort by trendingScore | ✅ Done |

## Key Files — Frontend (ALL COMPLETE)

| File | Purpose | Status |
|------|---------|--------|
| `app/(root)/page.tsx` | Home page — trendingScore sort + theme badges on cards | ✅ Done |
| `app/(root)/topics/[topicSlug]/page.tsx` | Topic detail page (metrics, sentiment, risk chain, related podcasts) | ✅ Done |
| `app/(root)/create-news-podcast/page.tsx` | 5-step wizard — async tagging after publish | ✅ Done |
| `components/RightSidebar.tsx` | Replaced with TrendingTopics | ✅ Done |
| `components/PodcastCard.tsx` | Added theme badges (up to 3 per card) | ✅ Done |
| `components/TopicSelector.tsx` | Queries macro themes from Convex with search | ✅ Done |
| `components/ThemeBadge.tsx` | Heat status badge (sm/md, 5 statuses) | ✅ Done |
| `components/MentionSparkline.tsx` | SVG polyline sparkline | ✅ Done |
| `components/TrendingTopics.tsx` | Sidebar trending list with sparklines | ✅ Done |
| `components/SentimentBreakdown.tsx` | Horizontal stacked bar | ✅ Done |
| `components/RiskChainDisplay.tsx` | Styled risk chain display | ✅ Done |
| `constants/index.ts` | Removed unused newsTopics | ✅ Done |

---

## Data Flow: Publish → Theme Tags → UI Update

```
1. Client: handlePublish()
   └─ await createPodcast({...}) → returns podcastId
   └─ tagThemes({ podcastId, scriptText }).then(...).catch(...)  // fire-and-forget
   └─ router.push("/")

2. Server: tagPodcastThemes action
   └─ GPT-4.1-mini identifies themes from script text (no relevanceScore in GPT output)
   └─ For each theme:
       └─ Google Trends: getGoogleTrendsScore(tag.label) → 0-100 → normalize to 0-1
       └─ createTheme (find or create by slug)
       └─ recordMention (insert + recompute heatScore + recompute trendingScore)
   └─ linkThemesToPodcast (set themeIds + trendingScore on podcast)
   └─ generateThemeSummary (GPT summary + risk chain for each theme)

3. Convex reactivity pushes all mutations to connected clients
   └─ Home page: useQuery(getTrendingPodcasts) re-renders with new order
   └─ Sidebar: useQuery(getTrendingThemes) re-renders with updated scores
   └─ Topic page: useQuery(getThemeBySlug) re-renders with new summary
```

---

## Design System Reference

| Token | Value | Usage |
|-------|-------|-------|
| `--color-charcoal` | `#0a0a0a` | Darkest background |
| `--color-dark-gray` | `#1a1a1a` | Card backgrounds |
| `--color-mid-gray` | `#2a2a2a` | Borders, dividers |
| `--color-orange` | `#ff6b35` | Primary accent |
| `--color-cream` | `#f5f1e8` | Text on dark |

| Class | Purpose |
|-------|---------|
| `card-brutal` | 4px border, dark bg, shadow-brutal, hover translate |
| `btn-brutal` | Orange bg, 4px border, uppercase, shadow-brutal |
| `input-class` | Charcoal bg, 4px mid-gray border, focus orange |
| `noise-texture` | SVG fractal noise overlay |
| `text-display` | clamp(2.5rem,5vw,4rem), uppercase, bold |

**Typography**: Syne (900 weight, uppercase) for headings, Crimson Pro (italic) for descriptions.

---

## Convex-Specific Patterns

- **No JOINs**: Denormalize or multi-query from client
- **`"use node"` directive**: Required for files that use Node.js APIs (OpenAI SDK, google-trends-api). Only actions can be in these files.
- **Queries vs Mutations vs Actions**: Queries are read-only. Mutations write to DB. Actions can call external APIs and run mutations/queries via `ctx.runMutation()`/`ctx.runQuery()`.
- **`useQuery` with "skip"**: Pass `"skip"` as second arg to conditionally skip a query
- **Search indexes**: Used for full-text search. Must be defined in schema. Query with `.withSearchIndex()`.
- **Real-time reactivity**: All `useQuery` hooks auto-update when underlying data changes. No polling needed.

---

## Seed Theme Data

15 themes across 7 categories, seeded via `npx convex run seedThemes:seedMacroThemes`:

| Slug | Label | Category | Heat Score | Status |
|------|-------|----------|-----------|--------|
| us-inflation | US Inflation | Monetary Policy | 2.4 | hot |
| fed-policy | Fed Policy | Monetary Policy | 2.1 | hot |
| ai-productivity | AI & Productivity | Technology | 2.3 | hot |
| china-trade | China Trade | Trade | 1.9 | warming |
| boj-policy | BOJ Policy | Monetary Policy | 1.8 | warming |
| usd-strength | USD Strength | Markets | 1.6 | warming |
| ecb-policy | ECB Policy | Monetary Policy | 1.5 | warming |
| oil-prices | Oil Prices | Commodities | 1.4 | warming |
| crypto-regulation | Crypto Regulation | Regulation | 1.2 | stable |
| us-labor-market | US Labor Market | Labor | 1.1 | stable |
| eurozone-growth | Eurozone Growth | Fiscal Policy | 0.9 | stable |
| emerging-markets | Emerging Markets | Markets | 0.8 | stable |
| us-housing | US Housing | Real Estate | 0.6 | cooling |
| global-supply-chains | Global Supply Chains | Trade | 0.5 | cooling |
| climate-energy-transition | Climate & Energy Transition | Energy | 0.4 | cooling |

---

## Known Issues / Potential Gotchas

- **Google Trends rate limiting**: `google-trends-api` can return HTML (CAPTCHA) instead of JSON if called too rapidly. The `getGoogleTrendsScore` helper catches this and falls back to 50. For demo, themes are processed sequentially which helps avoid rate limits.
- **Seed data mentions are fake**: `totalMentions` in seed data (18-24) are hardcoded, not from real `themeMentions` rows. The sparklines will be flat/empty until real podcasts are created.
- **Heat score baseline includes current week** in 28-day average (acceptable for hackathon).
- **`getPodcastsByTheme` and `recordMention` do full table scans** (fine for demo-scale data).
- **`TrendingTopics` fires N+1 queries** for sparklines (idiomatic Convex, fine for 10 items).

---

## Git History (latest first)

```
4e612d6 feat: use Google Trends for relevanceScore instead of GPT
d5094c1 docs: add macro tracker design, implementation plan, and dev docs
139ca6c fix: add JSON.parse safety in themeActions, update task tracker
cf66e1a sync generated files, add JSON parse safety in themeActions
223dd1b feat: replace topic selector with macro themes, wire async theme tagging
48d8180 feat: add topic detail page with metrics, sentiment, and related podcasts
d0a951c feat: sort home feed by trendingScore, add theme badges to podcast cards
24a1545 feat: replace right sidebar with trending macro topics
79f520c feat: add tagPodcastThemes and generateThemeSummary OpenAI actions
396b6b9 feat: add ThemeBadge and MentionSparkline reusable components
```
