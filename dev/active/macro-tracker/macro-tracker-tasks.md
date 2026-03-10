# Macro Economics Tracker — Task Checklist

**Last Updated: 2026-03-10 (Session 6)**

---

## All Phases Complete (Sessions 1-3)

Phases 1-6 (Data Foundation, Seed Data, UI Components, Core Pages, Pipeline Wiring, Verification) all complete.

---

## Session 3 Changes

- [x] Sidebar trending topics redesign (compact, no sparkline)
- [x] Momentum-based Google Trends scoring
- [x] Heat score DB data manually set for varied distribution

## Session 4 Changes

- [x] Changed sparkline from 8-week to 7-day daily buckets
- [x] Removed sentiment section from topic detail page
- [x] Schema: added `summaryArticles` to macroThemes, `articleDetails` to themeMentions
- [x] Auto-generate theme summaries from GPT web_search on topic page visit
- [x] Source article links shown below summary
- [x] TopicSelector custom topic button fix
- [x] All committed

## Session 5 Changes (committed at start of Session 6)

- [x] Star/Favorites feature — full backend + frontend + dedicated page
- [x] TopicSelector search padding fix + selected text color fix
- [x] Sidebar star icon SVG fix
- [x] All committed + pushed (`a77000d`)

## Session 6 Changes (UNCOMMITTED)

### Rename: Castory → Fincast
- [x] `package.json`, `package-lock.json` — name field
- [x] `app/layout.tsx` — metadata title
- [x] `components/LeftSidebar.tsx`, `components/MobileNav.tsx` — logo text
- [x] `app/(auth)/sign-in/page.tsx` — brand name + alt text
- [x] `app/(root)/layout.tsx` — logo alt text
- [x] `app/(root)/profile/[profileId]/page.tsx` — page heading
- [x] `convex/chat.ts` — system prompt ("Fincast AI")
- [x] `public/icons/auth-logo.svg` — SVG text element
- [x] Draft persistence keys: `castory:*` → `fincast:*` (create-podcast, create-news-podcast)
- [x] CLAUDE.md, PORTFOLIO.md, README.md, all planning docs

### AI-Generated Cover Art for News Podcasts
- [x] `convex/news.ts` — New `generateImagePrompt` action (GPT → DALL-E prompt from script content)
- [x] `app/(root)/create-news-podcast/page.tsx` — Replaced hardcoded template with AI action call + error fallback

### Theme Badges: Card → Detail Page
- [x] `components/PodcastCard.tsx` — Removed `themes` prop, `ThemeBadge` import, conditional rendering. Always shows "Episode" bar.
- [x] `app/(root)/page.tsx` — Removed `allThemes` query, `themeMap`, `Id` import. No longer passes themes to PodcastCard.
- [x] `app/(root)/topics/[topicSlug]/page.tsx` — Removed `allThemes` query, `themeMap`. No longer passes themes to PodcastCard.
- [x] `app/(root)/podcast/[podcastId]/page.tsx` — Added themes section: loads `allThemes`, maps `themeIds`, renders linked ThemeBadges.

### Topic Detail: Always-Visible "Create Podcast" Button
- [x] `app/(root)/topics/[topicSlug]/page.tsx` — Two styles:
  - No podcasts: Original card with italic text + `btn-brutal` button
  - Has podcasts: Grid card item (dashed border, Mic2 icon, theme label) alongside podcast cards

### Auth Logo Readability
- [x] `public/icons/auth-logo.svg` — Syne 800 uppercase, `x=50` (more gap from icon), `letter-spacing=2`, viewBox widened to 210

### PORTFOLIO.md Update
- [x] Reframed as podcast platform → macro intelligence layer
- [x] Expanded architecture (5 tables, cron, chatbot)
- [x] 4 challenges (TTS chunking, Google Trends momentum, async theme tagging, context-aware chatbot)
- [x] Expanded roadmap (alerts, portfolio correlation, multi-source sentiment)

---

## Remaining Work

1. **Commit all Session 6 changes** — 23 files, rename + cover art + themes + logo
2. **Push to remote**
3. **Live demo test** — verify cover art generation, theme badges on detail page, create-podcast button on topic pages
4. **Optional cleanup**: `getThemeArticles` query in `themes.ts` unused
