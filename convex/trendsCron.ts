"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import googleTrends from "google-trends-api";

// ---------------------------------------------------------------------------
// Helper – Fetch Google Trends momentum for a keyword
//
// Single-keyword queries normalize the peak to 100 within the time range,
// so the absolute value is meaningless for cross-keyword comparison.
// Instead we fetch 30 days and compute momentum: recent-week avg divided by
// prior-3-weeks avg.  >1 = rising interest, <1 = falling.
// Returns null on failure so the caller can skip the update.
// ---------------------------------------------------------------------------

async function getTrendsMomentum(keyword: string): Promise<number | null> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const result = await googleTrends.interestOverTime({
      keyword,
      startTime: thirtyDaysAgo,
      endTime: now,
      geo: "US",
    });

    const data = JSON.parse(result);
    const points = data.default?.timelineData;
    if (!points || points.length < 4) return null;

    const values: number[] = points.map((p: any) => p.value[0] as number);

    // Split: earlier 75% vs recent 25%
    const splitIdx = Math.floor(values.length * 0.75);
    const early = values.slice(0, splitIdx);
    const recent = values.slice(splitIdx);

    const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

    if (earlyAvg === 0) return recentAvg > 0 ? 1.5 : 1.0;

    return recentAvg / earlyAvg;
  } catch (error) {
    console.error(`Google Trends fetch failed for "${keyword}":`, error);
    return null; // caller will skip this theme
  }
}

// ---------------------------------------------------------------------------
// Helper – Map momentum ratio to heatScore (0-3.0) + heatStatus
//
// momentum 0.5  → heatScore 0.0  → cooling
// momentum 0.85 → heatScore 1.05 → stable
// momentum 1.0  → heatScore 1.5  → warming
// momentum 1.15 → heatScore 1.95 → warming
// momentum 1.2  → heatScore 2.1  → hot
// momentum 1.5+ → heatScore 3.0  → hot
// ---------------------------------------------------------------------------

function momentumToHeat(momentum: number): {
  heatScore: number;
  heatStatus: string;
} {
  // Clamp momentum to [0.5, 1.5] then map linearly to [0, 3.0]
  const clamped = Math.max(0.5, Math.min(1.5, momentum));
  const heatScore = Math.round((clamped - 0.5) * 3.0 * 100) / 100;

  let heatStatus: string;
  if (momentum > 1.15) heatStatus = "hot";
  else if (momentum >= 1.03) heatStatus = "warming";
  else if (momentum >= 0.88) heatStatus = "stable";
  else heatStatus = "cooling";

  return { heatScore, heatStatus };
}

// ---------------------------------------------------------------------------
// Action – Fetch Google Trends for all themes, update heatScores in bulk
// ---------------------------------------------------------------------------

export const refreshAllTrendsScores = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const themes = await ctx.runQuery(api.themes.getTrendingThemes);

    if (themes.length === 0) {
      return "No themes to refresh";
    }

    const results: string[] = [];
    const now = Date.now();
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < themes.length; i++) {
      const theme = themes[i];

      // 8s delay between requests to reduce Google rate-limiting
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 8000));
      }

      const momentum = await getTrendsMomentum(theme.label);

      // On failure (rate-limit / CAPTCHA), keep existing score
      if (momentum === null) {
        skipped++;
        results.push(`${theme.label}: SKIPPED (rate-limited)`);
        continue;
      }

      const { heatScore, heatStatus } = momentumToHeat(momentum);
      const trendsScore = Math.round(momentum * 100); // store for debugging

      await ctx.runMutation(api.themes.updateThemeHeatScore, {
        themeId: theme._id,
        heatScore,
        heatStatus,
        trendsScore,
        trendsUpdatedAt: now,
      });

      updated++;
      results.push(
        `${theme.label}: momentum=${momentum.toFixed(2)} → ${heatScore} (${heatStatus})`,
      );
    }

    // Recompute trendingScore on all podcasts after bulk heatScore update
    await ctx.runMutation(api.themes.recomputeAllTrendingScores);

    return `Refreshed ${updated}, skipped ${skipped} of ${themes.length} themes:\n${results.join("\n")}`;
  },
});
