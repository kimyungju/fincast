# Macro Economics Tracker — Task Checklist

**Last Updated: 2026-03-10 (Session 7)**

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

## Session 5 Changes

- [x] Star/Favorites feature — full backend + frontend + dedicated page
- [x] TopicSelector search padding fix + selected text color fix
- [x] Sidebar star icon SVG fix

## Session 6 Changes

- [x] Rename Castory → Fincast (23 files)
- [x] AI-generated content-relevant cover art for news podcasts
- [x] Theme badges moved from PodcastCard → podcast detail page
- [x] "Create Podcast" button on topic detail page (2 styles)
- [x] Auth-logo SVG readability improvements
- [x] PORTFOLIO.md expanded with macro tracker content
- [x] All committed + pushed (`e562921`)

## Session 7 Changes

- [x] Cleaned up database — deleted all demo/seed podcasts (no audio)
- [x] Email-to-Self feature via Resend API (`convex/email.ts`)
  - [x] Backend: sendPodcastEmail action (auth, HTML template, audio link)
  - [x] Frontend: Email button on PodcastDetailPlayer (Mail icon, loading, toast)
  - [x] Code review fixes: URL validation, quote escaping, filename sanitization, content_type
  - [x] Removed cover image from email (broken in email clients)
  - [x] Replaced MP3 attachment with "Download Audio" link button
- [x] Singapore date format (`en-SG`) for podcast titles + chatbot timestamps
- [x] Fixed existing podcast titles in DB (date format + casing)
- [x] Fixed nested button hydration error in PodcastCard (`<button>` → `<div role="button">`)
- [x] Fixed nullable podcast in favorites page (TS build error)
- [x] Updated README — full rewrite for Fincast + macro tracker + email feature
- [x] All committed + pushed (`ec0d20a`)

---

## Remaining Work

1. **Optional cleanup**: `getThemeArticles` query in `themes.ts` unused
2. **Resend custom domain**: Currently using `onboarding@resend.dev` (only delivers to account owner)
3. **Live demo test**: Verify email feature end-to-end with real podcast
