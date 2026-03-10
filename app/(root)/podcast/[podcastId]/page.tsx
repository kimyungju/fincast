"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import LoaderSpinner from "@/components/LoaderSpinner";
import PodcastDetailPlayer from "@/components/PodcastDetailPlayer";
import PodcastCard from "@/components/PodcastCard";
import EmptyState from "@/components/EmptyState";
import { Eye } from "lucide-react";
import ThemeBadge from "@/components/ThemeBadge";
import Link from "next/link";

const PodcastDetails = () => {
  const { podcastId } = useParams<{ podcastId: string }>();
  const { user } = useUser();

  const podcast = useQuery(api.podcast.getPodcastById, {
    podcastId: podcastId as Id<"podcasts">,
  });

  const similarPodcasts = useQuery(api.podcast.getPodcastByVoiceType, {
    podcastId: podcastId as Id<"podcasts">,
  });

  const allThemes = useQuery(api.themes.getTrendingThemes);

  if (!podcast || !user) return <LoaderSpinner />;

  const isOwner = user.id === podcast.authorId;

  return (
    <section className="flex w-full flex-col gap-8 mt-9">
      <header className="flex items-center justify-between">
        <h1 className="text-20 font-bold text-white-1">Currently Playing</h1>
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-white-4" />
          <span className="text-16 font-bold text-white-1">{podcast.views}</span>
        </div>
      </header>

      <PodcastDetailPlayer
        audioUrl={podcast.audioUrl ?? ""}
        podcastTitle={podcast.podcastTitle}
        author={podcast.author}
        imageUrl={podcast.imageUrl ?? ""}
        authorImageUrl={podcast.authorImageUrl}
        isOwner={isOwner}
        podcastId={podcastId}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-18 font-bold text-white-1 uppercase">Description</h2>
          <p className="text-16 text-white-3 font-serif">{podcast.podcastDescription}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-18 font-bold text-white-1 uppercase">Transcription</h2>
          <p className="text-16 text-white-3 font-serif">{podcast.voicePrompt}</p>
        </div>

        {podcast.imagePrompt && (
          <div className="flex flex-col gap-2">
            <h2 className="text-18 font-bold text-white-1 uppercase">Thumbnail Prompt</h2>
            <p className="text-16 text-white-3 font-serif">{podcast.imagePrompt}</p>
          </div>
        )}

        {/* Themes */}
        {(() => {
          const themeIds = podcast.themeIds ?? [];
          if (themeIds.length === 0 || !allThemes) return null;
          const themeMap = new Map(allThemes.map((t) => [t._id, t]));
          const linked = themeIds.map((id) => themeMap.get(id)).filter(Boolean);
          if (linked.length === 0) return null;
          return (
            <div className="flex flex-col gap-3">
              <h2 className="text-18 font-bold text-white-1 uppercase">Themes</h2>
              <div className="flex flex-wrap gap-2">
                {linked.map((t) => (
                  <Link key={t!._id} href={`/topics/${t!.slug}`}>
                    <ThemeBadge status={t!.heatStatus} label={t!.label} size="md" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      <section className="flex flex-col gap-5 mt-8">
        <h2 className="text-20 font-bold text-white-1">Similar Podcasts</h2>
        {similarPodcasts && similarPodcasts.length > 0 ? (
          <div className="podcast_grid">
            {similarPodcasts.map((p) => (
              <PodcastCard
                key={p._id}
                imgURL={p.imageUrl ?? ""}
                title={p.podcastTitle}
                description={p.podcastDescription}
                podcastId={p._id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No similar podcasts found"
            buttonLink="/discover"
            buttonText="Discover More"
          />
        )}
      </section>
    </section>
  );
};

export default PodcastDetails;
