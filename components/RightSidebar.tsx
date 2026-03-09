"use client";

import { useUser, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAudio } from "@/app/providers/AudioProvider";
import { ChevronRight } from "lucide-react";
import TrendingTopics from "./TrendingTopics";

const RightSidebar = ({ inline = false }: { inline?: boolean }) => {
  const { user } = useUser();
  const { audio } = useAudio();

  const content = (
    <>
      <SignedIn>
        <Link
          href={`/profile/${user?.id}`}
          className="flex items-center gap-3 pb-8"
        >
          <UserButton />
          <div className="flex items-center justify-between w-full">
            <h1 className="text-16 truncate font-semibold text-white-1">
              {user?.firstName} {user?.lastName}
            </h1>
            <ChevronRight size={20} className="text-white-4" />
          </div>
        </Link>
      </SignedIn>

      <TrendingTopics />
    </>
  );

  if (inline) {
    return <div className="space-y-6 text-white-1">{content}</div>;
  }

  return (
    <section className={cn("right_sidebar text-white-1", { "h-[calc(100vh-140px)]": audio?.audioUrl })}>
      {content}
    </section>
  );
};

export default RightSidebar;
