"use client";

import Image from "next/image";
import { normalizeImageSrc } from "@/lib/utils";
import { useAudio } from "@/app/providers/AudioProvider";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Star, Mail, Loader2, Trash2 } from "lucide-react";
import React from "react";

const PodcastDetailPlayer = ({
  audioUrl,
  podcastTitle,
  author,
  imageUrl,
  authorImageUrl,
  isOwner,
  podcastId,
}: {
  audioUrl: string;
  podcastTitle: string;
  author: string;
  imageUrl: string;
  authorImageUrl: string;
  isOwner: boolean;
  podcastId: string;
}) => {
  const { setAudio } = useAudio();
  const router = useRouter();
  const deletePodcast = useMutation(api.podcast.deletePodcast);
  const [imgSrc, setImgSrc] = React.useState(() => normalizeImageSrc(imageUrl));
  const [authorSrc, setAuthorSrc] = React.useState(() =>
    normalizeImageSrc(authorImageUrl)
  );

  const isFavorited = useQuery(api.favorites.isFavorited, {
    podcastId: podcastId as Id<"podcasts">,
  });
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);
  const [optimisticFav, setOptimisticFav] = React.useState<boolean | null>(null);

  const sendEmail = useAction(api.email.sendPodcastEmail);
  const [isSending, setIsSending] = React.useState(false);

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const podcastUrl = `${window.location.origin}/podcast/${podcastId}`;
      await sendEmail({
        podcastId: podcastId as Id<"podcasts">,
        podcastUrl,
      });
      toast.success("Podcast sent to your email!");
    } catch {
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const favorited = optimisticFav ?? isFavorited ?? false;

  const handleToggleFavorite = async () => {
    const newState = !favorited;
    setOptimisticFav(newState);
    try {
      await toggleFavorite({ podcastId: podcastId as Id<"podcasts"> });
    } catch {
      setOptimisticFav(null);
    }
  };

  React.useEffect(() => {
    if (isFavorited !== undefined) {
      setOptimisticFav(null);
    }
  }, [isFavorited]);

  const handlePlay = () => {
    setAudio({
      title: podcastTitle,
      audioUrl,
      imageUrl,
      author,
      podcastId,
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this podcast?")) return;

    try {
      await deletePodcast({ podcastId: podcastId as Id<"podcasts"> });
      toast.success("Podcast deleted successfully");
      router.push("/");
    } catch {
      toast.error("Failed to delete podcast");
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-[720px]">
      <div className="flex items-center gap-6 max-sm:flex-col max-sm:items-start">
        <div className="card-brutal overflow-hidden w-[250px] h-[250px] max-sm:w-[180px] max-sm:h-[180px] flex-shrink-0">
          <Image
            src={imgSrc}
            width={250}
            height={250}
            alt={podcastTitle}
            className="w-full h-full object-cover"
            onError={() => setImgSrc("/placeholder.svg")}
          />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-32 font-extrabold text-white-1 uppercase tracking-wide">
            {podcastTitle}
          </h1>

          <div className="flex items-center gap-2">
            <Image
              src={authorSrc}
              width={30}
              height={30}
              alt={author}
              className="rounded-none border-2 border-orange-1"
              onError={() => setAuthorSrc("/placeholder.svg")}
            />
            <span className="text-14 font-bold text-white-3">{author}</span>
            {isOwner && (
              <span className="text-10 bg-orange-1 text-charcoal px-2 py-0.5 font-black uppercase">
                Owner
              </span>
            )}
            <button
              onClick={handleToggleFavorite}
              className="ml-2 flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              title={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                size={20}
                className={`transition-all duration-200 ${
                  favorited
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-white-3 stroke-[2.5]"
                }`}
              />
              <span className="text-12 font-bold text-white-3 uppercase tracking-wide">
                {favorited ? "Favorited" : "Favorite"}
              </span>
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="ml-2 flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
              title="Send podcast to your email"
            >
              {isSending ? (
                <Loader2 size={20} className="text-white-3 animate-spin" />
              ) : (
                <Mail size={20} className="text-white-3" />
              )}
              <span className="text-12 font-bold text-white-3 uppercase tracking-wide">
                {isSending ? "Sending..." : "Email"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {audioUrl && (
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 w-fit bg-orange-1 text-charcoal px-6 py-3 font-bold uppercase tracking-wide hover:bg-orange-1/80 transition-colors cursor-pointer"
          >
            <Play size={18} />
            Play Podcast
          </button>
        )}

        {isOwner && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 w-fit border-2 border-red-500 text-red-500 px-6 py-3 font-bold uppercase tracking-wide hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
          >
            <Trash2 size={18} />
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default PodcastDetailPlayer;
