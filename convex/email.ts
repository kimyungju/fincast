"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { Resend } from "resend";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildEmailHtml(
  title: string,
  description: string,
  transcript: string,
  imageUrl: string | undefined,
  podcastUrl: string,
): string {
  const escapedTranscript = escapeHtml(transcript).replace(/\n/g, "<br>");

  const coverImageRow = imageUrl
    ? `<tr>
        <td style="padding:0;">
          <img src="${imageUrl}" alt="${escapeHtml(title)}" style="display:block;width:100%;height:auto;" />
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0a0a0a;padding:24px 32px;">
              <span style="color:#ff6b35;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">Fincast</span>
            </td>
          </tr>
          <!-- Cover Image -->
          ${coverImageRow}
          <!-- Title + Description -->
          <tr>
            <td style="padding:24px 32px;">
              <h2 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#0a0a0a;">${escapeHtml(title)}</h2>
              <p style="margin:0;font-size:15px;color:#555;line-height:1.5;">${escapeHtml(description)}</p>
            </td>
          </tr>
          <!-- Listen Button -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <a href="${podcastUrl}" style="display:inline-block;background-color:#ff6b35;color:#ffffff;text-decoration:none;text-transform:uppercase;font-size:14px;font-weight:700;padding:12px 28px;border-radius:4px;letter-spacing:1px;">Listen Now</a>
            </td>
          </tr>
          <!-- Transcript -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <h3 style="margin:0 0 12px 0;font-size:16px;font-weight:700;text-transform:uppercase;color:#0a0a0a;">Transcript</h3>
              <div style="background-color:#f9f9f9;border-left:4px solid #ff6b35;padding:16px;font-size:14px;color:#333;line-height:1.6;">
                ${escapedTranscript}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#0a0a0a;padding:16px 32px;">
              <p style="margin:0;font-size:12px;color:#888;">Sent from Fincast &mdash; AI-powered macro economics podcasts</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const sendPodcastEmail = action({
  args: {
    podcastId: v.id("podcasts"),
    podcastUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new ConvexError("RESEND_API_KEY is not set");
    }

    const podcast = await ctx.runQuery(api.podcast.getPodcastById, {
      podcastId: args.podcastId,
    });
    if (!podcast) {
      throw new ConvexError("Podcast not found");
    }

    const userEmail = identity.email;
    if (!userEmail) {
      throw new ConvexError("No email found for authenticated user");
    }

    // Build audio attachment if audio exists
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

    const html = buildEmailHtml(
      podcast.podcastTitle,
      podcast.podcastDescription,
      podcast.voicePrompt,
      podcast.imageUrl,
      args.podcastUrl,
    );

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: "Fincast <onboarding@resend.dev>",
      to: [userEmail],
      subject: podcast.podcastTitle,
      html,
      attachments: audioAttachment ? [audioAttachment] : [],
    });

    if (error) {
      throw new ConvexError(`Failed to send email: ${error.message}`);
    }

    return { success: true };
  },
});
