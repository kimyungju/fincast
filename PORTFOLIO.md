# Fincast: AI Podcast Platform with Macro-Economic Intelligence

## 1. Overview & Motivation

Asset managers and financial professionals process dozens of macro-economic signals daily — Fed statements, trade policy shifts, commodity moves, geopolitical developments. Most don't have time to synthesize 15 articles into an actionable view. They do, however, have five minutes during a commute to listen to a podcast.

Fincast started as a full-stack AI podcast platform and evolved into a macro-economic intelligence layer for finance professionals. It provides two creation workflows:

- **Manual podcast creation** — content creators write scripts, select an AI voice, and generate studio-quality audio with AI-generated cover art.

- **Automated news podcast wizard** — a five-step guided flow that fetches trending articles via real-time web search, curates stories, generates a podcast script, produces audio narration, and publishes end to end.

On top of the podcast engine sits the **Macro Economics Tracker**: a pipeline that identifies macro-economic themes from every published podcast, scores them against Google Trends momentum, tracks sentiment (hawkish/dovish/neutral), generates AI summaries with risk chain analysis, and surfaces trending themes with real-time heat scores. A floating AI chatbot grounded in platform data provides on-demand macro analysis.

The platform targets asset managers, macro strategists, and financial professionals who want signal from noise — curated, narrated macro intelligence without the overhead of manual research.

---

## 2. Technical Architecture & Workflow

### System Overview

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
┌─────────────┐  Convex React  ┌──────────────────┐   OpenAI APIs
│  Next.js 16 │<=============> │     Convex       │ <===========>
│  App Router │  real-time     │   Serverless     │  GPT-4.1-mini
│  + React 19 │  subscriptions │   Backend        │  + web search
│             │                │                  │  DALL-E 3
│  - Pages    │  mutations /   │  - HTTP Router   │  TTS-1
│  - Audio    │  queries /     │  - Mutations     │
│    Provider │  actions       │  - Queries       │
│  - ChatBot  │                │  - Cron Jobs     │
│  - Draft    │                │  - File Storage  │
│    Persist. │                └────────┬─────────┘
└─────────────┘                        │
                                       │  Every 3 hours
                               ┌───────▼──────────┐
                               │  Google Trends    │
                               │  Momentum Cron    │
                               │  (30-day window)  │
                               └──────────────────┘
