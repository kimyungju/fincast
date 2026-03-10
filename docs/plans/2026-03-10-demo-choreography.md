# Fincast Demo Choreography -- Click-by-Click Walkthrough

**Purpose:** Precise step-by-step instructions for recording the 5-minute demo video. Every click, scroll, hover, and pause is documented. Follow this exactly.

**Prerequisites completed before recording:**
- `npm run dev` running (Next.js on port 3000 + Convex dev server)
- Browser at `http://localhost:3000`, logged in via Clerk, window at 1440px+ width
- At least 4 published podcasts with good titles visible on home page
- At least 2 podcasts have theme tags (check podcast detail pages)
- At least 1 theme has a populated summary and heat score (e.g., US Inflation)
- 1-2 podcasts pre-starred (check `/favorites` page has content)
- Draft cleared: open browser console, run `localStorage.removeItem('fincast:draft:news-podcast')`
- Browser console cleared of warnings
- System notifications disabled
- Screen recording software ready (1080p or 4K)

---

## SECTION 1: Hook & Problem (0:00 -- 0:40)

*No app interaction. Voiceover with pre-made visuals (dark screen, logo, montage).*

| Step | Time | Action |
|------|------|--------|
| 1.1 | 0:00 | **SCREEN:** Dark/black screen. Begin voiceover. |
| 1.2 | 0:03 | **SCREEN:** Fincast logo fades in (use `public/icons/logo.svg` or title card). |
| 1.3 | 0:10 | **SCREEN:** Optional montage of Bloomberg terminals / news feeds (stock footage or screenshots). |
| 1.4 | 0:35 | **TRANSITION:** Wipe/cut to the Fincast home page (browser already open at `localhost:3000`). |

**Voiceover timing:** Start speaking at 0:00. Finish the "listen to on your commute" line by 0:38.

---

## SECTION 2: Solution Overview (0:40 -- 1:20)

*App is visible but no clicks yet. Cursor gestures only.*

| Step | Time | Action | Expect |
|------|------|--------|--------|
| 2.1 | 0:40 | **VISIBLE:** Home page with "Trending Podcasts" heading and podcast grid below. Left sidebar shows: Home (active, orange right-border), Discover, Favorites, Create Podcast, News Podcast. Right sidebar shows "TRENDING TOPICS" with theme list. | Three-column layout fully rendered. |
| 2.2 | 0:45 | **HOVER:** Slowly move cursor across the podcast grid (left to right over 2-3 cards). Each card has: cover art image, orange "Episode" bar at bottom, title in uppercase, description in italic serif. On hover, the card border turns orange, the image zooms slightly, and a headphones icon appears centered. | Cards react to hover with border highlight + zoom + headphones icon overlay. |
| 2.3 | 0:55 | **HOVER:** Move cursor to the first podcast card and pause on it for 2 seconds. Point out the brutalist design -- thick border, hard shadow, orange accent stripe. The star icon is visible in the top-right corner of the card image. | Headphones overlay visible, star icon visible top-right. |
| 2.4 | 1:05 | **POINT:** Move cursor to the right sidebar. Hover slowly down the "TRENDING TOPICS" list. Each topic shows: label in uppercase, a ThemeBadge (Hot/Warming/Stable/Cooling colored dot + label), and mention count. | Right sidebar topics highlight on hover (border turns orange, text turns orange). |
| 2.5 | 1:15 | **PAUSE:** Return cursor to center of screen. Hold for 2 seconds before beginning Section 3. | Static view of full three-column layout. |

**Voiceover timing:** "This is Fincast..." at 0:40. "Let me show you how it works" lands at ~1:18.

---

## SECTION 3: Live Demo -- Home & Discovery (1:20 -- 2:00)

