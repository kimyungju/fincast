# Fincast Demo Video — Pre-Recording Setup Guide

**Date:** 10 Mar 2026
**Target duration:** 5 minutes
**Reference script:** `docs/plans/2026-03-10-demo-video-script.md`

---

## 1. Data Staging

Create exactly 4 podcasts before recording. These should cover diverse, topical themes that signal financial sophistication to hackathon judges.

### Podcast 1 — "Fed Policy News Briefing — 10 Mar 2026"
- **Topic slug:** `fed-policy`
- **Tone:** Professional | **Duration:** Medium
- **Why:** Fed policy is perpetually relevant, judges will recognize it instantly
- **Star this one:** YES (so Favorites page has content)
- **Expected themes tagged:** Fed Policy, US Inflation, USD Strength

### Podcast 2 — "China Trade News Briefing — 9 Mar 2026"
- **Topic slug:** `china-trade`
- **Tone:** Analytical | **Duration:** Medium
- **Why:** Geopolitical tension is a top-of-mind topic for asset managers; shows global coverage
- **Star this one:** YES
- **Expected themes tagged:** China Trade, Emerging Markets, Global Supply Chains

### Podcast 3 — "Oil Prices News Briefing — 8 Mar 2026"
- **Topic slug:** `oil-prices`
- **Tone:** Casual | **Duration:** Short
- **Why:** Commodities add diversity to the portfolio of demo podcasts; short duration keeps it snappy
- **Star this one:** NO
- **Expected themes tagged:** Oil Prices, Climate Energy Transition

### Podcast 4 — "AI Productivity News Briefing — 10 Mar 2026"
- **Topic slug:** `ai-productivity`
- **Tone:** Professional | **Duration:** Medium
- **Why:** This is a fintech hackathon — judges will love seeing AI tracked as a macro theme itself
- **Star this one:** NO
- **Expected themes tagged:** AI Productivity

### After creating all 4 podcasts, verify:
- [ ] Each podcast has a DALL-E cover art image (not a blank placeholder)
- [ ] Each podcast has working audio (play each one briefly)
- [ ] Theme badges appear on at least 2 podcast detail pages (wait 30-60s after publish for async tagging to complete)
- [ ] At least one theme (e.g., "Fed Policy" or "US Inflation") has a populated `latestSummary` and `riskChain` on its topic detail page
- [ ] The home page shows all 4 podcasts in the trending grid
- [ ] Favorites page shows exactly 2 podcasts (Fed Policy + China Trade)

### Theme heat scores
The Google Trends cron runs every 3 hours. If themes still show `heatScore: 0` and `heatStatus: dormant`, you need to trigger a manual refresh:

```bash
# In the Convex dashboard (https://dashboard.convex.dev), run this action:
# Functions → trendsCron → refreshAllTrendsScores → Run
# OR from terminal:
npx convex run trendsCron:refreshAllTrendsScores
```

This takes ~2 minutes (15 themes x 8s delay each). Wait for it to complete and verify that at least one theme shows "Hot" (heatScore > 1.95) or "Warming" (heatScore 1.03-1.95) on the Topic Selector page.

---

## 2. Environment Setup

### Terminal commands (run from project root)

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Start the dev servers (Next.js on port 3000 + Convex dev server)
npm run dev

