# AI Agent Chatbot — Macro Intelligence Assistant — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a floating AI chatbot panel that answers macro-economic questions using live Convex database context, appears on every page, and matches the brutalist design system.

**Architecture:** A single Convex action (`convex/chat.ts:sendMessage`) gathers database context (current theme, podcast, or trending themes) server-side, builds a system prompt, and calls GPT-4.1-mini. A React component (`components/ChatBot.tsx`) manages panel open/close/minimize state, renders messages, detects the current page for context hints, and shows contextual quick-action chips. No chat persistence — state lives in React only.

**Tech Stack:** Convex actions (server-side OpenAI calls + `ctx.runQuery`), OpenAI GPT-4.1-mini (chat completions, temp 0.3), Next.js App Router (`usePathname`, `useParams`), React state, existing brutalist CSS design system.

---

## Task 1: Backend — Convex Chat Action

**Files:**
- Create: `convex/chat.ts`

**Why:** This is the only backend file. It receives the user message + conversation history + context hints, queries the database for relevant theme/podcast/trending data, builds a system prompt with all that context, calls GPT-4.1-mini, and returns the response text.

**Step 1: Create `convex/chat.ts`**

```typescript
"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";

export const sendMessage = action({
  args: {
    message: v.string(),
    conversationHistory: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    contextHints: v.optional(
      v.object({
        themeSlug: v.optional(v.string()),
        podcastId: v.optional(v.id("podcasts")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ConvexError("OPENAI_API_KEY is not set");
    }

    const openai = new OpenAI({ apiKey });

    // --- Gather context from database ---
    const contextParts: string[] = [];

    // 1. If on a specific theme page, load full theme data + recent mentions
    if (args.contextHints?.themeSlug) {
      const theme = await ctx.runQuery(api.themes.getThemeBySlug, {
        slug: args.contextHints.themeSlug,
      });
      if (theme) {
        contextParts.push(
          `## Current Theme: ${theme.label}`,
          `- Category: ${theme.category}`,
          `- Regions: ${theme.regions.join(", ")}`,
          `- Asset Classes: ${theme.assetClasses.join(", ")}`,
          `- Heat Status: ${theme.heatStatus} (score: ${theme.heatScore.toFixed(1)}/3.0)`,
          `- Total Mentions: ${theme.totalMentions}`,
          theme.latestSummary
            ? `- Latest AI Summary: ${theme.latestSummary}`
            : "",
          theme.riskChain ? `- Risk Chain: ${theme.riskChain}` : ""
        );

        // Load 10 most recent mention summaries
        const mentions = await ctx.runQuery(api.themes.getThemeMentions, {
          themeId: theme._id,
          limit: 10,
        });
        if (mentions.length > 0) {
          contextParts.push(
            `\n### Recent Mentions (${mentions.length}):`,
            ...mentions.map(
              (m: { sentiment: string; summary: string }, i: number) =>
                `${i + 1}. [${m.sentiment}] ${m.summary}`
            )
          );
        }
      }
    }

    // 2. If on a specific podcast page, load podcast data
    if (args.contextHints?.podcastId) {
      const podcast = await ctx.runQuery(api.podcast.getPodcastById, {
        podcastId: args.contextHints.podcastId,
      });
      if (podcast) {
        contextParts.push(
          `\n## Current Podcast: "${podcast.podcastTitle}"`,
          `- Author: ${podcast.author}`,
          `- Description: ${podcast.podcastDescription}`,
          `- Script/Transcript: ${podcast.voicePrompt.slice(0, 3000)}`
        );
      }
    }

    // 3. Always load top 15 trending themes for cross-referencing
    const trendingThemes = await ctx.runQuery(api.themes.getTrendingThemes);
    const top15 = trendingThemes.slice(0, 15);
    if (top15.length > 0) {
      contextParts.push(
        `\n## All Trending Themes (${top15.length}):`,
        ...top15.map(
          (t: {
            label: string;
            heatStatus: string;
            heatScore: number;
            regions: string[];
            assetClasses: string[];
            category: string;
            latestSummary?: string;
            riskChain?: string;
          }) =>
            `- ${t.label} [${t.heatStatus}, ${t.heatScore.toFixed(1)}] — ${t.category} | Regions: ${t.regions.join(", ")} | Assets: ${t.assetClasses.join(", ")}${t.latestSummary ? ` | Summary: ${t.latestSummary}` : ""}${t.riskChain ? ` | Risk: ${t.riskChain}` : ""}`
        )
      );
    }

    // --- Build system prompt ---
    const systemPrompt = `You are a macro intelligence assistant for Castory, a platform that tracks macro-economic themes through AI-generated podcast analysis.

Your role:
- Answer questions about macro themes, podcasts, and developments on the platform
- Connect developments across regions and asset classes — explain transmission mechanisms
- Be concise and direct — asset managers want signal, not filler
- Ground all answers in the provided platform data below
- When connecting themes, explain the transmission mechanism: "Event → Mechanism → Market Impact"
- Format risk implications as chains: "Event → Mechanism → Market Impact"
- If something is not in the provided context, say so honestly — do not fabricate data
- Use bold (**text**) for key terms and theme names
- Keep responses under 300 words unless the user asks for detail

## Platform Data
${contextParts.filter(Boolean).join("\n")}`;

    // --- Trim conversation to last 20 messages ---
    const trimmedHistory = args.conversationHistory.slice(-20);

    // --- Call OpenAI ---
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        ...trimmedHistory.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: args.message },
      ],
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new ConvexError("No response from AI model");
    }

    return response;
  },
});
```

**Step 2: Verify Convex types generate**

Run: `npx convex dev` (should pick up the new file and generate types without errors)
Expected: No type errors, `api.chat.sendMessage` is now available.

**Step 3: Commit**

```bash
git add convex/chat.ts
git commit -m "feat: add chatbot Convex action with database context gathering"
```

---

## Task 2: CSS — Add Chatbot Animations to globals.css

**Files:**
- Modify: `app/globals.css` (append after existing animations block, around line 478)

**Why:** The chatbot needs a typing indicator animation (bouncing dots) and a panel slide-up animation. Adding these to the existing CSS keeps styling centralized.

**Step 1: Append chatbot CSS to globals.css**

Add after the existing `.stagger-4` rule (line 485):

```css
/* ===== Chatbot ===== */

