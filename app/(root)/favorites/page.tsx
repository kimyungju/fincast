"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import PodcastCard from "@/components/PodcastCard";
import LoaderSpinner from "@/components/LoaderSpinner";
import EmptyState from "@/components/EmptyState";

const Favorites = () => {
  const favorites = useQuery(api.favorites.getUserFavorites);

  return (
    <div className="mt-9 flex flex-col gap-9">
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-20 font-bold text-white-1">Your Favorites</h1>
          {favorites && (
            <span className="text-14 font-bold text-white-4">
              {favorites.length} {favorites.length === 1 ? "podcast" : "podcasts"}
            </span>
          )}
        </div>
      </section>

      {favorites === undefined ? (
        <LoaderSpinner />
      ) : favorites.length > 0 ? (
        <div className="podcast_grid">
          {favorites.map((podcast) => podcast && (
            <PodcastCard
              key={podcast._id}
              imgURL={podcast.imageUrl ?? ""}
              title={podcast.podcastTitle}
              description={podcast.podcastDescription}
              podcastId={podcast._id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No favorites yet"
          buttonLink="/discover"
          buttonText="Discover Podcasts"
        />
      )}
    </div>
  );
};

export default Favorites;