| Step | Time | Action | Expect |
|------|------|--------|--------|
| 3.1 | 1:20 | **NARRATE:** "The home page shows trending podcasts, ranked by our heat scoring algorithm." Cursor circles the podcast grid gently. | No click yet. Grid is visible. |
| 3.2 | 1:25 | **CLICK:** Click the FIRST podcast card in the grid (top-left). Click on the cover art image area. | Page navigates to `/podcast/[podcastId]`. Brief loading spinner may appear (orange spinning icon), then the podcast detail page loads. |
| 3.3 | 1:27 | **EXPECT:** Podcast detail page shows: "Currently Playing" header with eye/view count on right. Below that: cover art image (250x250, brutalist border) on left, podcast title in large uppercase bold text on right, author name + avatar + "Owner" badge (if yours) + Star button ("Favorite" text) + Mail button ("Email" text). Below that: orange "Play Podcast" button + red-bordered "Delete" button (if owner). Below those buttons: Description section, Transcription section, Themes section (with colored ThemeBadge links), and Similar Podcasts at bottom. | Full detail page rendered. Scroll position is at top. |
| 3.4 | 1:30 | **PAUSE:** Let the page settle for 2 seconds. Move cursor slowly over the title, then down to show the layout. | Viewer absorbs the detail page structure. |
| 3.5 | 1:33 | **SCROLL:** Scroll down slowly (~2 seconds) to reveal the Themes section. Point cursor at the ThemeBadge pills (e.g., "US Inflation" with a red "Hot" dot, or "Fed Policy" with orange "Warming" dot). | Theme badges are visible -- colored dots with labels, bordered pills. Each is a clickable link. |
| 3.6 | 1:36 | **SCROLL BACK UP:** Scroll back to the top of the page to reach the Play button. | Play Podcast button is visible (orange background, charcoal text, Play triangle icon + "Play Podcast" text). |
| 3.7 | 1:38 | **CLICK:** Click the orange "Play Podcast" button. | The sticky player bar appears at the BOTTOM of the screen. It shows: progress bar (thin orange line at top), podcast thumbnail (48x48), title + author, transport controls (Rewind, Play/Pause circle button in orange, FastForward), time display (00:00 / duration), volume icon. Audio begins playing automatically. |
| 3.8 | 1:40 | **PAUSE:** Let audio play for 3-4 seconds. Point cursor at the sticky player bar at the bottom. Move cursor across: thumbnail, title, play/pause button, time counter. | Audio is audible. Player bar is persistently visible at bottom. Time counter is advancing. |
| 3.9 | 1:44 | **CLICK:** Click the Star button next to the author name on the detail page. The star icon is a `Star` lucide icon with text "Favorite" next to it. Located in the author info row (right of author avatar). | Star fills with yellow (`fill-yellow-400 text-yellow-400`). Text changes from "Favorite" to "Favorited". Transition animation (200ms). |
| 3.10 | 1:46 | **CLICK:** In the LEFT SIDEBAR, click "Favorites" (third item, has a star icon). | Page navigates to `/favorites`. The heading reads "Your Favorites" with a count badge (e.g., "2 podcasts"). Below: podcast grid showing starred episodes as PodcastCards. The sticky player at the bottom PERSISTS and keeps playing. |
| 3.11 | 1:48 | **PAUSE:** Let the favorites page display for 2 seconds. Point cursor at the podcast cards shown. | Viewer sees that favorites persist. Sticky player still visible and playing at bottom. |
| 3.12 | 1:50 | **CLICK:** In the LEFT SIDEBAR, click "Discover" (second item, has a compass/discover icon). | Page navigates to `/discover`. Shows "Discover" heading and a search input with a magnifying glass icon and placeholder "Search for podcasts...". Below: all podcasts displayed in a grid. |
| 3.13 | 1:52 | **CLICK:** Click inside the search input field (has Search icon on left, placeholder text "Search for podcasts..."). | Input receives focus, cursor blinks inside. |
| 3.14 | 1:53 | **TYPE:** Type a relevant search term slowly (e.g., "inflation" -- type each letter with ~200ms gap so viewer can follow). | After a 500ms debounce pause, the podcast grid below filters in real-time. Only podcasts matching "inflation" in title/description/transcript appear. Non-matching cards disappear. |
| 3.15 | 1:57 | **PAUSE:** Let filtered results display for 2 seconds. Point cursor at the results. | Filtered grid visible. Shows matching podcast cards. |
| 3.16 | 1:59 | **TRANSITION:** Pause the sticky player by clicking the Play/Pause button (orange circle) in the bottom player bar, to avoid audio during Section 4. | Audio pauses. Pause icon switches back to Play icon. |