@keyframes chatbot-slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

.animate-chatbot-slide-up {
  animation: chatbot-slide-up 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.typing-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-orange);
  animation: typing-bounce 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}
```

**Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add chatbot animation CSS (slide-up, typing dots)"
```

---

## Task 3: Frontend — Create ChatBot Component

**Files:**
- Create: `components/ChatBot.tsx`

**Why:** This is the main UI component — a floating panel with open/close/minimize states, message rendering, context-aware quick action chips, typing indicator, and Convex action integration.

**Step 1: Create `components/ChatBot.tsx`**

```tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAction } from "convex/react";
import { usePathname, useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MessageSquare, X, Minus, Send, Maximize2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ---------------------------------------------------------------------------
// Quick Action Chips — context-dependent
// ---------------------------------------------------------------------------

function getQuickActions(pathname: string): string[] {
  if (pathname.startsWith("/topics/")) {
    return [
      "Summarize latest developments",
      "What are the risk implications?",
      "Connect to related themes",
      "Which regions are most affected?",
    ];
  }
  if (pathname.startsWith("/podcast/")) {
    return [
      "Summarize this podcast",
      "What themes does this cover?",
      "Any conflicting viewpoints?",
    ];
  }
  return [
    "What's the hottest theme right now?",
    "Connect US inflation to emerging markets",
    "What should I watch this week?",
  ];
}

// ---------------------------------------------------------------------------
// Markdown-lite renderer
// ---------------------------------------------------------------------------

function renderMessageContent(content: string) {
  // Split into lines, then process bold and arrow chains
  return content.split("\n").map((line, lineIdx) => {
    // Process inline formatting
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partKey = 0;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(
            <span key={partKey++}>{remaining.slice(0, boldMatch.index)}</span>
          );
        }
        parts.push(
          <strong key={partKey++} className="text-white-1 font-bold">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Arrow chains: → (style the arrows in orange)
      const arrowIdx = remaining.indexOf("→");
      if (arrowIdx !== -1) {
        if (arrowIdx > 0) {
          parts.push(
            <span key={partKey++}>{remaining.slice(0, arrowIdx)}</span>
          );
        }
        parts.push(
          <span key={partKey++} className="text-orange-1 font-bold">
            →
          </span>
        );
        remaining = remaining.slice(arrowIdx + 1);
        continue;
      }

      // Plain text
      parts.push(<span key={partKey++}>{remaining}</span>);
      break;
    }

    return (
      <span key={lineIdx}>
        {parts}
        {lineIdx < content.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type PanelState = "closed" | "open" | "minimized";

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "I'm your macro intelligence assistant. Ask me about any theme, or I can connect trends across regions and asset classes.",
};

const ChatBot = () => {
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pathname = usePathname();
  const params = useParams();

  const sendMessageAction = useAction(api.chat.sendMessage);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (panelState === "open") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [panelState]);

  // Build context hints from current route
  const getContextHints = useCallback((): {
    themeSlug?: string;
    podcastId?: Id<"podcasts">;
  } => {
    const hints: { themeSlug?: string; podcastId?: Id<"podcasts"> } = {};

    if (pathname.startsWith("/topics/") && params.topicSlug) {
      hints.themeSlug = params.topicSlug as string;
    }

    if (pathname.startsWith("/podcast/") && params.podcastId) {
      hints.podcastId = params.podcastId as Id<"podcasts">;
    }

    return hints;
  }, [pathname, params]);

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: messageText,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // Build conversation history (exclude welcome message)
        const history = [...messages, userMessage]
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        const contextHints = getContextHints();

        const response = await sendMessageAction({
          message: messageText,
          conversationHistory: history.slice(0, -1), // exclude current message (sent separately)
          contextHints:
            contextHints.themeSlug || contextHints.podcastId
              ? contextHints
              : undefined,
        });

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
        console.error("Chat error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, getContextHints, sendMessageAction]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = getQuickActions(pathname);

  // --- Closed state: floating button only ---
  if (panelState === "closed") {
    return (
      <button
        onClick={() => setPanelState("open")}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[var(--color-charcoal)] bg-[var(--color-orange)] text-white shadow-[4px_4px_0_rgba(0,0,0,0.5)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,0.5)] cursor-pointer"
        aria-label="Open chat"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  // --- Minimized state: header bar only ---
  if (panelState === "minimized") {
    return (
      <div className="fixed bottom-24 right-6 z-50 w-80 animate-chatbot-slide-up">
        <div
          className="flex items-center justify-between border-4 border-[rgba(255,255,255,0.15)] bg-[var(--color-dark-gray)] px-4 py-3 shadow-[4px_4px_0_rgba(255,255,255,0.1)] cursor-pointer"
          onClick={() => setPanelState("open")}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-orange)]" />
            <span className="font-syne text-12 font-black uppercase tracking-wider text-white-1">
              Macro Agent
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPanelState("open");
              }}
              className="p-1 text-white-4 hover:text-orange-1 transition-colors cursor-pointer"
              aria-label="Maximize"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPanelState("closed");
              }}
              className="p-1 text-white-4 hover:text-orange-1 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Open state: full panel ---
  return (
    <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-96 max-w-[calc(100vw-2rem)] flex-col border-[3px] border-[rgba(255,255,255,0.15)] bg-[var(--color-dark-gray)] shadow-[4px_4px_0_rgba(255,255,255,0.1)] animate-chatbot-slide-up noise-texture">
      {/* Header */}
      <div className="flex items-center justify-between border-b-[3px] border-[rgba(255,255,255,0.15)] px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-orange)]" />
          <span className="font-syne text-12 font-black uppercase tracking-wider text-white-1">
            Macro Agent
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPanelState("minimized")}
            className="p-1 text-white-4 hover:text-orange-1 transition-colors cursor-pointer"
            aria-label="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => setPanelState("closed")}
            className="p-1 text-white-4 hover:text-orange-1 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] text-14 leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#2a2a2a] border-2 border-[var(--color-mid-gray)] px-3 py-2 text-white-2"
                  : "text-white-2"
              }`}
            >
              {msg.role === "assistant"
                ? renderMessageContent(msg.content)
                : msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 px-2 py-2">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick action chips */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 border-t border-[var(--color-mid-gray)] scrollbar-hide flex-shrink-0">
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => handleSend(action)}
            disabled={isLoading}
            className="whitespace-nowrap border-2 border-[var(--color-mid-gray)] bg-[var(--color-charcoal)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white-4 transition-all hover:border-[var(--color-orange)] hover:text-orange-1 disabled:opacity-50 cursor-pointer flex-shrink-0"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 border-t-[3px] border-[rgba(255,255,255,0.15)] px-4 py-3 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about macro themes..."
          disabled={isLoading}
          className="flex-1 bg-[var(--color-charcoal)] border-2 border-[var(--color-mid-gray)] px-3 py-2 text-14 text-white-2 placeholder:text-[var(--color-light-gray)] placeholder:italic focus:outline-none focus:border-[var(--color-orange)] disabled:opacity-50 transition-colors"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="flex h-9 w-9 items-center justify-center bg-[var(--color-orange)] border-2 border-[var(--color-charcoal)] text-[var(--color-charcoal)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
