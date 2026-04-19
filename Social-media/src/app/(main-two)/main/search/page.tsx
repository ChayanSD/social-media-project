"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import Post from "../../../../../components/Features/Main/Post/Post";
import ProductFeedCard from "../../../../../components/Cards/ProductFeedCard";
import EmptyPostsState from "../../../../../components/Shared/EmptyPostsState";
import { useMixedFeed } from "@/hooks/useMixedFeed";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import {
  useGetPopularCommunitiesQuery,
  CommunityItem,
} from "@/store/communityApi";
import CommunityCard from "../../../../../components/Shared/CommunityCard/CommunityCard";
import { useRouter } from "next/navigation";

type SearchTab = "all" | "products" | "discussions" | "communities";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryFromUrl = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(queryFromUrl);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");

  const { data: profileResponse } = useGetCurrentUserProfileQuery();
  const profile = profileResponse?.data;

  // Use query from URL for filtering
  const mixedFeed = useMixedFeed(queryFromUrl);
  const { mixed, products, posts, isLoading } = mixedFeed;

  // Communities search
  const { data: communitiesRes, isLoading: isCommunitiesLoading } =
    useGetPopularCommunitiesQuery();
  const filteredCommunities = useMemo(() => {
    const raw = communitiesRes?.results?.data ?? communitiesRes?.data ?? [];
    const all = Array.isArray(raw) ? raw : [];
    if (!queryFromUrl.trim()) return all.slice(0, 6);
    const q = queryFromUrl.toLowerCase();
    return all.filter(
      (c: CommunityItem) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.title || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }, [communitiesRes, queryFromUrl]);

  // Sync URL query to local input on navigation
  useEffect(() => {
    setSearchInput(queryFromUrl);
  }, [queryFromUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/main/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const tabs: { value: SearchTab; label: string; count: number }[] = [
    { value: "all", label: "All", count: mixed.length + filteredCommunities.length },
    { value: "products", label: "Products", count: products.length },
    { value: "discussions", label: "Discussions", count: posts.length },
    { value: "communities", label: "Communities", count: filteredCommunities.length },
  ];

  const renderResults = () => {
    const loading = isLoading || isCommunitiesLoading;

    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-white/60" size={28} />
        </div>
      );
    }

    if (!queryFromUrl.trim()) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center space-y-3">
            <Search size={48} className="mx-auto text-white/20" />
            <p className="text-white/50 text-base">
              Search for products, discussions, or communities
            </p>
          </div>
        </div>
      );
    }

    // All tab — interleaved
    if (activeTab === "all") {
      const hasResults = mixed.length > 0 || filteredCommunities.length > 0;
      if (!hasResults) {
        return (
          <EmptyPostsState
            message={`No results found for "${queryFromUrl}"`}
          />
        );
      }

      return (
        <div className="space-y-6">
          {/* Community results first */}
          {filteredCommunities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wider text-white/40">
                Communities ({filteredCommunities.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredCommunities.slice(0, 4).map((community: CommunityItem) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    variant="grid"
                    onCardClick={() =>
                      router.push(
                        `/main/communities/${encodeURIComponent(community.name || "")}`
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mixed feed results */}
          {mixed.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wider text-white/40">
                Posts &amp; Products ({mixed.length})
              </h3>
              <div className="space-y-4">
                {mixed.map((item) =>
                  item.type === "product" ? (
                    <ProductFeedCard key={item.id} item={item.raw} />
                  ) : (
                    <Post key={item.id} post={item.raw} profile={profile} />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Products tab
    if (activeTab === "products") {
      if (!products.length) {
        return <EmptyPostsState message={`No products matching "${queryFromUrl}"`} />;
      }
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {products.map((item) => (
            <ProductFeedCard key={item.id} item={item.raw} />
          ))}
        </div>
      );
    }

    // Discussions tab
    if (activeTab === "discussions") {
      if (!posts.length) {
        return <EmptyPostsState message={`No discussions matching "${queryFromUrl}"`} />;
      }
      return (
        <div className="space-y-4">
          {posts.map((item) => (
            <Post key={item.id} post={item.raw} profile={profile} />
          ))}
        </div>
      );
    }

    // Communities tab
    if (activeTab === "communities") {
      if (!filteredCommunities.length) {
        return <EmptyPostsState message={`No communities matching "${queryFromUrl}"`} />;
      }
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredCommunities.map((community: CommunityItem) => (
            <CommunityCard
              key={community.id}
              community={community}
              variant="grid"
              onCardClick={() =>
                router.push(
                  `/main/communities/${encodeURIComponent(community.name || "")}`
                )
              }
            />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="px-2 md:px-4 xl:px-10 space-y-6">
      {/* Search header */}
      <div className="rounded-2xl border border-white/10 bg-[#06133FBF] p-5 backdrop-blur-[17.5px]">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
          Search
        </p>
        <h1 className="mt-1 text-xl font-semibold text-white">
          Find products, discussions &amp; communities
        </h1>
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
              size={18}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Type to search..."
              className="w-full bg-black/30 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 transition-all"
            />
          </div>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 backdrop-blur-[17.5px]">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.value
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
            {queryFromUrl && (
              <span className="ml-2 text-xs opacity-70">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="min-h-[50vh]">{renderResults()}</div>
    </div>
  );
}
