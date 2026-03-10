# Fincast

## Project Description

Asset managers are drowning in fragmented market news — macroeconomic releases, central bank commentary, geopolitical developments — spread across multiple platforms. Monitoring is manual, keyword-driven, and prone to blind spots. Critical signals get lost in the noise.

**Fincast** solves this by combining an AI podcast platform with a real-time macro economics tracker. Users select a topic, and GPT-4.1-mini fetches trending articles via live web search, generates a broadcast-quality script, converts it to speech using OpenAI TTS, and publishes — all in under 60 seconds. Every podcast is auto-tagged with macro themes, building a searchable archive that serves as **institutional memory**.

The macro tracker computes **momentum-based heat scores** from Google Trends data every 3 hours, identifying which themes are heating up or cooling down before consensus forms. Topic dashboards display heat scores, 7-day sparklines, AI-generated summaries with source links, and **risk chain analysis** (e.g., "Inflation print → Fed hike → rates volatility"). Themes are tagged with regions and asset classes, connecting related developments across geographies.

A context-aware AI chatbot provides on-demand macro analysis grounded in platform data — not generic responses.

**Stack:** Next.js 16, React 19, Convex, Clerk, OpenAI (GPT-4.1-mini, TTS-1, DALL-E 3), Google Trends API

## Features

### Podcast Platform
- **AI News Podcast Creator** — 5-step guided workflow: pick a macro theme, curate trending articles (via GPT web search), generate a podcast script, convert to speech, and publish
- **Custom Podcast Creation** — Write your own script, choose an AI voice, and generate audio + thumbnail
- **Text-to-Speech** — Six OpenAI voice options (alloy, shimmer, nova, echo, fable, onyx) with automatic sentence-aware chunking for long scripts
- **AI Thumbnail Generation** — DALL-E 3 cover art from text prompts, or upload your own image
- **Persistent Audio Player** — Sticky bottom player with play/pause, skip, rewind, mute, and progress bar
- **Discover & Search** — Full-text search across podcast titles, authors, and descriptions
- **Star / Favorites** — Star podcasts from any card or detail page; dedicated `/favorites` page for quick access
- **Email to Self** — Send any podcast (cover art, transcript, and audio) directly to your email with one click
- **User Profiles** — View any creator's profile, podcast count, and total listeners
- **Draft Persistence** — News podcast drafts auto-save to localStorage and restore on revisit

### Macro Economics Tracker
- **15+ Macro Themes** — Pre-seeded themes (Fed policy, oil prices, China slowdown, AI capex, etc.) with real-time heat scoring
- **Google Trends Integration** — 3-hour cron fetches 30-day trend data and computes momentum-based heat scores
- **Heat Status Badges** — Color-coded badges (hot / warming / stable / cooling) on every podcast card
- **Topic Detail Pages** — AI-generated summaries with live source articles, risk chains, mention sparklines, and related podcasts
- **Trending Sidebar** — Top themes ranked by heat score with 7-day daily sparklines
- **Auto Theme Tagging** — GPT identifies macro themes from podcast scripts on publish; tags appear within ~15 seconds
- **Trending Feed** — Home page podcasts ranked by aggregate theme heat, not just chronology

### AI Intelligence
- **Macro Chatbot** — Floating AI assistant with database-aware context (GPT-4.1-mini, temp 0.3)
- **Auto-Summaries** — Topic pages auto-generate GPT summaries from live web search on first visit
- **Smart Defaults** — News wizard auto-fills title, description, voice prompt, and image prompt from generated script

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Backend | Convex (serverless functions, real-time database, file storage) |
| Auth | Clerk (session management, webhooks via Svix) |
| AI | OpenAI — GPT-4.1-mini (news + scripts + theme tagging + chat), TTS-1 (audio), DALL-E 3 (thumbnails) |
| Trends | Google Trends API (momentum-based scoring via 3-hour cron) |
| Styling | Tailwind CSS 4 + shadcn/ui + Radix UI + Lucide React |
| Forms | React Hook Form + Zod |