```

**Step 2: Verify no import errors**

Run: `npx next build` or confirm in the dev server that the file is picked up without errors.
Expected: No compile errors. `api.chat.sendMessage` exists from Task 1.

**Step 3: Commit**

```bash
git add components/ChatBot.tsx
git commit -m "feat: add ChatBot floating panel component"
```

---

## Task 4: Mount ChatBot in Root Layout

**Files:**
- Modify: `app/(root)/layout.tsx`

**Why:** The chatbot must appear on every authenticated page. It goes inside the `<Authenticated>` block, after `<PodcastPlayer />`, so it floats above all content.

**Step 1: Add import and component to layout**

In `app/(root)/layout.tsx`:

1. Add import at the top (after the PodcastPlayer import, line 7):
```typescript
import ChatBot from "@/components/ChatBot";
```

2. Add `<ChatBot />` right after `<PodcastPlayer />` (inside `<Authenticated>`, after line 62):
```tsx
        <PodcastPlayer />
        <ChatBot />
```

The resulting `<Authenticated>` block should end:
```tsx
        </main>
        <PodcastPlayer />
        <ChatBot />
      </Authenticated>
```

**Step 2: Commit**

```bash
git add app/(root)/layout.tsx
git commit -m "feat: mount ChatBot in root layout"
```

---

## Task 5: Build Verification

**Step 1: Run Convex typecheck**

Run: `npx convex typecheck`
Expected: No errors. `convex/chat.ts` types are valid.

**Step 2: Run Next.js build**

Run: `npx next build`
Expected: Build succeeds with no errors.

**Step 3: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve build issues"
```

---

## Summary of All Files

| Action | File | Task |
|--------|------|------|
| Create | `convex/chat.ts` | 1 |
| Modify | `app/globals.css` (append ~25 lines) | 2 |
| Create | `components/ChatBot.tsx` | 3 |
| Modify | `app/(root)/layout.tsx` (2 lines) | 4 |

## Key Design Decisions

1. **Server-side context gathering**: The Convex action queries the DB internally via `ctx.runQuery` — the client only sends hint slugs/IDs, never raw data.
2. **System prompt rebuilt every message**: Context hints may change if the user navigates between messages.
3. **Conversation trimmed to 20 messages**: Prevents token overflow with GPT-4.1-mini.
4. **No persistence**: Messages stored in React state only — intentional for transient analysis.
5. **z-50 positioning**: PodcastPlayer is z-40 sticky bottom, chatbot is z-50 fixed `bottom-24` to sit above it.
6. **Temperature 0.3**: Low enough for factual grounded responses, not 0 (repetitive) or 0.5+ (too creative).
