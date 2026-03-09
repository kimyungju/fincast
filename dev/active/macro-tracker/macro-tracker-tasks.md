# Macro Economics Tracker — Task Checklist

**Last Updated: 2026-03-09**
**Implementation Plan**: `docs/plans/2026-03-09-macro-tracker-impl.md`

---

## Phase 1: Data Foundation — COMPLETE

### Task 1: Schema Changes ✅
### Task 2: Theme Queries & Mutations ✅
### Task 3: OpenAI Theme Tagging Actions ✅

## Phase 2: Seed Data — COMPLETE

### Task 4: Seed Script ✅

## Phase 3: UI Components — COMPLETE

### Task 5: Reusable UI Atoms ✅
### Task 6: Trending Topics Sidebar ✅

## Phase 4: Core Pages — COMPLETE

### Task 7: Home Page + PodcastCard Badges ✅
### Task 8: Topic Detail Page ✅

## Phase 5: Pipeline Wiring — COMPLETE

### Task 9: Create Flow + Async Tagging ✅
### Task 10: Cleanup ✅

## Phase 6: Verification — COMPLETE (except live demo)

### Task 11: End-to-End Demo Flow
- [x] Seed data exists
- [x] Build passes
- [x] Convex typecheck passes
- [x] Code review passed
- [ ] **Live demo test** (requires `npm run dev` with browser)

---

## Post-Implementation Changes

### Google Trends → 3-Hour Cron ✅
- [x] Created `convex/trendsCron.ts` — refreshAllTrendsScores action
- [x] Created `convex/crons.ts` — 3-hour interval
- [x] Removed Google Trends from `themeActions.ts` (relevanceScore fixed at 1.0)
- [x] Simplified `seedThemes.ts` — pure mutation, heatScore 0
- [x] `recordMention` no longer recomputes heatScore (cron handles it)
- [x] Added `recomputeAllTrendingScores` mutation
- [x] Schema: added `trendsScore` + `trendsUpdatedAt` to macroThemes
- [x] Commit: `deb1bab`

### UI Bug Fixes ✅
- [x] Scrollable sidebar — `flex-1 overflow-y-auto scrollbar-hide` wrapper around TrendingTopics
- [x] Hidden scrollbar CSS utility in `globals.css`
- [x] Hero heading — `text-3xl md:text-4xl` (fixed, not clamp)
- [x] Commit: `1b0264b`, `5997193`, `25d924b`

### Query Rename ✅
- [x] `getWeeklyMentionCounts` → `getDailyMentionCounts` (daily granularity, 7 days)
- [x] Updated TrendingTopics.tsx + topic detail page
- [x] Commit: `40897b8`

---

## Progress Summary

| Phase | Status |
|-------|--------|
| Phase 1: Data Foundation | ✅ Complete |
| Phase 2: Seed Data | ✅ Complete |
| Phase 3: UI Components | ✅ Complete |
| Phase 4: Core Pages | ✅ Complete |
| Phase 5: Pipeline Wiring | ✅ Complete |
| Phase 6: Verification | ⏳ Live demo pending |
| Google Trends Cron | ✅ Complete |
| UI Bug Fixes | ✅ Complete |
| AI Chatbot | ✅ Complete (layout fix needs commit) |

## AI Chatbot Feature ✅

### Backend ✅
- [x] `convex/chat.ts` — `sendMessage` action with DB context gathering + GPT-4.1-mini
- [x] Auth guard (`ctx.auth.getUserIdentity()`) to prevent unauthenticated API abuse
- [x] System prompt rebuilt every message (context changes with navigation)
- [x] Conversation trimmed to 20 messages max
- [x] Commits: `40e6c09`, `d721656`

### Frontend ✅
- [x] `components/ChatBot.tsx` — floating panel (closed/open/minimized)
- [x] Context-aware quick-action chips (different per route)
- [x] Markdown-lite renderer (bold + arrow chains)
- [x] Typing indicator (3 bouncing orange dots)
- [x] Mounted in `app/(root)/layout.tsx` after `<PodcastPlayer />`
- [x] Commits: `d9f8218`, `a787892`, `4973423`

### Brutalist Redesign ✅
- [x] Replaced all ad-hoc styles with design system patterns
- [x] Square FAB (removed `rounded-full`), proper `btn-brutal` shadows
- [x] 4px borders, `--shadow-brutal`, orange accent strips
- [x] User bubbles: mini card-brutal with shadow
- [x] Agent messages: orange left accent stripe
- [x] Input uses `.input-class` with `.chatbot-input` compact padding
- [x] Commit: `9ca8e4d`

### Layout Bug Fix ⏳
- [x] Root cause: `.noise-texture` sets `position: relative`, overrides Tailwind `fixed`
- [x] Fix: removed `noise-texture` from ChatBot panel className
- [ ] **Needs commit + push**

---

## Remaining Work
1. **Commit layout bug fix** + push all chatbot work to remote
2. **Live demo test** — `npm run dev`, create a podcast, verify full pipeline
3. After seeding, run `npx convex run trendsCron:refreshAllTrendsScores` to get real heat scores
