# Fincast 5-Minute Demo Video Script

**Goal:** A compelling 5-minute demo video showcasing Fincast to hackathon judges — problem, solution, live walkthrough, technical depth.

**Companion documents:**
- `2026-03-10-demo-choreography.md` — Click-by-click walkthrough (38 steps, exact UI elements)
- `2026-03-10-pre-recording-guide.md` — Data staging, API checks, risk mitigation, 32-item rehearsal checklist

---

## Script Structure

| Section | Time | Duration | Purpose |
|---------|------|----------|---------|
| 1. Hook & Problem | 0:00–0:40 | 40s | Why this matters |
| 2. Solution Overview | 0:40–1:20 | 40s | What Fincast is |
| 3. Home & Discovery | 1:20–2:00 | 40s | Browse, play, star, search |
| 4. AI News Podcast Creation | 2:00–3:20 | 80s | The "wow" feature (live) |
| 5. Macro Tracker & AI Chat | 3:20–4:10 | 50s | Intelligence layer |
| 6. Technical Architecture | 4:10–4:40 | 30s | How it works |
| 7. Closing | 4:40–5:00 | 20s | Impact & future |

**Total narration:** ~893 words at conversational pace

---

## Section 1: Hook & Problem (0:00–0:40)

**Screen:** Dark screen → Fincast logo fade-in → optional news montage

**Narration:**

> "Five hundred hours a year. That's how long the average fund manager spends just reading the news. Not analyzing. Not trading. Reading.
>
> Hundreds of articles, reports, data points — every single morning. And most of it? Noise.
>
> What if you could skip the noise and get the signal — as a podcast you listen to on your commute? That's Fincast."

**Choreography:** No app interaction. Voiceover with dark screen → logo → optional stock footage montage. Cut to app at 0:35.

---

## Section 2: Solution Overview (0:40–1:20)

**Screen:** Fincast home page (logged in, podcast grid visible, three-column layout)

**Narration:**

> "Fincast is an AI-powered podcast platform built for finance professionals. Three capabilities:
>
> First — it takes breaking financial news and turns it into broadcast-quality audio briefings. Sixty seconds, start to finish. AI does the research, writes the script, generates the voice.
>
> Second — it tracks macro-economic themes using Google Trends momentum data. You see what's heating up before the market catches on.
>
> Third — an AI assistant that understands macro context and gives you actionable answers, not summaries.
>
> Let me show you."

**Choreography:** Hover-only, no clicks. Slowly move cursor across podcast grid cards (show brutalist hover effects — orange border, image zoom, headphones overlay). Point to right sidebar "Trending Topics" list.

---

## Section 3: Live Demo — Home & Discovery (1:20–2:00)

**Screen:** Navigate through Home → Podcast Detail → Favorites → Discover

**Narration:**

> "Home page. Podcasts ranked by our heat scoring algorithm — I'll break that down shortly.
>
> Each podcast has a full detail page: transcript, AI-generated cover art, linked macro themes. Hit play — the sticky player follows you everywhere in the app.
>
> Star your favorites. They're saved here for quick access.
>
> And discover — full-text search across every title, description, and transcript on the platform. Find anything instantly."

**Choreography (see choreography doc steps 3.1–3.16):**
1. Click first podcast card → detail page loads
2. Scroll to show themes, scroll back up
3. Click "Play Podcast" → sticky player appears at bottom, audio plays
4. Let audio play 3-4 seconds, point to player controls
5. Click Star → yellow fill animation
6. Click "Favorites" in sidebar → show starred podcasts (player persists)
7. Click "Discover" in sidebar → type "inflation" → results filter live (500ms debounce)
8. Pause player before Section 4

---

## Section 4: Live Demo — AI News Podcast Creation (2:00–3:20)

**Screen:** 5-step news podcast wizard. This is the showstopper — pace it like a live magic trick.

**Narration:**

