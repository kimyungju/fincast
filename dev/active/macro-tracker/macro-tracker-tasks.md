# Macro Economics Tracker — Task Checklist

**Last Updated: 2026-03-09 (Session 4)**

---

## All Phases Complete ✅

Phases 1-6 (Data Foundation, Seed Data, UI Components, Core Pages, Pipeline Wiring, Verification) all complete.

---

## Session 3 Changes ✅

- [x] Sidebar trending topics redesign (compact, no sparkline)
- [x] Momentum-based Google Trends scoring
- [x] Heat score DB data manually set for varied distribution

## Session 4 Changes

### Timeframe Fixes ✅
- [x] Changed sparkline from 8-week to 7-day daily buckets (`getDailyMentionCounts`)
- [x] Changed "Week / Week" to "Day / Day" on topic detail page
- [x] Updated `TrendingTopics.tsx` sidebar to use daily sparkline
- [x] Committed: `cf66e1a`

### Removed Sentiment Section ✅
- [x] Removed `SentimentBreakdown` component usage from topic detail page
- [x] Removed sentiment query and related imports

### Theme Summary & Source Articles ✅
- [x] Schema: added `summaryArticles` field to `macroThemes` table
- [x] Schema: added `articleDetails` field to `themeMentions` table
- [x] `convex/themes.ts`: added `getThemeById` query, `getThemeArticles` query, updated `recordMention` and `updateThemeSummary` to accept article details
- [x] `convex/themeActions.ts`: added `sourceArticleDetails` arg to `tagPodcastThemes`; rewrote `generateThemeSummary` to fetch articles via GPT web_search → summarize → store
- [x] `create-news-podcast/page.tsx`: passes full article objects (title, source, url) to `tagThemes`
- [x] Committed: `31d6ed3`, `378bba0`, `1a6cec5`

### Auto-Generate Summary on Topic Page ✅ (uncommitted)
- [x] Topic page auto-fires `generateThemeSummary` when `latestSummary` is missing
- [x] Shows "Generating summary from latest news..." loading state
- [x] Convex reactivity updates UI when summary is stored
- [x] Source article links shown below summary as `SOURCE ↗ Source` buttons
- [x] Summary moved from hero card to standalone "Latest Developments" section
- [ ] **Needs commit**: `app/(root)/topics/[topicSlug]/page.tsx`

---

## Remaining Work

1. **Commit the topic page** — auto-generate summary + loading state
2. **Push to remote**
3. **Live demo test** — visit a seeded theme page, verify summary generates automatically
4. **Optional cleanup**: `getThemeArticles` query in `themes.ts` is unused now (articles come from `theme.summaryArticles`)