**Voiceover timing:** "Each podcast has a detail page..." at 1:25. "full-text search across all podcast content" at 1:52. End by 2:00.

**Fallback:** If the detail page loads slowly (>3 seconds), narrate "The app uses real-time Convex subscriptions, so data streams in as it's ready" to fill dead air.

---

## SECTION 4: Live Demo -- AI News Podcast Creation (2:00 -- 3:20)

This is the longest and most important section. Pace yourself carefully.

| Step | Time | Action | Expect |
|------|------|--------|--------|
| **Step 1: Navigate to Wizard** | | | |
| 4.1 | 2:00 | **CLICK:** In the LEFT SIDEBAR, click "News Podcast" (fifth/last item, has a newspaper icon). | Page navigates to `/create-news-podcast`. Header shows: orange pulsing dot + "Studio / News" label, large "News Podcast" title in display font, italic subtitle "Pick a topic, curate trending articles...". Step indicator bar shows 5 steps: [Topic] [Articles] [Script] [Audio & Art] [Publish]. "Topic" step is active (orange border, orange bg/10). |
| 4.2 | 2:03 | **PAUSE:** Let the page load for 2 seconds. Point cursor at the step indicator bar, moving left to right across all 5 step labels. | Step bar visible. Step 1 "Topic" is highlighted in orange. Steps 2-5 are gray. |
| **Step 1: Pick a Topic** | | | |
| 4.3 | 2:05 | **VISIBLE:** Below the step bar is a card with heading "01. Pick a Topic" (Newspaper icon + text). Below that: a search input ("Search macro topics...") and a label "Trending Topics". Below that: a 3-column grid of topic cards. Each card shows: ThemeBadge (Hot/Warming/Stable/Cooling), heat score number, topic label in uppercase, category + regions. | Topic grid fully rendered. Multiple topics visible (US Inflation, Fed Policy, Oil Markets, etc.). |
| 4.4 | 2:08 | **HOVER:** Move cursor over the topic grid. Hover over a "Hot" topic (look for the red-dotted "Hot" badge -- heat score > 1.15). Pause on it for 1 second to show the card details. | Card border highlights to orange on hover. Red "Hot" badge, heat score (e.g., "2.1"), and label clearly visible. |
| 4.5 | 2:10 | **CLICK:** Click the "US Inflation" topic card (or whichever Hot topic you identified). Click directly on the card body. | Card gets selected (orange border + orange bg tint). IMMEDIATELY: the card area is replaced by a loading state -- centered spinner with text "Searching for trending news..." and subtext "This usually takes 3-8 seconds". A toast notification appears (top-right): "Searching for trending news..." |
| 4.6 | 2:11 | **WAIT:** The app calls GPT-4.1-mini with web_search to find real articles. Wait for results. Typical time: 3-8 seconds. | Orange spinner animates. |
| 4.7 | 2:16 | **EXPECT:** Articles load. Toast: "Found X articles" (e.g., "Found 5 articles"). Page auto-advances to Step 2. Step indicator updates: Step 1 turns solid orange (completed), Step 2 "Articles" is now active (orange border). | Step 2 card appears with heading "02. Review Articles". |
| **Step 2: Review Articles** | | | |
| 4.8 | 2:17 | **VISIBLE:** Article review card shows: "X of Y articles selected" counter, "Select All"/"Deselect All" toggle button (orange text). Below: list of article cards, each with: orange checkbox (filled = selected), article title in bold, summary in gray (2 lines), source name in orange uppercase + "Source" external link. | All articles are pre-selected (all checkboxes filled orange). |
| 4.9 | 2:20 | **SCROLL:** Scroll down slowly through the article list to show 3-4 articles. Point cursor at article titles and source badges. | Articles are real, sourced from recent web results. Titles reference current events. |
| 4.10 | 2:24 | **CLICK (OPTIONAL):** Click one article to deselect it (checkbox unfills, border turns gray). Then click it again to re-select (checkbox fills orange, border turns orange). This demonstrates the toggle. | Article toggles selected/deselected state. Counter updates ("4 of 5" then back to "5 of 5"). |
| 4.11 | 2:27 | **SCROLL DOWN** to reveal the bottom buttons: gray "Back" button (left) and orange "Generate Script" button (right, `btn-brutal` style, with ArrowRight icon). | Both buttons visible. |
| 4.12 | 2:28 | **CLICK:** Click the orange "Generate Script" button. | Button text changes to spinner + "Generating Script...". Toast: "Generating podcast script...". The button is disabled during generation. Wait 5-15 seconds for GPT to generate the script. |
| **Step 3: Edit Script** | | | |
| 4.13 | 2:35 | **EXPECT:** Script generated. Toast: "Script generated!". Page auto-advances to Step 3. Step indicator: Steps 1-2 solid orange (completed), Step 3 "Script" active. | Step 3 card appears: "03. Edit Script". |
| 4.14 | 2:36 | **VISIBLE:** Script editor shows: Tone dropdown (default "Casual"), Duration dropdown (default "Medium (~5 min)"), orange-bordered "Regenerate" button. Below: large textarea filled with the generated script text. Below that: stats bar with "Words: XXX", "Est. Duration: ~X min", "Characters: X,XXX". | Script text is visible in the textarea. Stats bar shows real numbers. |
| 4.15 | 2:38 | **CLICK:** Click the Tone dropdown (shows "Casual"). | Dropdown opens with orange border. Options: Casual, Professional, Analytical. |
| 4.16 | 2:39 | **CLICK:** Select "Professional" from the dropdown. | Dropdown closes. Tone now shows "Professional". (Script is NOT regenerated -- user would need to click Regenerate.) |
| 4.17 | 2:40 | **NARRATE + SCROLL:** "The AI wrote a complete podcast script..." Scroll down through the script textarea slowly for 3 seconds to show content. | Script text scrolls, showing coherent paragraphs about the selected topic. |
| 4.18 | 2:44 | **POINT:** Move cursor to the stats bar at the bottom of the script section. Hover over "Words:", "Est. Duration:", and "Characters:" labels. | Stats bar is visible with real values. |
| 4.19 | 2:46 | **SCROLL DOWN** to reveal the "Continue to Audio" button (orange, btn-brutal, ArrowRight icon). | Button visible at bottom of Step 3 card. |
| 4.20 | 2:47 | **CLICK:** Click the orange "Continue to Audio" button. | Page transitions to Step 4. Step indicator: Steps 1-3 completed (solid orange), Step 4 "Audio & Art" active. |
| **Step 4: Audio & Art** | | | |
| 4.21 | 2:48 | **VISIBLE:** Step 4 has FOUR sub-cards stacked vertically: (a) "04a. Podcast Details" -- Title + Description inputs, pre-filled. (b) "04b. Voice Selection" -- Voice Type dropdown. (c) "04c. Generate Audio" -- textarea with script + Generate Audio button. (d) "04d. Generate Cover Art" -- AI/Upload toggle + prompt textarea + Generate Thumbnail button. Below all cards: Back + "Review & Publish" button (disabled until audio+image ready). | All four sub-cards visible (may need to scroll). Title input pre-filled with e.g., "Us Inflation News Briefing -- 10 Mar 2026". Description pre-filled. |
| 4.22 | 2:50 | **SCROLL** to the "04b. Voice Selection" card. | Voice Type dropdown visible with placeholder "Choose an AI voice...". |
| 4.23 | 2:51 | **CLICK:** Click the Voice Type dropdown ("Choose an AI voice..."). | Dropdown opens with orange border. Options: alloy, shimmer, nova, echo, fable, onyx. All in bold, capitalize. |
| 4.24 | 2:52 | **CLICK:** Select "nova" from the dropdown. | Dropdown closes. A voice preview may auto-play briefly (hidden audio element plays `/nova.mp3`). Below the dropdown, an info box appears: "Selected voice: Nova" (orange text on orange/10 background with left orange border). |
| 4.25 | 2:54 | **SCROLL** down to "04c. Generate Audio" card. | Card shows: "AI Voice Prompt" label, large textarea pre-filled with the script text, tip text below. "Generate Audio" button (orange, btn-brutal, Play icon). |
| 4.26 | 2:55 | **CLICK:** Click the orange "Generate Audio" button. | Button changes to spinner + "Generating Audio...". Toast: "Generating audio...". Then after upload: Toast: "Uploading audio...". Total wait: 15-45 seconds depending on script length. |
| 4.27 | 2:56 | **NARRATE** while waiting: "OpenAI's TTS engine converts the script to speech. Our system handles scripts of any length by splitting at sentence boundaries..." | Spinner continues. |
| 4.28 | 3:00 | **SCROLL DOWN** (while audio generates) to "04d. Generate Cover Art" card. | Card shows two toggle tabs: "Use AI to generate thumbnail" (active, orange underline) and "Upload custom image" (gray). Below: "AI Image Prompt" textarea pre-filled with GPT-generated prompt. "Generate Thumbnail" button (orange, btn-brutal, Image icon). |
| 4.29 | 3:01 | **CLICK:** Click the orange "Generate Thumbnail" button. | Button changes to spinner + "Generating Thumbnail...". Toast: "Generating thumbnail...". DALL-E generates image. Wait 10-20 seconds. |
| 4.30 | 3:05 | **NARRATE** while waiting: "The cover art prompt is auto-generated -- GPT analyzes the script content and creates a DALL-E prompt focused on the actual news story..." | Spinner continues for thumbnail. |
| 4.31 | 3:08 | **EXPECT (Audio):** Audio generation completes. Toast: "Audio generated successfully!". An audio preview player appears in the "04c" card: bordered box with "Generated Audio Preview" heading, HTML audio controls (play/pause, progress, volume), and "AI Generated" decorative label. An "Audio Ready" badge appears next to the Generate button (green pulsing dot + "Audio Ready" text). | Audio player visible with controls. |
| 4.32 | 3:10 | **EXPECT (Thumbnail):** Thumbnail generation completes. Toast: "Thumbnail uploaded successfully!". An image preview appears in the "04d" card: bordered box with "Thumbnail Preview" heading, the generated image (max 400px wide), trash icon to remove, and "AI Generated" label. An "Image Ready" badge appears. | Generated cover art image visible. |
| 4.33 | 3:12 | **SCROLL DOWN** to the bottom navigation buttons. The "Review & Publish" button should now be ENABLED (was disabled before audio+image were ready). | Orange "Review & Publish" button with ArrowRight icon, now clickable. |
| 4.34 | 3:13 | **CLICK:** Click the orange "Review & Publish" button. | Page transitions to Step 5. Step indicator: Steps 1-4 completed (solid orange), Step 5 "Publish" active. |
| **Step 5: Publish** | | | |
| 4.35 | 3:14 | **VISIBLE:** Publish card shows: "05. Publish" heading with Sparkles icon. Below: summary grid (4 boxes): Topic (e.g., "us-inflation" in orange), Articles (e.g., "5"), Audio ("Ready"), Cover ("Ready"). Below grid: Title box (dark bg, shows full title), Description box (shows description). At bottom: Back button + large orange "Publish News Podcast" button (Sparkles icon, h-16, text-18, uppercase, extra tracking). | Summary data all reads correctly. Publish button is prominent. |
| 4.36 | 3:16 | **PAUSE:** Point cursor at the summary boxes briefly (Topic, Articles count, Audio Ready, Cover Ready). | Viewer absorbs the review screen. |
| 4.37 | 3:17 | **CLICK:** Click the large orange "Publish News Podcast" button. | Button changes to spinner + "Publishing...". Toast: "News podcast published!". After publish completes, browser redirects to home page (`/`). The new podcast should appear in the trending grid. |
| 4.38 | 3:19 | **EXPECT:** Home page loads. New podcast visible in the grid (it may appear at top if trending score is computed, or among existing cards). | Home page with updated podcast grid. |

