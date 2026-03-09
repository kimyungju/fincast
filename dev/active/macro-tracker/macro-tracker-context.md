# Macro Economics Tracker — Context Reference

**Last Updated: 2026-03-09**

---

## Key Architectural Decisions

### D1: Async Theme Tagging (not blocking publish)
**Decision**: After `createPodcast` returns, fire `tagPodcastThemes` without awaiting. Podcast appears instantly; themes populate ~10s later via Convex reactivity.
**Rationale**: Snappy UX during live demo. GPT calls take 5-10s — blocking would make publish feel slow.

### D2: Real-Time Heat Score Recomputation (Option A)
**Decision**: Recompute heatScore inside `recordMention` mutation, not via scheduled batch.
**Rationale**: Live demo impact — scores update immediately when a podcast is tagged.
**Fallback**: Daily scheduled function for batch reconciliation (not implemented in v1).

### D3: SVG Sparklines (no recharts dependency)
**Decision**: Inline SVG polyline for sparkline charts.
**Rationale**: Lightweight, no new dependency, fits brutalist aesthetic.

### D4: Replace Generic Topics with Macro Themes
**Decision**: TopicSelector queries `macroThemes` table instead of hardcoded `newsTopics` array.
**Rationale**: App is now macro-focused for asset managers. Generic categories dilute the focus.

### D5: Precomputed trendingScore on Podcasts
**Decision**: Store `trendingScore` (sum of linked themes' heatScores) directly on podcast doc.
**Rationale**: Convex has no JOINs. Computing at query time would require loading all themes for every podcast on every home page load.

---

## Key Files — Backend

| File | Purpose | Status |
|------|---------|--------|
| `convex/schema.ts` | Database schema — podcasts, users, macroThemes, themeMentions | To modify |
| `convex/themes.ts` | Theme queries + mutations (heat score, mentions, search) | To create |
| `convex/themeActions.ts` | OpenAI actions (tagPodcastThemes, generateThemeSummary) | To create |
| `convex/seedThemes.ts` | One-time seed mutation for 15 starter themes | To create |
| `convex/podcast.ts` | Existing podcast CRUD — getTrendingPodcasts needs sorting | To modify |
| `convex/news.ts` | News fetching + script generation — unchanged | Unchanged |
| `convex/openai.ts` | TTS + DALL-E actions — unchanged | Unchanged |

## Key Files — Frontend

| File | Purpose | Status |
|------|---------|--------|
| `app/(root)/page.tsx` | Home page — needs trendingScore sort + theme badges | To modify |
| `app/(root)/topics/[topicSlug]/page.tsx` | Topic detail page — new route | To create |
| `app/(root)/create-news-podcast/page.tsx` | 5-step wizard — needs async tagging + topic selector | To modify |
| `components/RightSidebar.tsx` | Sidebar — replace podcasters with trending topics | To modify |
| `components/PodcastCard.tsx` | Podcast card — add theme badges | To modify |
| `components/TopicSelector.tsx` | Topic picker — replace with macro theme search | To modify |
| `components/ThemeBadge.tsx` | Heat status badge component | To create |
| `components/MentionSparkline.tsx` | SVG sparkline component | To create |
| `components/TrendingTopics.tsx` | Sidebar trending list | To create |
| `components/SentimentBreakdown.tsx` | Stacked bar chart | To create |
| `components/RiskChainDisplay.tsx` | Risk chain display | To create |
| `constants/index.ts` | Remove unused `newsTopics` | To modify |

---

## Heat Score Algorithm

```
recentMentions = sum(relevanceScore) for last 7 days
baseline = avg weekly sum(relevanceScore) over trailing 28 days
heatScore = recentMentions / max(baseline, 1)

Status mapping:
  > 2.0    → "hot"     (red)
  1.3–2.0  → "warming" (orange)
  0.7–1.3  → "stable"  (yellow)
  < 0.7    → "cooling" (blue)
  no mentions 14+ days → "dormant" (gray)
```

---

## Data Flow: Publish → Theme Tags → UI Update

```
1. Client: handlePublish()
   └─ await createPodcast({...}) → returns podcastId
   └─ tagThemes({ podcastId, scriptText }).then(...).catch(...)  // fire-and-forget
   └─ router.push("/")

2. Server: tagPodcastThemes action
   └─ GPT-4.1-mini identifies themes from script text
   └─ For each theme:
       └─ createTheme (find or create)
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
- **`"use node"` directive**: Required for files that use Node.js APIs (OpenAI SDK). Only actions can be in these files.
- **Queries vs Mutations vs Actions**: Queries are read-only. Mutations write to DB. Actions can call external APIs and run mutations/queries via `ctx.runMutation()`/`ctx.runQuery()`.
- **`useQuery` with "skip"**: Pass `"skip"` as second arg to conditionally skip a query (e.g., `useQuery(api.themes.getThemeBySlug, theme ? { slug } : "skip")`)
- **Search indexes**: Used for full-text search. Must be defined in schema. Query with `.withSearchIndex()`.
- **Real-time reactivity**: All `useQuery` hooks auto-update when underlying data changes. No polling needed.

---

## Seed Theme Data

15 themes across 7 categories:

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

## Dependencies Between Tasks

```
Task 1 (Schema) ──► Task 2 (Queries/Mutations) ──► Task 3 (Actions)
                                                          │
Task 1 ──► Task 4 (Seed Data)                            │
                                                          ▼
Task 5 (UI Atoms) ──► Task 6 (Sidebar) ◄──── Task 4     Task 9 (Create Flow)
                  ──► Task 7 (Home Page)                   │
                  ──► Task 8 (Topic Detail)                ▼
                                                    Task 10 (Cleanup)
                                                          │
                            All ──────────────────► Task 11 (Verify)
```
