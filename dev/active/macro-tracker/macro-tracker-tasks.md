# Macro Economics Tracker — Task Checklist

**Last Updated: 2026-03-09**
**Implementation Plan**: `docs/plans/2026-03-09-macro-tracker-impl.md`

---

## Phase 1: Data Foundation

### Task 1: Schema Changes
- [x] Add `macroThemes` table to `convex/schema.ts`
- [x] Add `themeMentions` table to `convex/schema.ts`
- [x] Add `themeIds` and `trendingScore` fields to `podcasts` table
- [x] Add `by_trendingScore` index to podcasts
- [x] Verify schema pushes via `npx convex dev`
- [x] Commit: `feat: add macroThemes and themeMentions tables, extend podcasts`

### Task 2: Theme Queries & Mutations
- [x] Create `convex/themes.ts`
- [x] Implement `getTrendingThemes` query (by heatScore desc, limit 20)
- [x] Implement `getThemeBySlug` query
- [x] Implement `getThemeMentions` query
- [x] Implement `searchThemes` query (full-text search)
- [x] Implement `getWeeklyMentionCounts` query (sparkline data)
- [x] Implement `getSentimentBreakdown` query
- [x] Implement `getPodcastsByTheme` query
- [x] Implement `createTheme` mutation (with slug dedup)
- [x] Implement `recordMention` mutation (insert + recompute heatScore + recompute trendingScore)
- [x] Implement `updateThemeSummary` mutation
- [x] Implement `linkThemesToPodcast` mutation
- [x] Verify all functions compile via `npx convex dev`
- [x] Commit: `feat: add theme queries, mutations, and heat score computation`

### Task 3: OpenAI Theme Tagging Actions
- [x] Create `convex/themeActions.ts` with `"use node"` directive
- [x] Implement `tagPodcastThemes` action (GPT → create themes → record mentions → link to podcast → generate summaries)
- [x] Implement `generateThemeSummary` action (GPT → summary + risk chain)
- [x] Add try-catch around JSON.parse calls for robustness
- [x] Verify compilation via `npx convex dev`
- [x] Commit: `feat: add tagPodcastThemes and generateThemeSummary OpenAI actions`

---

## Phase 2: Seed Data

### Task 4: Seed Script
- [x] Create `convex/seedThemes.ts`
- [x] Define 15 macro themes with realistic heat scores
- [x] Implement `seedMacroThemes` mutation with idempotency check
- [x] Run: `npx convex run seedThemes:seedMacroThemes` — "Seeded 15 macro themes"
- [x] Commit: `feat: add seed script with 15 starter macro themes`

---

## Phase 3: UI Components

### Task 5: Reusable UI Atoms
- [x] Create `components/ThemeBadge.tsx` (heat status colored dot + label, sm/md sizes)
- [x] Create `components/MentionSparkline.tsx` (inline SVG polyline, no dependencies)
- [x] Commit: `feat: add ThemeBadge and MentionSparkline reusable components`

### Task 6: Trending Topics Sidebar
- [x] Create `components/TrendingTopics.tsx` (ranked list with sparklines per item)
- [x] Replace `components/RightSidebar.tsx` content (remove Carousel, Header, top podcasters; add TrendingTopics)
- [x] Commit: `feat: replace right sidebar with trending macro topics`

---

## Phase 4: Core Pages

### Task 7: Home Page + PodcastCard Badges
- [x] Update `getTrendingPodcasts` in `convex/podcast.ts` to sort by `trendingScore` desc (fallback: views)
- [x] Add `themes` prop to `components/PodcastCard.tsx` (ThemeInfo[] with label + heatStatus)
- [x] Display up to 3 theme badges below podcast card content
- [x] Update `app/(root)/page.tsx` to pass theme data to PodcastCard
- [x] Commit: `feat: sort home feed by trendingScore, add theme badges to podcast cards`

### Task 8: Topic Detail Page
- [x] Create `components/SentimentBreakdown.tsx` (horizontal stacked bar)
- [x] Create `components/RiskChainDisplay.tsx` (styled risk chain)
- [x] Create `app/(root)/topics/[topicSlug]/page.tsx`
- [x] Implement header section (title, heat badge, category, regions, asset classes)
- [x] Implement AI summary + risk chain display
- [x] Implement metrics grid (heat score, total mentions, week/week delta, sparkline)
- [x] Implement sentiment breakdown
- [x] Implement related podcasts section (sorted by views, CTA if empty)
- [x] Commit: `feat: add topic detail page with metrics, sentiment, and related podcasts`

---

## Phase 5: Pipeline Wiring

### Task 9: Create Flow + Async Tagging
- [x] Replace `components/TopicSelector.tsx` to query macro themes from Convex
- [x] Show trending themes in grid with heat badges
- [x] Add search input for full-text search across themes
- [x] Handle custom topic (user types something not in DB)
- [x] Add `tagThemes` action call to `create-news-podcast/page.tsx` handlePublish
- [x] Fire tagThemes async (fire-and-forget with error logging)
- [x] Pass `sourceArticleUrls` from selected articles
- [x] Commit: `feat: replace topic selector with macro themes, wire async theme tagging`

### Task 10: Cleanup
- [x] Remove `newsTopics` from `constants/index.ts`
- [x] Verify no remaining imports of `newsTopics` in codebase
- [x] Verify build succeeds
- [x] Commit: `chore: remove unused newsTopics constant`

---

## Phase 6: Verification

### Task 11: End-to-End Demo Flow
- [x] Ensure seed data exists (`npx convex run seedThemes:seedMacroThemes`)
- [x] Build passes (`next build` — all routes registered including `/topics/[topicSlug]`)
- [x] Code review passed — all 18 checklist items verified
- [x] JSON.parse safety fix applied to `convex/themeActions.ts`
- [ ] Live demo test (requires `npm run dev` with browser)

---

## Progress Summary

| Phase | Status | Tasks Done | Tasks Total |
|-------|--------|-----------|-------------|
| Phase 1: Data Foundation | Complete | 3 | 3 |
| Phase 2: Seed Data | Complete | 1 | 1 |
| Phase 3: UI Components | Complete | 2 | 2 |
| Phase 4: Core Pages | Complete | 2 | 2 |
| Phase 5: Pipeline Wiring | Complete | 2 | 2 |
| Phase 6: Verification | Build Verified | 1 | 1 |
| **Total** | **Build Passing** | **11** | **11** |

## Known Trade-offs (from code review)
- Heat score baseline includes current week in 28-day average (acceptable for hackathon)
- `getPodcastsByTheme` and `recordMention` do full table scans (fine for demo-scale data)
- `TrendingTopics` fires N+1 queries for sparklines (idiomatic Convex, fine for 10 items)
