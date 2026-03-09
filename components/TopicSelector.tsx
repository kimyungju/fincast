"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import ThemeBadge from "./ThemeBadge";

interface TopicSelectorProps {
  selectedTopic: string | null;
  onSelect: (topic: string) => void;
}

const TopicSelector = ({ selectedTopic, onSelect }: TopicSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const trendingThemes = useQuery(api.themes.getTrendingThemes);
  const searchResults = useQuery(
    api.themes.searchThemes,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );

  const displayThemes =
    searchQuery.length >= 2 ? searchResults : trendingThemes;

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white-4" />
        <Input
          className="input-class pl-12 text-16"
          placeholder="Search macro topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Label */}
      {!searchQuery && (
        <p className="text-12 font-bold uppercase tracking-wider text-white-4 mb-4">
          Trending Topics
        </p>
      )}

      {/* Content */}
      {displayThemes === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Loader size={32} className="animate-spin text-orange-1" />
        </div>
      ) : displayThemes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-16 text-white-4">No topics found</p>
          {searchQuery && (
            <button
              type="button"
              className="btn-brutal px-6 py-3 text-14 font-bold uppercase tracking-wide"
              onClick={() => onSelect(searchQuery)}
            >
              Use &ldquo;{searchQuery}&rdquo; as custom topic
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {displayThemes.map((theme) => {
            const isSelected = selectedTopic === theme.slug;

            return (
              <button
                key={theme._id}
                type="button"
                onClick={() => onSelect(theme.slug)}
                className={`card-brutal p-4 text-left transition-all ${
                  isSelected
                    ? "border-orange-1 bg-orange-1/10"
                    : "hover:border-orange-1"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <ThemeBadge status={theme.heatStatus} />
                  <span className="text-12 font-bold text-white-4">
                    {theme.heatScore}
                  </span>
                </div>
                <p
                  className={`text-14 font-bold uppercase tracking-wide truncate ${
                    isSelected ? "text-orange-1" : "text-white-1"
                  }`}
                >
                  {theme.label}
                </p>
                <p className="text-10 text-white-4 mt-1 truncate">
                  {theme.category} &middot; {theme.regions.join(", ")}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopicSelector;
