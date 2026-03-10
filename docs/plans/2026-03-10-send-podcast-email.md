# Send Podcast to Email — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let authenticated users email themselves any podcast (cover image, transcript, audio attachment) via Resend.

**Architecture:** New Convex action `sendPodcastEmail` in `convex/email.ts` calls the Resend API. Frontend adds a "Send to Email" button on the podcast detail page that triggers the action.

**Tech Stack:** Resend (email API), Convex actions (`"use node"`), Lucide React (Mail icon), Sonner (toast feedback)

**Note:** No test runner is configured in this project. Verification is done manually via `npm run build` and runtime testing.

---

### Task 1: Install Resend and set env var

**Files:**
- Modify: `package.json`

**Step 1: Install resend**

```bash
npm install resend
```

**Step 2: Set the API key in Convex environment**

```bash
npx convex env set RESEND_API_KEY <key from https://resend.com/api-keys>
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add resend email package"
```

---

### Task 2: Create Convex email action

**Files:**
- Create: `convex/email.ts`

**Step 1: Create `convex/email.ts`**

```typescript
"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { Resend } from "resend";

export const sendPodcastEmail = action({
  args: {
    podcastId: v.id("podcasts"),
    podcastUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // API key check
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new ConvexError("RESEND_API_KEY is not set");

    // Fetch podcast
    const podcast = await ctx.runQuery(
      // @ts-expect-error internal query reference
      "podcast:getPodcastById" as any,
      { podcastId: args.podcastId }
    );
    if (!podcast) throw new ConvexError("Podcast not found");

    // Fetch user email
    const users = await ctx.runQuery(
      // @ts-expect-error internal query reference
      "user:getUserByClerkId" as any,
      { clerkId: identity.subject }
    );
    const userEmail = users?.email ?? identity.email;
    if (!userEmail) throw new ConvexError("No email found for user");

    // Fetch audio binary for attachment
    let audioAttachment: { filename: string; content: Buffer } | undefined;
    if (podcast.audioStorageId) {
      const audioBlob = await ctx.storage.get(podcast.audioStorageId);
      if (audioBlob) {
        const arrayBuffer = await audioBlob.arrayBuffer();
        audioAttachment = {
          filename: `${podcast.podcastTitle}.mp3`,
          content: Buffer.from(arrayBuffer),
        };
      }
    }

    // Build HTML email
    const html = buildEmailHtml({
      title: podcast.podcastTitle,
      description: podcast.podcastDescription,
      transcript: podcast.voicePrompt,
      imageUrl: podcast.imageUrl ?? "",
      podcastUrl: args.podcastUrl,
    });

    // Send email
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Fincast <onboarding@resend.dev>",
      to: [userEmail],
      subject: `${podcast.podcastTitle}`,
      html,
      attachments: audioAttachment ? [audioAttachment] : [],
    });

    if (error) throw new ConvexError(`Failed to send email: ${error.message}`);

    return { success: true };
  },
});

function buildEmailHtml(params: {
  title: string;
  description: string;
  transcript: string;
  imageUrl: string;
  podcastUrl: string;
}) {
  const { title, description, transcript, imageUrl, podcastUrl } = params;

  // Escape HTML in transcript
  const escapedTranscript = transcript
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background-color:#0a0a0a;padding:24px 32px;">
            <h1 style="margin:0;color:#ff6b35;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:2px;">
              Fincast
            </h1>
          </td>
        </tr>

        <!-- Cover Image -->
        ${imageUrl ? `<tr>
          <td style="padding:0;">
            <img src="${imageUrl}" alt="${title}" width="600" style="display:block;width:100%;height:auto;" />
          </td>
        </tr>` : ""}

        <!-- Title & Description -->
        <tr>
          <td style="padding:32px 32px 16px;">
            <h2 style="margin:0 0 12px;color:#0a0a0a;font-size:22px;font-weight:800;">
              ${title}
            </h2>
            <p style="margin:0;color:#555555;font-size:15px;line-height:1.5;">
              ${description}
            </p>
          </td>
        </tr>

        <!-- Listen Button -->
        <tr>
          <td style="padding:0 32px 24px;">
            <a href="${podcastUrl}" style="display:inline-block;background-color:#ff6b35;color:#ffffff;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:12px 28px;text-decoration:none;border-radius:4px;">
              Listen on Fincast
            </a>
          </td>
        </tr>

        <!-- Transcript -->
        <tr>
          <td style="padding:0 32px 32px;">
            <h3 style="margin:0 0 12px;color:#0a0a0a;font-size:16px;font-weight:700;text-transform:uppercase;">
              Transcript
            </h3>
            <div style="background-color:#f9f9f9;border-left:4px solid #ff6b35;padding:16px;color:#333333;font-size:14px;line-height:1.7;">
              ${escapedTranscript}
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#0a0a0a;padding:16px 32px;">
            <p style="margin:0;color:#999999;font-size:12px;">
              Sent from Fincast — AI-powered macro economics podcasts
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
```

