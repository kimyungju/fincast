"use client";

import { cn } from "@/lib/utils";
import { useAudio } from "@/app/providers/AudioProvider";
import TrendingTopics from "./TrendingTopics";

const RightSidebar = ({ inline = false }: { inline?: boolean }) => {
  const { audio } = useAudio();

  const content = (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <TrendingTopics />
    </div>
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
