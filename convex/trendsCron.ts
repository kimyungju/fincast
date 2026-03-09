"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import googleTrends from "google-trends-api";

// ---------------------------------------------------------------------------
// Helper – Fetch Google Trends interest score (0-100) for a keyword
// ---------------------------------------------------------------------------

async function getGoogleTrendsScore(keyword: string): Promise<number> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const result = await googleTrends.interestOverTime({
      keyword,
      startTime: sevenDaysAgo,
      endTime: now,
      geo: "US",
    });

    const data = JSON.parse(result);
    const points = data.default?.timelineData;
    if (!points || points.length === 0) return 50;

    const latest = points[points.length - 1];
    return latest?.value?.[0] ?? 50;
  } catch (error) {
    console.error(`Google Trends fetch failed for "${keyword}":`, error);
    return 50;
  }
}

// ---------------------------------------------------------------------------
// Helper – Map Google Trends score (0-100) to heatScore (0-3.0) + heatStatus
// ---------------------------------------------------------------------------

function trendsScoreToHeat(score: number): {
  heatScore: number;
  heatStatus: string;
} {
  const heatScore = (score / 100) * 3.0;

  let heatStatus: string;
  if (heatScore > 2.0) heatStatus = "hot";
  else if (heatScore >= 1.3) heatStatus = "warming";
  else if (heatScore >= 0.7) heatStatus = "stable";
  else heatStatus = "cooling";

  return { heatScore: Math.round(heatScore * 100) / 100, heatStatus };
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

    for (let i = 0; i < themes.length; i++) {
      const theme = themes[i];

      // 2s delay between requests to avoid Google Trends rate limiting
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const trendsScore = await getGoogleTrendsScore(theme.label);
      const { heatScore, heatStatus } = trendsScoreToHeat(trendsScore);

      await ctx.runMutation(api.themes.updateThemeHeatScore, {
        themeId: theme._id,
        heatScore,
        heatStatus,
        trendsScore,
        trendsUpdatedAt: now,
      });

      results.push(
        `${theme.label}: ${trendsScore}/100 → ${heatScore} (${heatStatus})`,
      );
    }

    // Recompute trendingScore on all podcasts after bulk heatScore update
    await ctx.runMutation(api.themes.recomputeAllTrendingScores);

    return `Refreshed ${themes.length} themes:\n${results.join("\n")}`;
  },
});
