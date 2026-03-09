"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader, ArrowLeft, TrendingUp, BarChart3, Mic2 } from "lucide-react";
import Link from "next/link";
import ThemeBadge from "@/components/ThemeBadge";
import MentionSparkline from "@/components/MentionSparkline";
import SentimentBreakdown from "@/components/SentimentBreakdown";
import RiskChainDisplay from "@/components/RiskChainDisplay";
import PodcastCard from "@/components/PodcastCard";

function getHeroFontSize(label: string): string {
  const len = label.length;
  if (len <= 12) return "text-6xl md:text-7xl";
  if (len <= 20) return "text-4xl md:text-6xl";
  if (len <= 30) return "text-3xl md:text-5xl";
  return "text-2xl md:text-4xl";
}

const TopicDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.topicSlug as string;

  const theme = useQuery(api.themes.getThemeBySlug, { slug });
  const sparklineData = useQuery(
    api.themes.getDailyMentionCounts,
    theme ? { themeId: theme._id, days: 7 } : "skip",
  );
  const sentiment = useQuery(
    api.themes.getSentimentBreakdown,
    theme ? { themeId: theme._id } : "skip",
  );
  const podcasts = useQuery(
    api.themes.getPodcastsByTheme,
    theme ? { themeId: theme._id } : "skip",
  );
  const allThemes = useQuery(api.themes.getTrendingThemes);

  // Theme lookup for podcast cards
  const themeMap = new Map<string, { label: string; heatStatus: string }>();
  if (allThemes) {
    for (const t of allThemes) {
      themeMap.set(t._id, { label: t.label, heatStatus: t.heatStatus });
    }
  }

  if (theme === undefined) {
    return (
      <div className="flex-center h-60">
        <Loader size={30} className="animate-spin text-orange-1" />
      </div>
    );
  }

  if (theme === null) {
    return (
      <div className="mt-9 flex flex-col items-center gap-4 py-16">
        <p className="text-18 font-bold text-white-4">Topic not found</p>
        <button
          onClick={() => router.back()}
          className="btn-brutal px-6 py-3 text-14"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Compute day-over-day delta
  let dayDelta = 0;
  if (sparklineData && sparklineData.length >= 2) {
    const today = sparklineData[sparklineData.length - 1];
    const yesterday = sparklineData[sparklineData.length - 2];
    dayDelta = yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : 0;
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white-4 hover:text-orange-1 transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        <span className="text-12 font-bold uppercase tracking-wider">Back</span>
      </button>

      {/* Header */}
      <div className="card-brutal p-8 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className={`${getHeroFontSize(theme.label)} font-syne font-black uppercase leading-tight break-words text-white-1 mb-3`}>
              {theme.label}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeBadge status={theme.heatStatus} size="md" />
              <span className="text-12 font-bold uppercase tracking-wider text-white-4 border-2 border-mid-gray px-2 py-0.5">
                {theme.category}
              </span>
              {theme.regions.map((r) => (
                <span key={r} className="text-10 font-bold uppercase tracking-wider text-white-4 bg-mid-gray/30 px-2 py-0.5">
                  {r}
                </span>
              ))}
              {theme.assetClasses.map((a) => (
                <span key={a} className="text-10 font-bold uppercase tracking-wider text-orange-1/70 bg-orange-1/10 px-2 py-0.5">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        {theme.latestSummary && (
          <div className="mb-6 p-4 border-l-4 border-orange-1 bg-orange-1/5">
            <p className="text-14 text-white-2 font-serif italic leading-relaxed">
              {theme.latestSummary}
            </p>
          </div>
        )}

        {/* Risk Chain */}
        {theme.riskChain && <RiskChainDisplay riskChain={theme.riskChain} />}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-brutal p-4">
          <p className="text-10 uppercase tracking-wider text-white-4 font-bold mb-1">Heat Score</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-1" />
            <span className="text-24 font-black text-white-1">{theme.heatScore.toFixed(1)}</span>
          </div>
        </div>
        <div className="card-brutal p-4">
          <p className="text-10 uppercase tracking-wider text-white-4 font-bold mb-1">Total Mentions</p>
          <span className="text-24 font-black text-white-1">{theme.totalMentions}</span>
        </div>
        <div className="card-brutal p-4">
          <p className="text-10 uppercase tracking-wider text-white-4 font-bold mb-1">Day / Day</p>
          <div className="flex items-center gap-1">
            <span className={`text-24 font-black ${dayDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
              {dayDelta >= 0 ? "+" : ""}{dayDelta}%
            </span>
          </div>
        </div>
        <div className="card-brutal p-4">
          <p className="text-10 uppercase tracking-wider text-white-4 font-bold mb-1">Activity</p>
          {sparklineData && <MentionSparkline data={sparklineData} width={120} height={40} />}
        </div>
      </div>

      {/* Sentiment */}
      <div className="card-brutal p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-orange-1" />
          <h2 className="text-16 font-black text-white-1 uppercase tracking-wide">Sentiment</h2>
        </div>
        {sentiment && (
          <SentimentBreakdown
            hawkish={sentiment.hawkish}
            dovish={sentiment.dovish}
            neutral={sentiment.neutral}
          />
        )}
      </div>

      {/* Related Podcasts */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Mic2 className="w-5 h-5 text-orange-1" />
          <h2 className="text-16 font-black text-white-1 uppercase tracking-wide">Related Podcasts</h2>
        </div>

        {podcasts === undefined ? (
          <div className="flex-center h-20">
            <Loader size={20} className="animate-spin text-orange-1" />
          </div>
        ) : podcasts.length === 0 ? (
          <div className="card-brutal p-8 flex flex-col items-center gap-4">
            <p className="text-14 text-white-4 font-serif italic">No podcasts about this topic yet</p>
            <Link
              href={`/create-news-podcast?topic=${encodeURIComponent(theme.label)}`}
              className="btn-brutal px-6 py-3 text-14"
            >
              Create a Podcast About {theme.label}
            </Link>
          </div>
        ) : (
          <div className="podcast_grid">
            {podcasts.map((p) => {
              const pThemes = (p.themeIds ?? [])
                .map((id) => themeMap.get(id))
                .filter(Boolean) as { label: string; heatStatus: string }[];

              return (
                <PodcastCard
                  key={p._id}
                  imgURL={p.imageUrl ?? ""}
                  title={p.podcastTitle}
                  description={p.podcastDescription}
                  podcastId={p._id}
                  themes={pThemes}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicDetailPage;
