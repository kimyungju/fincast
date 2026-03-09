# Macro Economics Tracker — Strategic Plan

**Last Updated: 2026-03-09**
**Status: Ready for Implementation**
**Priority: P0 — Hackathon Deliverable**

---

## Executive Summary

Extend Castory from a generic AI podcast platform into a **Macro Economics Tracker** for asset managers. The extension adds theme tracking, heat score trending, topic detail pages, and AI-powered theme tagging — creating a real-time feedback loop where podcast content drives a macro intelligence dashboard. The entire system must work end-to-end for a live on-stage hackathon demo.

---

## Current State Analysis

### What Exists
- **Podcast Platform**: Manual + AI news podcast creation (5-step wizard)
- **Database**: 2 Convex tables (`podcasts`, `users`)
- **Home Feed**: Shows all podcasts with no ranking (`getTrendingPodcasts` = `collect()`)
- **Right Sidebar**: Top podcasters + carousel (vanity content, no analytical value)
- **Topic Selection**: 8 hardcoded generic categories (Technology, Sports, Business, etc.)
- **Design System**: Fully brutalist (card-brutal, btn-brutal, orange accent, Syne/Crimson Pro)
- **AI Pipeline**: GPT-4.1-mini (web search + script gen), TTS-1, DALL-E 3

### What's Missing
- No concept of "macro themes" or topics as first-class entities
- No way to track or rank topics by trendingness
- No connection between podcast content and macro themes
- No topic detail pages
- Home feed has no intelligent ordering
- Sidebar provides no analytical value for asset managers

---

## Proposed Future State

### Data Architecture
```
                    macroThemes
                   ┌─────────────┐
                   │ slug, label  │
                   │ heatScore    │◄──── recomputed on each mention
                   │ heatStatus   │
                   │ latestSummary│◄──── GPT-generated
                   │ riskChain    │◄──── GPT-generated
                   └──────┬──────┘
                          │ 1:N
                   ┌──────┴──────┐
                   │themeMentions │
                   │ sentiment    │
                   │ relevance    │◄──── created by tagPodcastThemes action
                   │ summary      │
                   └──────┬──────┘
                          │ N:1
                   ┌──────┴──────┐
                   │  podcasts    │
                   │ themeIds[]   │◄──── linked after tagging
                   │ trendingScore│◄──── sum of linked theme heatScores
                   └─────────────┘
```

### Real-Time Pipeline
1. User publishes podcast → returns immediately
2. Async: `tagPodcastThemes` sends script to GPT → identifies themes
3. For each theme: `recordMention` → recomputes heatScore
4. `linkThemesToPodcast` → sets themeIds + trendingScore
5. `generateThemeSummary` → updates AI summary + risk chain
6. Convex reactivity pushes all changes to all connected clients

---

## Implementation Phases

### Phase 1: Data Foundation (Tasks 1-3)
**Goal**: Schema + all backend logic working
**Effort**: L
**Risk**: Low — pure backend, no UI breakage

| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 1 | Schema changes (macroThemes, themeMentions, podcasts extension) | S | None |
| 2 | Theme queries & mutations (convex/themes.ts) | M | Task 1 |
| 3 | OpenAI theme tagging actions (convex/themeActions.ts) | M | Task 2 |

### Phase 2: Seed Data (Task 4)
**Goal**: Demo starts with populated dashboard
**Effort**: S
**Risk**: Low

| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 4 | Seed 15 macro themes with realistic heat scores | S | Task 1 |

### Phase 3: UI Components (Tasks 5-6)
**Goal**: Reusable UI atoms + sidebar transformation
**Effort**: M
**Risk**: Medium — sidebar is globally visible, must not break layout

| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 5 | ThemeBadge + MentionSparkline components | S | None |
| 6 | TrendingTopics component + RightSidebar replacement | M | Tasks 2, 4, 5 |

### Phase 4: Core Pages (Tasks 7-8)
**Goal**: Home feed ranking + topic detail page
**Effort**: L
**Risk**: Medium — home page is the main entry point

| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 7 | Home page trending sort + PodcastCard badges | M | Tasks 2, 5 |
| 8 | Topic detail page (/topics/[topicSlug]) | L | Tasks 2, 5 |

### Phase 5: Pipeline Wiring (Tasks 9-10)
**Goal**: Create flow triggers theme tagging, cleanup
**Effort**: M
**Risk**: High — modifies the publish flow, must not break podcast creation

| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 9 | TopicSelector macro themes + async tagging on publish | M | Tasks 2, 3 |
| 10 | Clean up constants (remove unused newsTopics) | S | Task 9 |

### Phase 6: Verification (Task 11)
**Goal**: Full end-to-end demo flow works
**Effort**: S
**Risk**: This IS the risk mitigation

| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 11 | End-to-end verification of live demo flow | S | All |

---

## Risk Assessment and Mitigation

### R1: GPT Theme Tagging Returns Bad JSON
**Likelihood**: Medium
**Impact**: Themes don't populate, demo looks empty
**Mitigation**: JSON parsing with fallback — log errors but never crash. Seed data provides baseline content regardless.

### R2: Heat Score Recomputation Slow in Mutation
**Likelihood**: Low
**Impact**: Convex mutation timeout
**Mitigation**: `recordMention` only queries mentions for 28 days of one theme — bounded dataset. If issues arise, drop to daily batch recomputation.

### R3: Sidebar Breaks on Missing Data
**Likelihood**: Low
**Impact**: Layout broken globally
**Mitigation**: TrendingTopics returns `null` if no data, sidebar gracefully shows nothing. Seed data ensures themes always exist.

### R4: Async Tagging Never Completes
**Likelihood**: Low
**Impact**: Podcasts have no theme badges
**Mitigation**: Fire-and-forget with `.catch()` logging. Podcast still appears on home. Can manually trigger tagging via Convex dashboard.

### R5: Schema Push Breaks Existing Data
**Likelihood**: Very Low
**Impact**: All existing podcasts lost
**Mitigation**: New fields are `v.optional()` — backwards compatible. Existing data untouched.

---

## Success Metrics

### Demo Day Checklist
- [ ] Sidebar shows 10+ trending macro themes with heat badges
- [ ] Clicking a topic opens detail page with metrics
- [ ] Creating a news podcast uses macro theme picker (not generic categories)
- [ ] After publishing, theme badges appear on podcast card within 15 seconds
- [ ] Topic detail page shows the new podcast under "Related Podcasts"
- [ ] Heat scores visually shift after multiple podcast creations

### Technical Metrics
- Podcast publish → theme tags visible: < 15 seconds
- Topic detail page load: < 2 seconds
- Sidebar trending list load: < 1 second
- No Convex mutation timeouts during demo

---

## Required Resources and Dependencies

### External Services
- **OpenAI API**: GPT-4.1-mini for theme tagging + summary generation (existing key, already set in Convex env)
- **Convex**: Backend (existing deployment: `dev:original-antelope-770`)
- **Clerk**: Auth (existing, unchanged)

### NPM Dependencies
- No new dependencies needed (SVG sparklines, no recharts)

### Files Modified/Created
| Action | File | Phase |
|--------|------|-------|
| Modify | `convex/schema.ts` | 1 |
| Create | `convex/themes.ts` | 1 |
| Create | `convex/themeActions.ts` | 1 |
| Modify | `convex/podcast.ts` | 4 |
| Create | `convex/seedThemes.ts` | 2 |
| Create | `components/ThemeBadge.tsx` | 3 |
| Create | `components/MentionSparkline.tsx` | 3 |
| Create | `components/TrendingTopics.tsx` | 3 |
| Create | `components/SentimentBreakdown.tsx` | 4 |
| Create | `components/RiskChainDisplay.tsx` | 4 |
| Modify | `components/RightSidebar.tsx` | 3 |
| Modify | `components/PodcastCard.tsx` | 4 |
| Modify | `components/TopicSelector.tsx` | 5 |
| Modify | `app/(root)/page.tsx` | 4 |
| Create | `app/(root)/topics/[topicSlug]/page.tsx` | 4 |
| Modify | `app/(root)/create-news-podcast/page.tsx` | 5 |
| Modify | `constants/index.ts` | 5 |

---

## Timeline Estimate

This is a hackathon — all phases execute sequentially in a single session.

| Phase | Tasks | Estimated Duration |
|-------|-------|--------------------|
| Phase 1: Data Foundation | 1-3 | Backend schema + functions |
| Phase 2: Seed Data | 4 | Quick seed script |
| Phase 3: UI Components | 5-6 | Reusable components + sidebar |
| Phase 4: Core Pages | 7-8 | Home feed + topic detail |
| Phase 5: Pipeline Wiring | 9-10 | Create flow + cleanup |
| Phase 6: Verification | 11 | End-to-end demo test |

**Critical Path**: Task 1 → 2 → 3 → 9 (schema → queries → actions → wiring)
Everything else can parallelize around this spine.
