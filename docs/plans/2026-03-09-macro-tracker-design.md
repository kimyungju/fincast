# Castory: Macro Economics Tracker Extension — Design

**Date:** 2026-03-09
**Status:** Approved

## Goal

Extend Castory into a macro economics tracker for asset managers. Track macro themes, measure trendingness via heat scores, connect developments across regions/asset classes, and surface risk implications — with the podcast platform as the content backbone.

## Architecture

Two new Convex tables (`macroThemes`, `themeMentions`) create a feedback loop:

```
Create Podcast → Publish → [async] GPT tags themes → recordMention
                                                         ↓
                                              recompute heatScore
                                              recompute trendingScore
                                              regenerate AI summary
                                                         ↓
                                              Real-time UI updates
                                              (sidebar, home, topic pages)
```

Post-publish pipeline is async — podcast appears immediately, themes populate seconds later via Convex reactivity.

## Data Model

### New: `macroThemes`

| Field | Type | Notes |
|-------|------|-------|
| slug | string | URL-friendly identifier |
| label | string | Display name |
| category | string | "Monetary Policy", "Geopolitics", "Commodities", etc. |
| regions | string[] | ["US", "EU", "UK", "CN", "JP", ...] |
| assetClasses | string[] | ["rates", "FX", "equities", "commodities", "credit"] |
| heatScore | number | Computed ratio (see algorithm) |
| heatStatus | string | "hot", "warming", "stable", "cooling", "dormant" |
| latestSummary | string? | AI-generated 2-3 sentence overview |
| riskChain | string? | "Event → Mechanism → Market Impact" |
| totalMentions | number | All-time count |
| lastMentionAt | number | Timestamp of most recent mention |

Indexes: `by_slug`, `by_heatScore`, `by_category`
Search index: `search_label` on `label`

### New: `themeMentions`

| Field | Type | Notes |
|-------|------|-------|
| themeId | id("macroThemes") | Parent theme |
| sourceType | string | "news-podcast", "manual-podcast" |
| sourceId | id("podcasts") | Source podcast |
| sentiment | string | "hawkish", "dovish", "neutral" |
| relevanceScore | number | 0-1 |
| summary | string | Brief mention summary |
| sourceArticles | string[]? | URLs of source articles |
| timestamp | number | When mention was recorded |

Indexes: `by_theme`, `by_theme_and_time`, `by_source`

### Modified: `podcasts`

Add:
- `themeIds: v.optional(v.array(v.id("macroThemes")))` — linked themes
- `trendingScore: v.optional(v.number())` — precomputed, updated when linked themes' heatScores change

New index: `by_trendingScore`

## Heat Score Algorithm

```
recentMentions = sum(relevanceScore) for mentions in last 7 days
baseline = average weekly sum(relevanceScore) over trailing 28 days
heatScore = recentMentions / max(baseline, 1)
```

Heat status mapping:
- `> 2.0` → Hot (theme spiking)
- `1.3 – 2.0` → Warming (accelerating)
- `0.7 – 1.3` → Stable (normal)
- `< 0.7` → Cooling (fading)
- `0 mentions in 14+ days` → Dormant

Primary recomputation: real-time inside `recordMention` mutation.
Fallback: daily scheduled function for batch reconciliation.

## Backend Functions (`convex/themes.ts`)

### Queries
- `getTrendingThemes` — all themes sorted by heatScore desc, limit 20
- `getThemeBySlug(slug)` — single theme by slug
- `getThemeMentions(themeId, limit?)` — mentions sorted by timestamp desc
- `searchThemes(query)` — full-text search on labels
- `getWeeklyMentionCounts(themeId, weeks)` — aggregated for sparklines
- `getSentimentBreakdown(themeId)` — hawkish/dovish/neutral percentages
- `getPodcastsByTheme(themeId)` — podcasts linked to a theme, sorted by views

### Mutations
- `createTheme(...)` — create with heatScore 0, status "dormant"
- `recordMention(...)` — insert mention, recompute parent theme's heatScore/heatStatus/totalMentions/lastMentionAt, recompute trendingScore for linked podcasts
- `updateThemeSummary(themeId, summary, riskChain)` — update AI-generated fields

### Actions (server-side, OpenAI)
- `tagPodcastThemes({ podcastId, scriptText })` — GPT identifies themes, creates/finds themes, records mentions, updates podcast's themeIds. Called async after publish.
- `generateThemeSummary({ themeId })` — fetches last 10 mention summaries, GPT produces consolidated summary + risk chain.

## UI Changes

### Modified
| Component | Change |
|-----------|--------|
| RightSidebar | Replace podcasters/carousel with TrendingTopics list |
| Home page | Sort podcasts by trendingScore desc |
| PodcastCard | Add theme tag badges below content |
| TopicSelector | Replace 8 generic categories with trending macro themes + search |
| create-news-podcast | Fire async tagPodcastThemes after publish |

### New Components
- `ThemeBadge` — heat status colored dot + label
- `TrendingTopics` — sidebar ranked list with sparklines
- `MentionSparkline` — inline SVG polyline (no external dependency)
- `SentimentBreakdown` — horizontal stacked bar
- `RiskChainDisplay` — styled "Event → Mechanism → Impact"

### New Pages
- `/topics/[topicSlug]` — topic detail with summary, risk chain, metrics, sentiment, related podcasts

## Seed Data

10-15 macro themes with realistic heat scores:
US Inflation, Fed Policy, ECB Policy, BOJ Policy, China Trade, Oil Prices, US Labor Market, Eurozone Growth, USD Strength, Emerging Markets, Global Supply Chains, AI & Productivity, US Housing, Crypto Regulation, Climate Policy

## Design Constraints

- Brutalist aesthetic: 4-6px borders, hard offset shadows, charcoal backgrounds, orange #ff6b35 accent, cream text, Syne 900 uppercase headings, Crimson Pro italic descriptions
- Use existing CSS classes: `card-brutal`, `btn-brutal`, `noise-texture`
- shadcn/ui as base, styled to match
- All Convex queries via `useQuery` for real-time reactivity
- TypeScript strict mode

## What Stays the Same

- Manual podcast creation flow
- Audio generation (TTS-1), thumbnail generation (DALL-E 3)
- Discover page, profile pages, podcast detail player
- Auth (Clerk), file storage, webhook sync
- All existing Convex functions (extended, not replaced)