**Voiceover timing:** "Now here's the core feature..." at 2:00. "under 60 seconds of user interaction" lands at ~3:18.

**FALLBACK PLANS:**
- **If article fetch takes >10 seconds:** Narrate "The system is querying live news sources in real-time -- no cached data." Keep cursor on the spinner.
- **If script generation takes >15 seconds:** Scroll through the articles again while waiting. Comment on article quality.
- **If audio generation takes >45 seconds:** Say "For longer scripts, this can take up to a minute. I prepared a backup." If needed, navigate to a pre-created podcast.
- **If thumbnail generation fails:** Say "DALL-E occasionally rate-limits. We'd retry or upload a custom image." Click "Upload custom image" tab as backup.

---

## SECTION 5: Live Demo -- Macro Tracker & AI Chat (3:20 -- 4:10)

| Step | Time | Action | Expect |
|------|------|--------|--------|
| 5.1 | 3:20 | **CLICK:** Click the newly published podcast card (or any podcast with theme tags) in the home page grid. | Navigate to podcast detail page. |
| 5.2 | 3:22 | **SCROLL DOWN** to the "Themes" section on the podcast detail page. | Theme badges visible -- colored pills with dot + label text. Each is a link (e.g., "US Inflation" with red Hot dot, "Fed Policy" with orange Warming dot). |
| 5.3 | 3:24 | **POINT:** Move cursor over the theme badges. Hover on one to show it is clickable (cursor changes to pointer). | Theme badges visible. |
| 5.4 | 3:25 | **CLICK:** Click the first theme badge (e.g., "US Inflation"). | Navigate to `/topics/us-inflation` (topic detail page). Brief loading spinner, then page renders. |
| 5.5 | 3:27 | **EXPECT:** Topic detail page shows: Back button (arrow + "BACK" text, top-left). Header card with: large theme label ("US Inflation" in huge uppercase Syne font), ThemeBadge (md size, e.g., red "Hot"), category tag, region tags, asset class tags. | Header card fully rendered with all metadata badges. |
| 5.6 | 3:29 | **SCROLL DOWN** slightly to reveal the Metrics Grid. | 4-column grid of metric cards: (1) Heat Score -- TrendingUp icon + large number (e.g., "2.1"), (2) Total Mentions -- large number, (3) Day/Day -- percentage with green/red color (e.g., "+15%" in green), (4) Activity -- 7-day sparkline chart (small SVG line graph). |
| 5.7 | 3:32 | **POINT:** Move cursor across each metric card slowly (left to right, ~1 second each). Pause on the Heat Score card. | Viewer reads each metric. |
| 5.8 | 3:36 | **SCROLL DOWN** to "Latest Developments" section. | Section has FileText icon + "LATEST DEVELOPMENTS" heading. Below: a card-brutal containing: large italic serif text (the AI-generated summary paragraph), a RiskChainDisplay (if present -- shows risk propagation with arrow chains in colored boxes), and source links at bottom (source name in orange + external link icon). If summary is loading: spinner + "Generating summary from latest news..." |
| 5.9 | 3:38 | **PAUSE:** Let the summary text be readable for 3-4 seconds. Point cursor at the source links at the bottom. | Summary text and sources visible. |
| 5.10 | 3:42 | **SCROLL DOWN** to "Related Podcasts" section. | Shows Mic2 icon + "RELATED PODCASTS" heading. Podcast grid with cards + a dashed-border "Create a Podcast About [Topic]" card with Mic2 icon. |
| 5.11 | 3:44 | **SCROLL BACK UP** slightly so the Latest Developments section is partially visible. | Positions screen well for chatbot overlay. |
| 5.12 | 3:45 | **LOOK:** Locate the chatbot floating button -- an orange square button with MessageSquare icon, positioned at the BOTTOM-RIGHT of the viewport (fixed position: `bottom-24 right-6`). It is above the sticky player bar. | Orange button visible in bottom-right corner. |
| 5.13 | 3:46 | **CLICK:** Click the orange chatbot button (MessageSquare icon, bottom-right). | Chatbot panel opens with slide-up animation. Panel appears (fixed, bottom-24 right-6, w-96, h-520px): orange accent strip at top, header "Macro Agent" (with green dot + uppercase text), minimize (Minus icon) and close (X icon) buttons. Message area shows welcome message: "I'm your macro intelligence assistant. Ask me about any theme, or I can connect trends across regions and asset classes." Quick action chips visible below messages: "Summarize latest developments", "What are the risk implications?", "Connect to related themes", "Which regions are most affected?" (these are topic-page-specific chips). Input area at bottom: text input ("Ask about macro themes...") + orange Send button. |
| 5.14 | 3:48 | **PAUSE:** Let the chatbot panel be visible for 2 seconds. Point cursor at the quick action chips. | Panel fully rendered with welcome message and context-aware chips. |
| 5.15 | 3:50 | **CLICK:** Click inside the chatbot input field ("Ask about macro themes..." placeholder). | Input receives focus. |
| 5.16 | 3:51 | **TYPE:** Type slowly: `What are the risk implications for bond portfolios?` (type at a readable pace, ~3 seconds total). | Text appears in input field character by character. |
| 5.17 | 3:54 | **CLICK:** Click the orange Send button (Send/arrow icon, right of input). Alternatively, press Enter. | User message appears as a right-aligned bubble (dark gray background, thick border, shadow). Input clears. A typing indicator appears below (three bouncing dots). Loading state: send button disabled, input disabled. |
| 5.18 | 3:55 | **WAIT:** GPT-4.1-mini processes the question with context about the current theme (US Inflation). Wait 3-8 seconds. | Three dots animate. |
| 5.19 | 4:00 | **EXPECT:** AI response appears as a left-aligned message (orange left border, no background). Response includes bold terms (white-1 color), arrow chains (orange arrows), and structured analysis. Message area auto-scrolls to show the full response. | Response is visible, formatted with bold keywords and orange arrow symbols. |
| 5.20 | 4:02 | **PAUSE:** Let the response be readable for 5-6 seconds. Move cursor slowly down the response text. | Viewer reads the AI's financial analysis. |
| 5.21 | 4:08 | **CLICK:** Click the X button in the chatbot header to close it, OR leave it open. | If closed: panel disappears, orange floating button returns. If left open: proceed to Section 6 with panel still visible. |