## Architecture

```
                        ┌──────────────────┐
                        │    Clerk Auth     │
                        │  (JWT + Webhooks) │
                        └────────┬─────────┘
                                 │
                   Webhook (Svix)│  JWT Token
                   user.created  │  (per request)
                   user.updated  │
                   user.deleted  │
                                 v
┌─────────────┐  Convex React  ┌──────────────────┐   External APIs
│  Next.js 16 │<=============> │     Convex       │ <===========>
│  App Router │  real-time     │   Serverless     │  OpenAI
│  + React 19 │  subscriptions │   Backend        │  (GPT / TTS / DALL-E)
│             │                │                  │
│  - Pages    │  mutations /   │  - 5 tables      │  Google Trends
│  - Audio    │  queries /     │  - HTTP Router   │  (3-hour cron)
│    Provider │  actions       │  - File Storage  │
│  - ChatBot  │                │  - Cron Jobs     │
│  - Draft    │                │  - Theme Scoring │
│    Persist. │                │  - Favorites     │
└─────────────┘                └──────────────────┘
```

### Data Model

| Table | Purpose |
|-------|---------|
| `podcasts` | Metadata, audio/image storage IDs, denormalized author data, `themeIds[]`, `trendingScore` |
| `users` | Synced from Clerk webhooks, indexed on `clerkId` |
| `macroThemes` | Theme metadata, `heatScore`, `heatStatus`, AI summary, source articles, Google Trends data |
| `themeMentions` | Join table linking podcasts → themes with sentiment, relevance, article details |
| `favorites` | User ↔ podcast star relationships with `favoritedAt` timestamp |

### Scoring Pipeline