> "Alright. This is the core of Fincast. I'm going to create a professional news podcast from scratch — live, right now.
>
> Step one: pick a topic. I'll go with US Inflation — notice it's flagged 'Hot,' heat score 2.1. The moment I select it, GPT-4.1-mini fires a live web search and pulls the top trending articles. These aren't cached. These are real articles, fetched seconds ago.
>
> Step two: I pick the stories I want covered. Three articles selected. Next.
>
> Step three: generate the script. Professional tone, medium length. Watch this.
>
> A complete podcast script — sourced, structured, ready to record. I can edit anything. Notice the live word count and estimated duration.
>
> Step four: this is where it gets interesting. I pick a voice — Nova — and hit generate. OpenAI's TTS engine converts the entire script to speech. Our backend splits at sentence boundaries to handle any script length, then stitches the audio seamlessly.
>
> While that renders, I'll generate the cover art. GPT reads the script, writes a DALL-E 3 prompt based on the actual story — not generic podcast art.
>
> Audio ready. Art ready.
>
> Step five: publish.
>
> Done. Topic to published podcast. The user touched five buttons."

**Choreography (see choreography doc steps 4.1–4.38):**
1. Click "News Podcast" in sidebar → wizard loads at Step 1
2. Point to 5-step progress bar
3. Hover over topic grid, click "US Inflation" (Hot badge visible)
4. Wait 5-10s for articles (spinner: "Searching for trending news...")
5. Auto-advance to Step 2 — scroll through articles, toggle one off/on
6. Click "Generate Script" → wait 3-8s
7. Auto-advance to Step 3 — change tone to "Professional", scroll through script, point to stats bar
8. Click "Continue to Audio" → Step 4 with 4 sub-cards
9. Select voice "Nova" → voice sample auto-plays
10. Click "Generate Audio" → wait 10-30s (narrate during wait)
11. Scroll to cover art, click "Generate Thumbnail" → wait 10-20s (narrate during wait)
12. Both ready → click "Review & Publish"
13. Step 5 review screen → click "Publish News Podcast"
14. Redirect to home page with new podcast in grid

**Fallbacks:**
- Article fetch >10s: "The system is querying live news sources in real-time — no cached data."
- Audio >45s: "For longer scripts, this can take up to a minute. I prepared a backup."
- DALL-E fails: Click "Upload custom image" tab as alternative
- Critical backup: Pre-create one podcast with the same topic before recording

---

## Section 5: Live Demo — Macro Tracker & AI Chat (3:20–4:10)

**Screen:** Podcast detail → Theme page → Chatbot

**Narration:**

> "Every published podcast gets auto-tagged with macro-economic themes by GPT. These badges link to our Macro Economics Tracker.
>
> This is where Fincast becomes an intelligence tool. Each theme has a heat score computed from Google Trends — but not raw search volume. We measure momentum: the rate of change. Above 1.15 means it's accelerating. Below 0.88, it's cooling. This tells you what's moving before consensus forms.
>
> You see the score, mention count, daily change, and a 7-day sparkline. Below that, auto-generated summaries of latest developments with source links — GPT with live web search.
>
> Now the AI assistant. It's context-aware — it already knows I'm looking at US Inflation.
>
> I'll ask: 'What are the risk implications for bond portfolios?'
>
> Watch the response. It draws from theme data, recent developments, and financial domain knowledge. This isn't a generic chatbot. It gives you actionable analysis."

**Choreography (see choreography doc steps 5.1–5.21):**
1. Click podcast with theme tags → detail page
2. Scroll to Themes section, point to ThemeBadge pills
3. Click a theme badge (e.g., "US Inflation") → topic detail page
4. Point to header (large label, Hot badge, category, regions, asset classes)
5. Scroll to metrics grid — hover across Heat Score, Mentions, Day/Day %, Sparkline
6. Scroll to "Latest Developments" — pause 3-4s on AI summary + source links
7. Click orange chatbot button (bottom-right, MessageSquare icon)
8. Panel opens — point to context-aware quick action chips
9. Type: "What are the risk implications for bond portfolios?"
10. Click Send → wait 3-8s → response appears with bold terms and arrow chains
11. Pause 5-6s on response for readability

---

## Section 6: Technical Architecture (4:10–4:40)

**Screen:** Architecture diagram slide OR narrate over the app

**Narration:**