# 3. Verify both servers are running:
#    - Next.js: http://localhost:3000 should load the app
#    - Convex: terminal should show "Convex functions ready" or similar
```

### Browser settings (use Chrome or Edge)

- **Window size:** 1440 x 900 minimum (shows all three columns: left sidebar, content, right sidebar). Ideally 1920 x 1080 for crisp recording.
- **Zoom level:** 100% (Ctrl+0 to reset)
- **DevTools:** CLOSED (F12 to toggle off)
- **Console errors:** Open DevTools once, check for red errors, close DevTools. Fix any errors before recording.
- **Extensions to disable:** Ad blockers (may interfere with API calls), Grammarly (adds DOM overlays), any extension that adds visible UI elements. Use a clean Chrome profile or Incognito with extensions disabled.
- **Bookmarks bar:** HIDDEN (Ctrl+Shift+B to toggle)
- **Notifications:** Disable system notifications (Windows: Settings → System → Notifications → OFF, or use Focus Assist / Do Not Disturb mode)
- **Other apps:** Close Slack, Discord, Teams, email clients — anything that might pop a notification during recording
- **Taskbar:** Auto-hide (right-click taskbar → Taskbar settings → Automatically hide) or make sure no distracting badges are visible

### Font check
The app uses Google Fonts (Syne + Crimson Pro). Load the app and verify headings render in Syne (thick, geometric sans-serif) and descriptions in Crimson Pro (serif italic). If fonts appear as fallbacks, clear browser cache and reload.

---

## 3. API Readiness Check

### OpenAI API key

```bash
# Verify the key is set in Convex environment:
npx convex env get OPENAI_API_KEY

# Quick functional test — generate a tiny TTS clip:
# Go to Convex dashboard → Functions → openai → generateAudioAction → Run
# Input: { "input": "Hello world test", "voice": "nova" }
# Should return a blob (audio buffer) without error

# Quick functional test — GPT-4.1-mini:
# Go to Convex dashboard → Functions → news → fetchNewsForTopic → Run
# Input: { "topic": "us-inflation" }
# Should return a JSON array of 5 articles within 5-10 seconds
```

If either fails with a 401/403 error, your OpenAI API key is invalid or has exhausted its credits. Check https://platform.openai.com/account/billing.

### Convex dev server

```bash
# Verify the Convex dev server is connected:
npx convex status
# OR check the terminal running `npm run dev` — look for "Convex functions ready"
```

### Google Trends heat scores

```bash
# Check that themes have real heat scores (not all zeros):
# Go to Convex dashboard → Data → macroThemes table
# Look for heatScore > 0 and trendsUpdatedAt with a recent timestamp
#
# If all heatScores are 0, run:
npx convex run trendsCron:refreshAllTrendsScores
```

Verify in the browser: navigate to `/create-news-podcast` and check that the Topic Selector grid shows heat badges (Hot, Warming, Stable, Cooling) — not all "dormant."

---

## 4. Browser State

### Clear draft persistence

Open the browser console (F12 → Console) and run:

```javascript
localStorage.removeItem('fincast:draft:news-podcast');
localStorage.removeItem('fincast:draft:podcast');
```

This ensures the News Podcast wizard starts fresh at Step 1 (Topic) instead of restoring a previous draft mid-flow.

### Cache and cookies
- Do NOT clear cookies — you need Clerk auth cookies to stay logged in
- Clear the browser cache if you see stale content: Ctrl+Shift+Delete → Cached images and files only
- If Clerk auth is stale, sign out and sign back in

### Starting URL
- Open the app at: `http://localhost:3000`
- You should land on the Home page, logged in, with 4 podcasts visible in the grid
- Verify the right sidebar shows "Trending Topics" with heat scores

---

## 5. Recording Software

### OBS Studio (recommended — free)

| Setting | Value |
|---------|-------|
| Resolution (canvas) | 1920 x 1080 |
| Resolution (output) | 1920 x 1080 |
| Frame rate | 30 fps (60 fps is unnecessary for a UI demo and doubles file size) |
| Encoder | x264 (CPU) or NVENC (GPU) |
| Rate control | CBR |
| Bitrate | 6000-8000 kbps for crisp text rendering |
| Audio input | Your microphone (USB condenser recommended) |
| Audio output | Mute desktop audio OR keep at low volume (you want the podcast audio to be audible when you click Play, but not competing with your voice) |
| Output format | .mkv (can be remuxed to .mp4 after recording — prevents file corruption if OBS crashes) |

### Loom (simpler alternative)

