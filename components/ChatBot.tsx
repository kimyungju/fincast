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
  return content.split("\n").map((line, lineIdx) => {
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

      // Arrow chains: → (style arrows in orange)
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