```

### Authentication & Webhook Sync

Clerk handles user sessions and provides JWTs that Convex validates on every query and mutation. User data is synchronized to the Convex `users` table via signed webhooks verified with Svix. The webhook handler chains safe fallbacks for nullable Clerk fields:

```typescript
// convex/http.ts — safe fallback chain for webhook data
case "user.created": {
  const primaryEmail = event.data.email_addresses?.[0]?.email_address;
  const email = primaryEmail ?? `${event.data.id}@clerk.user`;
  const name =
    event.data.first_name ??
    primaryEmail?.split("@")[0] ??
    "Unknown";
```

The `createPodcast` mutation creates the user record just-in-time if the webhook hasn't synced yet — resolving a race condition where Clerk redirects the user to the app before the `user.created` webhook completes.

### Data Model

Five tables power the application:

- **`podcasts`** — metadata, file storage IDs, denormalized author fields, linked theme IDs, and a precomputed `trendingScore` (sum of linked theme heat scores)
- **`users`** — synced from Clerk via webhooks, indexed on `clerkId`
- **`macroThemes`** — slug, label, category, regions, asset classes, `heatScore` (0-3.0), `heatStatus`, AI-generated summary, risk chain, and source articles
- **`themeMentions`** — records each podcast-to-theme link with sentiment, relevance score, summary, and source articles
- **`favorites`** — user-podcast pairs with compound index for idempotent toggle

### Pipelines

**Podcast publish → Theme tagging (fire-and-forget):**
Publish → GPT identifies themes → `createTheme` (idempotent) → `recordMention` → `linkThemesToPodcast` → `generateThemeSummary` (web search + GPT)

**Trending score refresh (every 3 hours):**
Cron → Google Trends API (30-day, per theme) → momentum ratio → map to heatScore 0-3.0 → bulk recompute podcast `trendingScore`s

---

## 3. Tech Stack Deep Dive

| Technology | Role | Why This Over Alternatives | Tradeoff |
|---|---|---|---|
| **Next.js 16 + React 19** | Frontend framework | App Router enables granular server/client boundaries; React 19 concurrent features | Newer ecosystem — fewer community examples for edge cases |
| **Convex** | Serverless backend + cron | Real-time subscriptions, integrated file storage, typed schema, scheduled functions. Eliminates need for separate database, file storage, WebSocket layer, and cron service | Vendor lock-in; smaller community than Supabase or Firebase |
| **Clerk** | Authentication | Webhook-based sync, social login, session management. Avoids building auth primitives | External dependency on critical path; webhook reliability demands defensive patterns |
| **OpenAI** | AI pipeline (GPT-4.1-mini, DALL-E 3, TTS-1) | Single vendor for text, image, speech, and web search. GPT-4.1-mini's web search tool replaces a separate news API | Per-generation cost; TTS-1's 4096-char limit requires chunking; LLM JSON output requires regex extraction |
| **Google Trends** | Theme heat scoring | Free, real-time search interest data. Momentum-based scoring captures trend direction | Aggressive rate-limiting from cloud servers; single-keyword normalization makes absolute values meaningless |
| **Tailwind CSS + shadcn/ui** | Styling & components | Utility-first CSS with accessible Radix-based components. Rapid iteration without CSS specificity battles | Custom brutalist design system requires significant CSS beyond shadcn defaults |

### Design System

The UI follows a deliberately brutalist aesthetic: thick 4-6px borders, hard offset shadows, and a high-contrast palette (charcoal `#0a0a0a`, orange `#ff6b35` accent, cream text). Typography pairs Syne (900 weight, uppercase) for headings with Crimson Pro (italic) for descriptions. Custom CSS classes — `card-brutal`, `btn-brutal`, `noise-texture` — enforce visual consistency that stands apart from default component library aesthetics.

---

## 4. Technical Challenges & Solutions

### Challenge 1: TTS Text Chunking at the 4096-Character Boundary

**Constraint:** OpenAI's TTS-1 enforces a hard 4096-character input limit. A news podcast script runs 6,000-7,000 characters. The text must be split, each chunk converted to audio independently, then reassembled.

**Why naive splitting fails:** Cutting at exactly 4,096 characters lands mid-sentence, producing cut-off words and tonal discontinuities at boundaries.

**Solution:** Priority-based boundary detection — sentence endings first, word boundaries as fallback:

```typescript
// convex/openai.ts — sentence-aware text chunking for TTS
const window = remaining.slice(0, maxLen);
const sentenceEnd = Math.max(
  window.lastIndexOf(". "),
  window.lastIndexOf("! "),
  window.lastIndexOf("? "),
  window.lastIndexOf(".\n"),
);

let splitAt: number;
if (sentenceEnd > maxLen * 0.3) {
  splitAt = sentenceEnd + 1;  // split at sentence boundary
} else {
  const lastSpace = window.lastIndexOf(" ");
  splitAt = lastSpace > 0 ? lastSpace : maxLen;  // word, then hard break
}
```

The 30% threshold prevents degenerate chunks. After generating audio per chunk, MP3 buffers are byte-concatenated via `Uint8Array` — valid because MP3 is frame-based and each frame is independently decodable.

**Tradeoff:** Byte-level concatenation can produce a barely perceptible audio glitch at boundaries. Acceptable for spoken content; would not be for music.

### Challenge 2: Google Trends Momentum Scoring Under Rate Limits

**Constraint:** Google Trends aggressively rate-limits requests from cloud servers (Convex runs on AWS), returning CAPTCHA pages. Additionally, single-keyword queries normalize the peak to 100 within the time range, making absolute values meaningless for cross-theme comparison.

**Why the naive approach fails:** Comparing raw Google Trends values between "Fed Rate Cuts" and "Oil Prices" tells you nothing — both peak at 100 in their respective windows.

**Solution:** Compute momentum as a ratio of recent interest to baseline interest within each theme's own window:

```typescript
// convex/trendsCron.ts — momentum-based heat scoring
const values: number[] = points.map((p: any) => p.value[0] as number);

const splitIdx = Math.floor(values.length * 0.75);
const early = values.slice(0, splitIdx);
const recent = values.slice(splitIdx);

const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

if (earlyAvg === 0) return recentAvg > 0 ? 1.5 : 1.0;
return recentAvg / earlyAvg;  // >1 = rising, <1 = falling
```

Momentum is clamped to [0.5, 1.5] and mapped linearly to a 0-3.0 heat score. The cron runs every 3 hours with 8-second delays between requests. On failure, `getTrendsMomentum` returns `null` and the theme keeps its existing score — a skip-on-failure pattern that prevents rate-limited themes from being zeroed out.

**Tradeoff:** 8-second delays mean a full refresh of 20 themes takes ~3 minutes. Acceptable for a 3-hour cycle; would need batching or a proxy for real-time scoring.

### Challenge 3: Async Theme Tagging with Fire-and-Forget Orchestration

**Constraint:** After publishing a podcast, the system must identify macro themes from the script, create or match existing themes, record mentions with sentiment, link themes to the podcast, and generate AI summaries — without blocking the publish response or crashing on partial failures.

**Solution:** A fire-and-forget action chain where each step degrades gracefully:

```typescript
// convex/themeActions.ts — GPT theme identification + chained mutations
const existingThemes = await ctx.runQuery(api.themes.getTrendingThemes);
const existingThemeList = existingThemes
  .map((t) => `${t.slug} (${t.label} — ${t.category})`)
  .join("\n");

// GPT maps script to existing themes or creates new ones
const completion = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  messages: [{ role: "system", content: `...Map to existing themes:\n${existingThemeList}` },
             { role: "user", content: args.scriptText.slice(0, 8000) }],
});

const raw = completion.choices[0]?.message?.content ?? "";
const arrayMatch = raw.match(/\[[\s\S]*\]/);
if (!arrayMatch) return;  // graceful exit on parse failure
```

The prompt includes all existing themes so GPT maps to them rather than creating duplicates. Each summary generation is individually try-caught — if one theme's summary fails, the rest still complete. The 8,000-character script truncation prevents context overflow.

**Tradeoff:** Fire-and-forget means theme tags may silently fail. Acceptable for a non-critical enrichment pipeline; a production system would add a retry queue.

### Challenge 4: Context-Aware Chatbot with Platform Data Grounding

**Constraint:** An AI chatbot for asset managers must provide answers grounded in real platform data (heat scores, mention counts, sentiment breakdowns) — not hallucinated financial advice. It must adapt its context based on where the user is in the application.

**Solution:** Multi-level context injection that assembles platform data before each GPT call:

```typescript
// convex/chat.ts — context-aware data assembly
const contextParts: string[] = [];

if (args.contextHints?.themeSlug) {
  const theme = await ctx.runQuery(api.themes.getThemeBySlug, { slug: ... });
  contextParts.push(`Heat Score: ${theme.heatScore.toFixed(1)} (${theme.heatStatus})`);
  const mentions = await ctx.runQuery(api.themes.getThemeMentions, { limit: 10 });
  // ... assemble mention summaries with sentiment labels
}

// Always load top 15 trending themes for cross-referencing
const trendingThemes = await ctx.runQuery(api.themes.getTrendingThemes);
```

The system prompt explicitly instructs the model to admit when platform data doesn't cover a question. Temperature is set to 0.3 (conservative) and conversation history is trimmed to 20 messages to manage token costs.

**Tradeoff:** Loading theme + mentions + trending data on every message adds latency (~200-400ms of database reads). Acceptable for a conversational interface; would need caching for real-time trading scenarios.

---

## 5. Impact & Future Roadmap

### Current State

- End-to-end podcast creation pipeline (manual + AI news wizard) with draft auto-save
- Macro-economic theme tracking with Google Trends momentum scoring (3-hour refresh cycle)
- AI-generated theme summaries with risk chain analysis ("Event → Mechanism → Market Impact")
- Sentiment tracking (hawkish/dovish/neutral) with 7-day sparklines and breakdowns
- Context-aware AI chatbot grounded in live platform data
- Star/favorites system with optimistic UI and cascade delete
- Responsive three-column layout with brutalist design system

### Scalability Considerations

- Momentum-based scoring normalizes across themes without requiring cross-keyword Google Trends queries (which are rate-limited differently)
- Denormalized author data on podcasts avoids N+1 patterns but requires batch sync on profile updates — already implemented in the webhook handler
- Precomputed `trendingScore` on podcasts table avoids runtime aggregation across theme joins
- Skip-on-failure pattern in the trends cron prevents partial rate-limiting from corrupting the entire scoring dataset

### Planned Features

- **Scheduled publishing** — Convex scheduled functions for daily/weekly automated podcast generation. Users configure topic, tone, and cadence; the system handles the full pipeline.
- **Multi-voice episodes** — Host-and-guest format using multiple TTS voices with speaker label parsing and interleaved chunk generation.
- **Real-time alerts** — Push notifications when a theme's momentum crosses a threshold (e.g., "Fed Rate Cuts" heat score jumps from stable to hot).
- **Portfolio correlation** — Map themes to asset class exposures and show how trending macro themes could impact a user's portfolio positions.
- **Multi-source sentiment** — Aggregate sentiment signals from news articles, social media, and central bank statements beyond podcast scripts alone.

The architecture is designed for this kind of extension: each layer — auth, backend, AI orchestration, frontend — can evolve independently. Swapping TTS providers, adding a new data source to the scoring pipeline, or extending the schema requires changes in a single layer without cascading rewrites.
