"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import ThemeBadge from "./ThemeBadge";
import { TrendingUp } from "lucide-react";

const TrendingTopicItem = ({ theme }: { theme: any }) => {
  return (
    <Link
      href={`/topics/${theme.slug}`}
      className="block p-2.5 border-2 border-transparent hover:border-orange-1 hover:bg-orange-1/5 transition-all group"
    >
      <p className="text-12 font-bold text-white-1 uppercase tracking-wide leading-snug group-hover:text-orange-1">
        {theme.label}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <ThemeBadge status={theme.heatStatus} />
        <span className="text-11 text-white-4">
          {theme.totalMentions} mention{theme.totalMentions !== 1 ? "s" : ""}
        </span>
      </div>
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
      <div className="flex flex-col">
        {themes.slice(0, 10).map((theme) => (
          <TrendingTopicItem key={theme._id} theme={theme} />
        ))}
      </div>
    </div>
  );
};

export default TrendingTopics;