**Voiceover timing:** "Every podcast gets auto-tagged..." at 3:20. "not just summaries" lands at ~4:08.

**Fallback:** If chatbot response takes >8 seconds, narrate "The AI is analyzing the theme data and recent developments to craft a contextual response..." If the theme has no summary yet (shows loading spinner), say "The system auto-generates summaries on first visit using GPT with live web search."

---

## SECTION 6: Technical Architecture (4:10 -- 4:40)

*Option A: Show a pre-made architecture diagram slide. Option B: Stay on the app and narrate.*

| Step | Time | Action | Expect |
|------|------|--------|--------|
| 6.1 | 4:10 | **OPTION A:** Switch to a pre-made architecture diagram (full screen or overlay). **OPTION B:** Stay on the topic detail page and narrate over the app. | Diagram or app visible. |
| 6.2 | 4:10-4:40 | **NARRATE ONLY:** No clicking during this section. If on the app, slowly scroll through the topic page or navigate to home page as visual backdrop. | Steady visual while technical details are narrated. |

**Voiceover timing:** "Under the hood, Fincast runs on a modern serverless stack..." at 4:10. "No mocks, no hardcoded content" lands at ~4:38.

**If running long (over 4:30 at this point):** Cut this section to 15 seconds. Just say: "Under the hood: Next.js 16, Convex for real-time serverless backend, OpenAI for all AI pipelines, Google Trends for momentum scoring. Everything is real data, real APIs, real-time."

