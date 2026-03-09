"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import PodcastCard from "@/components/PodcastCard";
import { Id } from "@/convex/_generated/dataModel";
import { Loader, Mic2 } from "lucide-react";
import Link from "next/link";

const Home = () => {
  const trendingPodcasts = useQuery(api.podcast.getTrendingPodcasts);
  const allThemes = useQuery(api.themes.getTrendingThemes);

  const themeMap = new Map<string, { label: string; heatStatus: string }>();
  if (allThemes) {
    for (const t of allThemes) {
      themeMap.set(t._id, { label: t.label, heatStatus: t.heatStatus });
    }
  }

  return (
    <div className="mt-9 flex flex-col gap-9">
      <section className="flex flex-col gap-5">
        <h1 className="text-20 font-bold text-white-1">Trending Podcasts</h1>

        {trendingPodcasts === undefined ? (
          <div className="flex-center h-40">
            <Loader size={24} className="animate-spin text-orange-1" />
          </div>
        ) : trendingPodcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 border-4 border-dashed border-mid-gray">
            <Mic2 size={48} className="text-white-4" />
            <p className="text-18 font-bold text-white-4">No podcasts yet</p>
            <p className="text-14 text-white-4 font-serif italic">
              Be the first to create one!
            </p>
            <Link
              href="/create-podcast"
              className="btn-brutal mt-2 text-14 px-6 py-3"
            >
              Create Podcast
            </Link>
          </div>
        ) : (
          <div className="podcast_grid">
            {trendingPodcasts.map(({ _id, podcastTitle, podcastDescription, imageUrl, themeIds }) => {
              const themes = (themeIds ?? [])
                .map((id: Id<"macroThemes">) => themeMap.get(id))
                .filter(Boolean) as { label: string; heatStatus: string }[];

              return (
                <PodcastCard
                  key={_id}
                  imgURL={imageUrl ?? ""}
                  title={podcastTitle}
                  description={podcastDescription}
                  podcastId={_id}
                  themes={themes}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
