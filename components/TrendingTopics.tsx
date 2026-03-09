"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import ThemeBadge from "./ThemeBadge";
import MentionSparkline from "./MentionSparkline";
import { TrendingUp } from "lucide-react";

const TrendingTopicItem = ({ theme }: { theme: any }) => {
  const sparklineData = useQuery(api.themes.getWeeklyMentionCounts, {
    themeId: theme._id,
    weeks: 4,
  });

  return (
    <Link
      href={`/topics/${theme.slug}`}
      className="flex items-center gap-3 p-3 border-2 border-transparent hover:border-orange-1 hover:bg-orange-1/5 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-14 font-bold text-white-1 truncate uppercase tracking-wide group-hover:text-orange-1">
          {theme.label}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <ThemeBadge status={theme.heatStatus} />
          <span className="text-12 text-white-4">
            {theme.totalMentions} mention{theme.totalMentions !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      {sparklineData && sparklineData.length > 1 && (
        <MentionSparkline data={sparklineData} />
      )}
    </Link>
  );
};

const TrendingTopics = () => {
  const themes = useQuery(api.themes.getTrendingThemes);

  if (!themes) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-orange-1" />
        <h2 className="text-16 font-black uppercase tracking-wide text-white-1">
          TRENDING TOPICS
        </h2>
      </div>
      <div className="flex flex-col gap-1">
        {themes.slice(0, 10).map((theme) => (
          <TrendingTopicItem key={theme._id} theme={theme} />
        ))}
      </div>
    </div>
  );
};

export default TrendingTopics;