---

## SECTION 7: Closing & Vision (4:40 -- 5:00)

| Step | Time | Action | Expect |
|------|------|--------|--------|
| 7.1 | 4:40 | **NAVIGATE:** If not already on the home page, click "Home" in the left sidebar (first item, house icon). | Home page loads. Full three-column layout visible: sidebar, trending podcasts grid, trending topics sidebar. Sticky player may be at bottom. |
| 7.2 | 4:42 | **PAUSE:** Hold on the home page. Do not move cursor. Let the full layout be visible for the closing narration. | Clean, full view of the app. |
| 7.3 | 4:55 | **TRANSITION:** Fade to a closing slide with Fincast logo and team info. Or keep the app visible. | Final frame. |
| 7.4 | 5:00 | **END:** Stop recording. | Recording complete. |

**Voiceover timing:** "Fincast transforms how finance professionals consume market intelligence..." at 4:40. "Thank you." lands at 4:58.

---

## MOUSE MOVEMENT GUIDELINES

Throughout the entire demo, follow these rules:

1. **Speed:** Move the cursor SLOWLY. Never flick or jerk. Every movement should take at least 0.5 seconds.
2. **Clicks:** Hover on the target for 0.5 seconds before clicking. This gives the viewer time to see what you are about to click.
3. **After clicks:** Keep the cursor still for 1 second after clicking, so the viewer can see the result.
4. **Scrolling:** Use smooth scroll (trackpad preferred over mouse wheel). Scroll at roughly 200px/second -- never fast-scroll.
5. **Pointing:** When drawing attention to something, move the cursor in a small slow circle around it (not on it -- beside it so it does not obscure text).
6. **Resting position:** When not actively pointing, rest the cursor in the CENTER of the screen, slightly below the main content area.
7. **Avoid edges:** Never park the cursor at the very edge of the screen or on the browser chrome.

