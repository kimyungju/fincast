import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh Google Trends scores",
  { hours: 3 },
  api.trendsCron.refreshAllTrendsScores,
);

export default crons;