> "Under the hood: Next.js 16 with React 19 on the frontend. Convex as the serverless backend — real-time subscriptions out of the box. Data changes, UI updates instantly. No polling.
>
> OpenAI powers four AI pipelines: GPT-4.1-mini for news fetching, script generation, theme analysis, and the chatbot. TTS-1 for voice synthesis with sentence-aware chunking. DALL-E 3 for cover art.
>
> Google Trends feeds a cron job every three hours, computing momentum-based heat scores across all tracked themes. Clerk handles auth. Resend handles email.
>
> Everything you saw is real data, real APIs, real-time. Zero mocks."

**Architecture Diagram Spec (if creating a slide):**

```
6-Layer Architecture:

┌─────────────────────────────────────────────────────┐
│  FRONTEND — Next.js 16 + React 19 + Tailwind/shadcn │
│  Pages: Home, Discover, Create, Detail, Topics,     │
│  Favorites, Profile  │  Sticky Player  │  Chatbot   │
├─────────────────────────────────────────────────────┤
│  AUTH — Clerk (OAuth/email) → Svix webhooks          │
├─────────────────────────────────────────────────────┤
│  BACKEND — Convex (real-time serverless)             │
│  Queries (cached, auto-subscribe)                    │
│  Mutations (auth-gated writes)                       │
│  Actions (external API calls)                        │
├─────────────────────────────────────────────────────┤
│  AI LAYER — OpenAI                                   │
│  GPT-4.1-mini: news fetch, script gen, theme tag,    │
│    chatbot, image prompt, theme summary (6 pipelines)│
│  TTS-1: voice synthesis (sentence-aware chunking)    │
│  DALL-E 3: cover art generation                      │
├─────────────────────────────────────────────────────┤
│  DATA — Convex DB                                    │
│  5 tables: podcasts, users, macroThemes,             │
│  themeMentions, favorites  │  File storage (MP3/PNG) │
├─────────────────────────────────────────────────────┤
│  EXTERNAL — Google Trends (3hr cron) │ Resend (email)│
└─────────────────────────────────────────────────────┘
```

**Key data flows to highlight:**
1. **Podcast creation:** User → topic → GPT web search → articles → GPT script → TTS audio → DALL-E art → publish → async GPT theme tagging
2. **Heat scoring:** Cron (3hr) → Google Trends 30-day data → momentum (recent 25% / earlier 75%) → heatScore 0-3.0 → cascade to podcast trendingScores

**Stats for judges:**
- 6 GPT pipelines + 2 media generation pipelines = **8 AI calls** per podcast
- 5 database tables, 13 indexes, 3 full-text search indexes
- Real-time UI via Convex subscriptions (no polling)
- Zero backend infrastructure to manage

**If running long (>4:30):** Cut to 15 seconds: "Next.js 16, Convex for real-time serverless, OpenAI for all AI pipelines, Google Trends for momentum scoring. Everything is real data, real APIs, real-time."

---

## Section 7: Closing (4:40–5:00)

**Screen:** Return to home page, full three-column layout visible

**Narration:**

> "Fund managers spend five hundred hours a year reading news. Fincast gives them that time back — with AI audio briefings, real-time trend intelligence, and a financial AI assistant, all in one platform.
>
> We built this in seven sessions. The codebase is open source.
>
> This is the future of market intelligence. Thank you."

**Choreography:** Navigate to home (if not already there). Hold on full app layout. Fade to closing slide with Fincast logo + team info.

---

## Word Counts

| Section | Words | Duration |
|---------|-------|----------|
| 1. Hook & Problem | ~82 | 40s |
| 2. Solution Overview | ~100 | 40s |
| 3. Home & Discovery | ~88 | 40s |
| 4. News Podcast Creation | ~248 | 80s |
| 5. Macro Tracker & Chat | ~195 | 50s |
| 6. Architecture | ~118 | 30s |
| 7. Closing | ~62 | 20s |
| **Total** | **~893** | **~5:00** |

---

## Key Narrative Techniques

- **Bookend structure:** Opens and closes with "500 hours" — the number sticks
- **Live magic trick:** Section 4 builds suspense with "Watch this" and "This is where it gets interesting"
- **Concrete closer:** "The user touched five buttons" — memorable, specific
- **Zero mocks:** Two-word closer for architecture section — lands harder than a full sentence
- **Momentum > volume:** Explaining *why* momentum matters ("before consensus forms") not just how
- **Confident claim:** "This is the future of market intelligence" — not hedged, not apologetic