---

## TIMING CHEAT SHEET

| Section | Start | End | Duration | Key Action |
|---------|-------|-----|----------|------------|
| 1. Hook | 0:00 | 0:40 | 40s | No app interaction |
| 2. Overview | 0:40 | 1:20 | 40s | Hover only, no clicks |
| 3. Home & Discovery | 1:20 | 2:00 | 40s | Click podcast, play, star, favorites, discover+search |
| 4. News Podcast | 2:00 | 3:20 | 80s | Full 5-step wizard |
| 5. Macro + Chat | 3:20 | 4:10 | 50s | Theme page, metrics, chatbot Q&A |
| 6. Architecture | 4:10 | 4:40 | 30s | Narration only |
| 7. Closing | 4:40 | 5:00 | 20s | Return to home, end |

---

## CRITICAL REMINDERS

- **Clear the draft** before recording: `localStorage.removeItem('fincast:draft:news-podcast')` in browser console.
- **Pre-star a podcast** so the Favorites page is not empty during step 3.10.
- **Test the full wizard flow once** before recording to ensure APIs are responsive and no rate limits are hit.
- **Mute the podcast audio** during Section 4 (step 3.16 pauses the player) so the voiceover is clear.
- **If any API call hangs**, keep narrating confidently. Mention "real-time data" or "live API calls" to turn the wait into a feature.
- **Do NOT click the "Delete" button** during the demo. It is destructive and has a confirm dialog.
- The sticky player at the bottom persists across all page navigations -- this is intentional and demonstrates persistent playback state.
- The chatbot quick-action chips change based on the current page context (home page chips differ from topic page chips differ from podcast page chips).