**Step 2: Verify Convex picks up the new file**

Convex dev server should auto-detect `convex/email.ts`. Check terminal for any type errors. The `api.email.sendPodcastEmail` should appear in `convex/_generated/api.d.ts`.

**Important:** The action uses `ctx.runQuery` to call existing queries. We need to check that `podcast:getPodcastById` and the user lookup work from within an action. If `ctx.runQuery` doesn't support string references, we'll use the `api` import from `_generated/api` instead (see note in Task 2b).

**Step 2b: Fix query references if needed**

If `ctx.runQuery` with string references causes type errors, replace with:

```typescript
import { api } from "./_generated/api";

// Replace string references with:
const podcast = await ctx.runQuery(api.podcast.getPodcastById, {
  podcastId: args.podcastId,
});
```

For the user lookup, check if `user:getUserByClerkId` exists. If not, query the user directly:

```typescript
// If no getUserByClerkId query exists, we can use the email from identity:
const userEmail = identity.email;
if (!userEmail) throw new ConvexError("No email found for user");
```

**Step 3: Commit**

```bash
git add convex/email.ts
git commit -m "feat: add sendPodcastEmail Convex action with Resend"
```

---

### Task 3: Add "Send to Email" button to PodcastDetailPlayer

**Files:**
- Modify: `components/PodcastDetailPlayer.tsx`

**Step 1: Add the email button**

Add imports at top of file:
```typescript
import { Play, Star, Mail, Loader2 } from "lucide-react";
import { useAction } from "convex/react";
```

Add state and handler after the existing `handleDelete`:
```typescript
const sendEmail = useAction(api.email.sendPodcastEmail);
const [isSending, setIsSending] = React.useState(false);

const handleSendEmail = async () => {
  setIsSending(true);
  try {
    const podcastUrl = `${window.location.origin}/podcast/${podcastId}`;
    await sendEmail({
      podcastId: podcastId as Id<"podcasts">,
      podcastUrl,
    });
    toast.success("Podcast sent to your email!");
  } catch {
    toast.error("Failed to send email");
  } finally {
    setIsSending(false);
  }
};
```

Add the button in the JSX, after the existing Favorite button (after line 149 closing `</button>`):
```tsx
<button
  onClick={handleSendEmail}
  disabled={isSending}
  className="ml-2 flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
  title="Send podcast to your email"
>
  {isSending ? (
    <Loader2 size={20} className="text-white-3 animate-spin" />
  ) : (
    <Mail size={20} className="text-white-3" />
  )}
  <span className="text-12 font-bold text-white-3 uppercase tracking-wide">
    {isSending ? "Sending..." : "Email"}
  </span>
</button>
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: No TypeScript or build errors.

**Step 3: Manual test**

1. Open a podcast detail page
2. Click "Email" button
3. Check your email inbox for the podcast with cover image, transcript, and MP3 attachment
4. Click "Listen on Fincast" link in email to verify it opens the correct page

**Step 4: Commit**

```bash
git add components/PodcastDetailPlayer.tsx
git commit -m "feat: add send-to-email button on podcast detail page"
```

---

### Task 4: Verify end-to-end and update README

**Files:**
- Modify: `README.md`

**Step 1: End-to-end verification**

1. Open podcast detail page for "Entertainment News Briefing — 2026. 3. 9."
2. Click "Email" button → should show "Sending..." spinner
3. Check email inbox → should receive email with:
   - Fincast header (dark bg, orange title)
   - Cover image
   - Podcast title + description
   - "Listen on Fincast" button
   - Transcript section
   - MP3 attachment
4. Click "Listen on Fincast" → should open podcast page

**Step 2: Add to README features**

In `README.md`, under the `### Podcast Platform` features section, add after the "Star / Favorites" line:

```markdown
- **Email to Self** — Send any podcast (cover art, transcript, and audio) directly to your email with one click
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add email feature to README"
```