| Setting | Value |
|---------|-------|
| Resolution | 1080p (HD) |
| Audio | Microphone + System audio (both ON) |
| Camera | Optional — bottom-left bubble can add personality but may cover UI |
| Tab vs Desktop | Record the browser tab for cleaner output (hides taskbar, notifications) |

### Post-recording
- OBS: File → Remux Recordings → convert .mkv to .mp4
- Trim dead air at start/end
- If recording voiceover separately, sync in a video editor (DaVinci Resolve is free)

---

## 6. Risk Mitigation

### Section 3: Home & Discovery (1:20-2:00)

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Podcast audio doesn't play | Low | Pre-test the sticky player. If it fails, skip to the next section — the visual is enough |
| Search returns no results | Low | Pre-test your search query. Use a term you know exists in a podcast title (e.g., "inflation") |
| Favorites page is empty | Medium | Pre-star 2 podcasts before recording. Double-check the `/favorites` page shows them |

**Timing:** All interactions in this section are instant (local data, Convex real-time queries). No API latency risk.

### Section 4: AI News Podcast Creation (2:00-3:20) — HIGHEST RISK

| Step | API Call | Typical Duration | What Could Go Wrong | Backup Plan |
|------|----------|-------------------|---------------------|-------------|
| Step 1: Topic selection + article fetch | `news.fetchNewsForTopic` (GPT-4.1-mini web search) | 5-10 seconds | OpenAI rate limit or timeout; GPT returns unparseable JSON | Pre-create a backup podcast covering the same topic. If live generation fails, say "Let me show you one I prepared earlier" and navigate to the backup podcast detail page |
| Step 2: Article review | No API call | Instant | No risk | — |
| Step 3: Script generation | `news.generateNewsScript` (GPT-4.1-mini chat) | 3-8 seconds | Timeout or empty response | If it fails, click "Generate" again. GPT rarely fails twice in a row |
| Step 3 (background): Image prompt generation | `news.generateImagePrompt` (GPT-4.1-mini chat) | 2-4 seconds | Fails silently; falls back to template prompt | No action needed — fallback is automatic |
| Step 4a: Audio generation | `openai.generateAudioAction` (TTS-1) | 10-30 seconds (depends on script length; medium ~1200 words) | Timeout on long scripts; OpenAI TTS outage | **Pre-generate a backup audio file.** If live generation stalls at 30s+, narrate "This typically takes 15-20 seconds" and wait. If it fails, you can note it and skip to the publish of a pre-created podcast |
| Step 4b: Cover art generation | `openai.generateThumbnailAction` (DALL-E 3) | 10-20 seconds | DALL-E content policy rejection; timeout | Start cover art generation WHILE audio is generating (the UI supports this). If DALL-E rejects the prompt, the image prompt field is editable — simplify it and retry |
| Step 5: Publish | `podcast.createPodcast` mutation + async `tagPodcastThemes` | < 1 second for publish; 5-10s for theme tagging (async, not blocking) | Very unlikely to fail | — |

**Total estimated time for live creation:** 30-70 seconds of waiting. Script says "under 60 seconds of user interaction" — emphasize that the user interaction time (clicking, selecting) is under 60 seconds; API processing time is additional.

**Critical backup strategy:** Before recording, do one full creation flow with the topic you plan to demo (e.g., "US Inflation"). If the live flow fails during recording, navigate to this pre-created podcast and say "Here's the result" — judges will not know the difference in a video.

### Section 5: Macro Tracker & AI Chat (3:20-4:10)

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Theme detail page has no summary/risk chain | Medium | Verify before recording that at least "US Inflation" or "Fed Policy" has a `latestSummary`. If empty, manually trigger `themeActions.generateThemeSummary` from Convex dashboard for that theme |
| Heat scores are all zero | Medium | Run `refreshAllTrendsScores` at least 3 hours before recording. Verify non-zero scores in the dashboard |
| Chatbot response is slow (>10s) | Low | GPT-4.1-mini is fast (~2-5s). If it stalls, wait — do not click away. Have your question pre-typed in a text file so you can paste it quickly |
| Chatbot gives a poor/generic response | Low | Pre-test your exact question. The question "What are the risk implications for bond portfolios?" works well because it triggers the risk chain format. Have 1-2 backup questions ready |
| Sparkline chart is empty (no daily data) | Medium | Sparklines need `themeMentions` data over 7 days. If all podcasts were created on the same day, the sparkline may be sparse. This is acceptable — point to the heat score card instead |

