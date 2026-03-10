# Macro Economics Tracker — Context Reference

**Last Updated: 2026-03-10 (Session 7)**

---

## Current State: ALL COMMITTED + PUSHED

Latest pushed commit: `ec0d20a` on `main`.
All Session 6 + Session 7 changes committed and pushed.

---

## Session 7 Summary

### Email-to-Self Feature (new)
- **Backend**: `convex/email.ts` — `sendPodcastEmail` action via Resend API
  - Auth-guarded, fetches podcast data, builds branded HTML email
  - HTML template: Fincast header, title, description, "Listen Now" + "Download Audio" buttons, transcript
  - No image (Convex storage URLs aren't accessible from email clients)
  - No attachment (replaced with direct audio URL link)
  - Security: URL validation, HTML escaping with quote protection, sanitized filenames
- **Frontend**: `components/PodcastDetailPlayer.tsx` — "Email" button with Mail icon, loading spinner, toast feedback
- **Dependency**: `resend` npm package
- **Env var**: `RESEND_API_KEY` set in Convex env
- **Limitation**: Resend free tier `onboarding@resend.dev` only delivers to account owner's email

### Date Format: Singapore (en-SG)
- `create-news-podcast/page.tsx` — podcast title auto-generation now uses `toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })` → "9 Mar 2026"
- `convex/chat.ts` — chatbot mention timestamps use same format
- Existing podcast titles in DB manually fixed via one-off mutation (also fixed casing: "Us-inflation" → "US Inflation")

### Hydration Fix
- `components/PodcastCard.tsx` — outer `<button>` changed to `<div role="button">` to fix nested button hydration error (star button inside card button)

### README Updated
- Renamed to "Fincast", reflects all macro tracker features, email feature added
- Old generic roadmap items removed, replaced with fintech-relevant next steps

### Database Cleanup
- Deleted all demo/seed podcasts (fake authors like "Elena Rodriguez", no audio)
- Deleted old test podcasts from earlier sessions
- Only real podcasts remain

---

## Key Architectural Decisions

### D1: Async Theme Tagging (not blocking publish)
After `createPodcast` returns, fire `tagPodcastThemes` without awaiting. Podcast appears instantly; themes populate ~10s later via Convex reactivity.

### D2: Google Trends via 3-Hour Cron (NOT real-time)
Google Trends scores fetched every 3 hours via `convex/crons.ts` → `convex/trendsCron.ts:refreshAllTrendsScores`.

### D3: Momentum-Based Scoring
Fetch 30-day window, compare recent 25% avg vs earlier 75% avg. Mapping: momentum 0.5→heatScore 0, 1.0→1.5, 1.5→3.0. Returns `null` on rate-limit → theme keeps existing score.

### D4: SVG Sparklines (no recharts dependency)
Inline SVG polyline. Lightweight, no new dependency.

### D5: Daily Sparkline Granularity (not weekly)
Changed from 8-week to 7-day daily buckets (`getDailyMentionCounts`).

### D6: Auto-Generated Theme Summaries from Web Search
`generateThemeSummary` uses GPT web_search. Auto-fired via `useEffect` on topic detail page when `latestSummary` is missing.

### D7: Article Details on Theme Mentions
`themeMentions` has `articleDetails` field. `create-news-podcast` passes full article objects when calling `tagPodcastThemes`.

### D8: Star/Favorites System
`favorites` table with compound index. Cascade delete in `deletePodcast`. Yellow not orange. Only on `/favorites` page.

### D9: Content-Relevant Cover Art
`convex/news.ts:generateImagePrompt` — GPT → DALL-E prompt focused on real-world content, NOT podcast covers.

### D10: Theme Badges Only on Detail Page
Removed from PodcastCard. Added to `podcast/[podcastId]/page.tsx` with linked ThemeBadges.

### D11: Project Renamed Castory → Fincast

### D12: Email-to-Self via Resend (Session 7)
`convex/email.ts` — Resend API. No image, no attachment — direct audio URL link instead. HTML template with Fincast branding.

### D13: Singapore Date Format (Session 7)
`en-SG` locale with `{ day: "numeric", month: "short", year: "numeric" }` → "9 Mar 2026".

---

## Key Files — Backend

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Tables: podcasts, users, macroThemes, themeMentions, favorites |
| `convex/themes.ts` | Theme queries/mutations, heat score computation |
| `convex/themeActions.ts` | tagPodcastThemes, generateThemeSummary |
| `convex/trendsCron.ts` | Momentum-based Google Trends scoring |
| `convex/crons.ts` | 3-hour interval cron |
| `convex/news.ts` | fetchNewsForTopic, generateNewsScript, generateImagePrompt |
| `convex/podcast.ts` | CRUD, getTrendingPodcasts, cascade deletes |
| `convex/favorites.ts` | toggleFavorite, isFavorited, getUserFavorites, getFavoriteCount |
| `convex/chat.ts` | Fincast AI chatbot action |
| `convex/email.ts` | sendPodcastEmail via Resend (Session 7) |
| `convex/openai.ts` | TTS + DALL-E with sentence-aware chunking |

## Key Files — Frontend

| File | Purpose |
|------|---------|
| `app/(root)/create-news-podcast/page.tsx` | 5-step wizard, AI cover art, SG date format |
| `app/(root)/podcast/[podcastId]/page.tsx` | Detail page with themes section |
| `app/(root)/favorites/page.tsx` | Favorites grid page |
| `app/(root)/topics/[topicSlug]/page.tsx` | Topic detail with auto-summary |
| `components/PodcastCard.tsx` | Card with star overlay, `div role="button"` (not `<button>`) |
| `components/PodcastDetailPlayer.tsx` | Player + favorite + email buttons |
| `components/ChatBot.tsx` | Floating AI assistant |

---

## Known Issues / Gotchas

- **Google Trends rate limiting**: 8s delays, skip on failure
- **`noise-texture` BREAKS `fixed` positioning**: Sets `position: relative`
- **`.input-class` overrides Tailwind padding**: Use inline `style={{ paddingLeft: '2.75rem' }}`
- **Sidebar SVG icons**: Must use `fill="white"` + `opacity="0.4"`
- **Resend free tier**: `onboarding@resend.dev` only delivers to account owner's email
- **Convex storage URLs in emails**: Not accessible from email clients (Gmail blocks them). Don't use podcast images in emails.
- **PodcastCard must use `<div>` not `<button>`**: Star button is nested inside. Using `<button>` causes hydration errors.

---

## Commands Reference

```bash
npm run dev
npm run build
npx convex run seedThemes:seedMacroThemes
npx convex run trendsCron:refreshAllTrendsScores
npx convex env set RESEND_API_KEY <key>
```