1. **Every 3 hours** (cron): fetch 30-day Google Trends data for each theme
2. Compute **momentum** = recent 25% avg / earlier 75% avg (ratio >1 = rising)
3. Map momentum → heat status: `>1.15` hot, `1.03–1.15` warming, `0.88–1.03` stable, `<0.88` cooling
4. **On podcast publish**: GPT tags themes → `recordMention` → recompute `trendingScore`
5. **On API failure**: theme keeps existing score (skip-on-failure, no destructive fallback)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account (free tier works)
- A [Clerk](https://clerk.com) account (free tier works)
- An [OpenAI](https://platform.openai.com) API key

### Install

```bash
git clone https://github.com/kimyungju/fintech_hackathon.git
cd fintech_hackathon
npm install
```

### Configure Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_CONVEX_URL=<your convex deployment url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your clerk publishable key>
```

Set Convex server-side environment variables:

```bash
npx convex env set OPENAI_API_KEY <your openai api key>
npx convex env set CLERK_WEBHOOK_SECRET <your clerk webhook secret>
```

> **Clerk Webhook Setup:** In the Clerk dashboard, create a webhook pointing to `https://<your-deployment>.convex.cloud/clerk` and subscribe to `user.created`, `user.updated`, and `user.deleted` events.

### Seed Themes

```bash
npx convex run seedThemes:seedMacroThemes
```

This populates 15 macro-economic themes. Run the trends cron manually to populate initial heat scores:

```bash
npx convex run trendsCron:refreshAllTrendsScores
```

### Run

```bash
npm run dev
```

Starts both the Next.js dev server (port 3000) and the Convex dev server.

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (auth)/                  # Public auth pages (sign-in, sign-up)
  (root)/                  # Protected app pages
    create-podcast/        # Manual podcast creation
    create-news-podcast/   # AI news podcast wizard
    discover/              # Browse & search podcasts
    podcast/[podcastId]/   # Podcast detail + player
    profile/[profileId]/   # User profile
    topics/[topicSlug]/    # Theme detail page (summary, sparklines, related)
    favorites/             # Starred podcasts grid
  providers/               # AudioProvider, ConvexClerkProvider

components/
  ChatBot.tsx              # Floating AI macro intelligence assistant
  GeneratePodcast.tsx      # TTS audio generation
  GenerateThumbnail.tsx    # DALL-E / upload thumbnail
  TopicSelector.tsx        # Macro theme picker with search
  ArticleReview.tsx        # Article curation UI
  ScriptEditor.tsx         # Script editing + tone/duration controls
  PodcastPlayer.tsx        # Sticky audio player
  PodcastCard.tsx          # Podcast grid card with star overlay
  PodcastDetailPlayer.tsx  # Detail page player + favorite button
  TrendingTopics.tsx       # Sidebar trending themes with sparklines
  MentionSparkline.tsx     # SVG polyline sparkline
  LeftSidebar.tsx          # Navigation sidebar
  RightSidebar.tsx         # Right sidebar (trending themes)

convex/
  schema.ts                # 5 tables: podcasts, users, macroThemes, themeMentions, favorites
  podcast.ts               # CRUD, search, trending sort, cascade delete
  news.ts                  # GPT news fetch (web_search) + script generation
  openai.ts                # TTS + DALL-E with sentence-aware chunking
  themes.ts                # Theme queries/mutations, heat score computation
  themeActions.ts          # GPT theme tagging + auto-summary generation
  trendsCron.ts            # Google Trends momentum scoring
  crons.ts                 # 3-hour interval cron schedule
  favorites.ts             # Toggle, query, count favorites
  chat.ts                  # AI chatbot with database context
  seedThemes.ts            # 15 macro theme seed data
  user.ts                  # User CRUD (webhook-driven)
  http.ts                  # HTTP router (Clerk webhooks via Svix)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js + Convex dev servers |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npx convex deploy` | Deploy Convex functions to production |
| `npx convex run seedThemes:seedMacroThemes` | Seed macro-economic themes |
| `npx convex run trendsCron:refreshAllTrendsScores` | Manually refresh trend scores |

## Deployment

### Vercel

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Set environment variables in Vercel project settings:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
4. Deploy. Vercel auto-detects Next.js.

### Convex

```bash
npx convex deploy
```

Set production environment variables:

```bash
npx convex env set OPENAI_API_KEY <key> --prod
npx convex env set CLERK_WEBHOOK_SECRET <secret> --prod
```

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` / Vercel | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `.env.local` / Vercel | Clerk publishable key |
| `OPENAI_API_KEY` | Convex env | OpenAI API key (GPT, TTS, DALL-E) |
| `CLERK_WEBHOOK_SECRET` | Convex env | Clerk webhook signing secret |

## Troubleshooting

- **"OPENAI_API_KEY is not set"** — Set it via `npx convex env set OPENAI_API_KEY <key>`, not in `.env.local`. Convex actions read from the Convex environment.
- **Images not loading** — Add the image hostname to `remotePatterns` in `next.config.ts`.
- **Clerk webhook 400/500** — Verify `CLERK_WEBHOOK_SECRET` matches the Clerk dashboard. Check that your webhook URL ends with `/clerk`.
- **Styles broken** — Delete `.next/` and restart the dev server.
- **TTS fails on long scripts** — Audio generation auto-chunks at 4096 characters. If issues persist, try a shorter script.
- **Google Trends rate-limited** — The cron uses 8s delays between requests. If themes show stale scores, run `npx convex run trendsCron:refreshAllTrendsScores` manually.
- **Theme badges not appearing** — Theme tagging is async (~10-15s after publish). Refresh the page if badges don't appear.

## Roadmap

- [ ] Multi-voice episodes (host-and-guest format with speaker labels)
- [ ] Scheduled daily/weekly news podcast generation via Convex cron
- [ ] Embed-based podcast recommendations (semantic similarity)
- [ ] Portfolio analytics dashboard for asset managers