### Section 6: Technical Architecture (4:10-4:40)

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| No architecture diagram prepared | High | This is optional. The script can be narrated over the live app. If you want a diagram, create a simple one in Excalidraw (free) or a slide |

---

## 7. Rehearsal Checklist

Run through this checklist exactly once as a full dry run. Time yourself.

### Pre-flight (do once, 30 min before recording)

1. [ ] `npm run dev` is running — both Next.js and Convex are active
2. [ ] Open `http://localhost:3000` — app loads, you are logged in
3. [ ] Home page shows 4 podcasts with cover art thumbnails
4. [ ] Right sidebar shows "Trending Topics" with non-zero heat scores
5. [ ] Click one podcast — detail page loads with transcript and theme badges
6. [ ] Click Play Podcast — sticky player appears, audio plays
7. [ ] Click the star on a podcast — yellow star toggles on
8. [ ] Navigate to `/favorites` — starred podcasts appear
9. [ ] Navigate to `/discover` — type "inflation" — results filter correctly
10. [ ] Navigate to `/create-news-podcast` — wizard starts at Step 1 (Topic)
11. [ ] Topic Selector shows heat badges (Hot/Warming/Stable/Cooling)
12. [ ] Select a topic (e.g., US Inflation) — articles load in 5-10 seconds
13. [ ] Select articles → Generate Script — script appears in 3-8 seconds
14. [ ] Select voice (Nova) → Generate Audio — audio appears in 10-30 seconds
15. [ ] Generate Thumbnail — cover art appears in 10-20 seconds
16. [ ] Click Publish — podcast publishes, redirects to home
17. [ ] Click a theme badge → topic detail page loads with heat score, summary, source links
18. [ ] Open chatbot (orange button, bottom-right) — type a question — response appears in 2-5 seconds
19. [ ] Clear the draft persistence keys (see Section 4) after dry run
20. [ ] Delete the dry-run podcast from its detail page (red delete button) so you start with exactly 4 podcasts

### Recording checklist (final 5 min before hitting Record)

21. [ ] Browser zoom is 100%
22. [ ] DevTools are closed
23. [ ] Bookmarks bar is hidden
24. [ ] System notifications are disabled
25. [ ] No other apps are visible or could produce popups
26. [ ] Microphone is connected and tested (record 5 seconds, play back)
27. [ ] OBS/Loom is configured per Section 5 settings
28. [ ] Browser is on `http://localhost:3000` (home page)
29. [ ] Draft persistence cleared (`fincast:draft:news-podcast`)
30. [ ] Script printout or teleprompter is ready (second monitor or physical copy)
31. [ ] A glass of water is within reach (5 minutes of narration)
32. [ ] Timer is set/visible for pacing (phone timer or second monitor)

---

## Quick Reference — API Timing Summary

| Operation | API Used | Expected Wait |
|-----------|----------|---------------|
| Fetch articles | GPT-4.1-mini (web_search) | 5-10s |
| Generate script | GPT-4.1-mini (chat) | 3-8s |
| Generate image prompt | GPT-4.1-mini (chat) | 2-4s |
| Generate audio | OpenAI TTS-1 | 10-30s (scales with script length) |
| Generate cover art | DALL-E 3 | 10-20s |
| Publish podcast | Convex mutation | < 1s |
| Theme tagging (async) | GPT-4.1-mini + mutations | 5-10s (non-blocking) |
| Chatbot response | GPT-4.1-mini (chat) | 2-5s |
| Google Trends refresh | google-trends-api | ~2 min total (15 themes x 8s) |
