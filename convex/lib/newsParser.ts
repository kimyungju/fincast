import { z } from "zod";

/**
 * Pure parsing + validation for the news articles returned by the web-search
 * model in `fetchNewsForTopic`. The model is asked for a JSON array, but the
 * action previously did `JSON.parse(text.match(/\[...\]/))` and returned the
 * result unchecked — malformed items (missing fields, non-string values, a
 * non-array, or prose wrapped around the JSON) would flow straight into the
 * podcast pipeline. This module is deliberately free of Convex / Node imports
 * so it is unit-testable in isolation.
 */

export const newsArticleSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  source: z.string().min(1),
  url: z.string().min(1),
});

export type NewsArticle = z.infer<typeof newsArticleSchema>;

/**
 * Extract and validate the news-article array from raw model output.
 *
 * - Tolerates prose around the JSON (extracts the first `[...]` block).
 * - Drops items that don't match the article shape rather than failing the
 *   whole batch, so one bad row doesn't lose the others.
 * - Throws only when there is no JSON array, the JSON is unparseable, or no
 *   item is valid — i.e. nothing usable to return.
 */
export function parseNewsArticles(rawText: string): NewsArticle[] {
  const match = rawText.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error("Failed to parse news articles from search results");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error("News search returned invalid JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("News search did not return a JSON array");
  }

  const valid: NewsArticle[] = [];
  for (const item of parsed) {
    const result = newsArticleSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    }
  }

  if (valid.length === 0) {
    throw new Error("News search returned no well-formed articles");
  }

  return valid;
}
