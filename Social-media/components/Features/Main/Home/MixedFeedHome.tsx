"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { FiEdit3, FiImage, FiLink } from "react-icons/fi";
import Post from "../Post/Post";
import ProductFeedCard from "../../../Cards/ProductFeedCard";
import EmptyPostsState from "../../../Shared/EmptyPostsState";
import ErrorState from "../../../Shared/ErrorState";
import FeedTabs, { FeedTabValue } from "../../../Shared/FeedTabs/FeedTabs";
import { useSearch } from "@/contexts/SearchContext";
import { useMixedFeed } from "@/hooks/useMixedFeed";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import { useGetMarketplaceCategoriesQuery } from "@/store/marketplaceApi";

const useSearchSafe = () => {
  try {
    return useSearch();
  } catch {
    return { searchQuery: "", setSearchQuery: () => {} };
  }
};

type MixedFeedHomeProps = {
  publicMode?: boolean;
  defaultTab?: FeedTabValue;
};

const FeedSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div
        key={idx}
        className="animate-pulse rounded-2xl border border-white/10 bg-[#06133FBF] p-4 backdrop-blur-[17.5px]"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <div className="h-3 w-32 rounded bg-white/10" />
        </div>
        <div className="mt-4 h-3 w-full rounded bg-white/10" />
        <div className="mt-4 h-44 rounded-xl bg-white/5" />
      </div>
    ))}
  </div>
);

/* ── Category Chips ───────────────────────────────────────────────── */
const CategoryChips = ({ onCategoryClick }: { onCategoryClick?: (name: string) => void }) => {
  const { data: categoriesRes } = useGetMarketplaceCategoriesQuery();
  const categories = useMemo(() => {
    const raw = categoriesRes?.data ?? categoriesRes?.results?.data ?? [];
    return raw.slice(0, 8);
  }, [categoriesRes]);

  if (!categories.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryClick?.(cat.name)}
          className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-purple-400/40 hover:bg-purple-500/10 hover:text-white"
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};

export default function MixedFeedHome({ publicMode = false, defaultTab = "for-you" }: MixedFeedHomeProps) {
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useSearchSafe();
  const [activeTab, setActiveTab] = useState<FeedTabValue>(defaultTab);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const { data: profileResponse } = useGetCurrentUserProfileQuery();
  const profile = profileResponse?.data;
  const isAuthenticated = !!profile;

  const mixedFeed = useMixedFeed(searchQuery);
  const {
    mixed,
    products,
    posts,
    trending,
    newsFeed,
    marketplace,
    isLoading,
    isError,
    refetch,
  } = mixedFeed;

  const activeItems = useMemo(() => {
    if (activeTab === "products") return products;
    if (activeTab === "discussions") return posts;
    if (activeTab === "trending") return trending;
    // reviews and deals show mixed for now (future: filter by post type)
    if (activeTab === "reviews" || activeTab === "deals") return mixed;
    return mixed;
  }, [activeTab, mixed, posts, products, trending]);

  const tabs = useMemo(
    () => [
      { value: "for-you" as const, label: "For You", count: mixed.length },
      { value: "trending" as const, label: "Trending", count: trending.length },
      { value: "products" as const, label: "Products", count: products.length },
      { value: "discussions" as const, label: "Discussions", count: posts.length },
      { value: "reviews" as const, label: "Reviews" },
      { value: "deals" as const, label: "Deals" },
    ],
    [mixed.length, posts.length, products.length, trending.length]
  );

  useEffect(() => {
    if (!isLoading && !isInitialLoadComplete) {
      const timer = setTimeout(() => setIsInitialLoadComplete(true), 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isInitialLoadComplete]);

  const shouldObserve =
    activeTab !== "products" &&
    newsFeed.hasNextPage &&
    !newsFeed.isLoading &&
    posts.length > 0 &&
    isInitialLoadComplete;

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && shouldObserve && !newsFeed.isFetchingNextPage) {
      newsFeed.fetchNextPage();
    }
  }, [inView, newsFeed, shouldObserve]);

  const handleCreatePostClick = () => {
    router.push(isAuthenticated ? "/main/create" : "/login");
  };

  const handleCategoryClick = (name: string) => {
    setSearchQuery(name);
    setActiveTab("products");
  };

  const showComposer = !publicMode || isAuthenticated;
  const hasAnyItems = activeItems.length > 0;

  const renderFeedItems = () => {
    if (isLoading) return <FeedSkeleton />;

    if (isError && !mixed.length && !products.length && !posts.length) {
      return (
        <ErrorState
          message="Failed to load the community marketplace feed. Please try again later."
          onRetry={refetch}
        />
      );
    }

    if (!hasAnyItems) {
      return (
        <div className="flex min-h-[47.4vh] items-center justify-center">
          <EmptyPostsState
            message={
              activeTab === "products"
                ? "No marketplace items available yet"
                : activeTab === "reviews"
                  ? "No reviews shared yet — be the first!"
                  : activeTab === "deals"
                    ? "No deals posted yet — share a find!"
                    : "No discussions available yet"
            }
            showCreateButton={isAuthenticated}
            onCreateClick={isAuthenticated ? handleCreatePostClick : undefined}
          />
        </div>
      );
    }

    if (activeTab === "products") {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {products.map((item) => (
            <ProductFeedCard key={item.id} item={item.raw} />
          ))}
        </div>
      );
    }

    return (
      <>
        <div className="space-y-6 min-h-[60.7vh]">
          {activeItems.map((item) => {
            if (item.type === "product") {
              return <ProductFeedCard key={item.id} item={item.raw} />;
            }

            return <Post key={item.id} post={item.raw} profile={profile} />;
          })}
        </div>

        {newsFeed.hasNextPage && posts.length > 0 && isInitialLoadComplete && (
          <div
            ref={ref}
            className="flex h-20 min-h-20 w-full flex-col items-center justify-center gap-2 py-4"
          >
            {newsFeed.isFetchingNextPage && (
              <>
                <Loader2 className="animate-spin text-white/60" size={24} />
                <div className="text-base text-white/60">Loading more discussions...</div>
              </>
            )}
          </div>
        )}

        {!newsFeed.hasNextPage && posts.length > 0 && (
          <div className="py-4 text-center text-base text-white/40">
            You are caught up
          </div>
        )}
      </>
    );
  };

  return (
    <div className="px-2 md:px-4 xl:px-10">
      {showComposer && (
        <div className="my-2 top-14 z-10">
          <div
            onClick={handleCreatePostClick}
            className="cursor-pointer rounded-2xl border border-white/10 bg-[#06133FBF] p-4 backdrop-blur-[17.5px] transition-all duration-300 hover:border-white/20"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-white/20">
                {profile?.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.display_name || "User"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-semibold text-white">
                    {(profile?.display_name || profile?.username || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white/60 transition-all duration-300 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/20">
                  <span className="text-base">Share a post, product question, or marketplace update</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCreatePostClick();
                  }}
                  className="flex items-center gap-2 text-white/60 transition-colors hover:text-white"
                >
                  <FiImage size={20} />
                  <span className="text-base">Media</span>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCreatePostClick();
                  }}
                  className="flex items-center gap-2 text-white/60 transition-colors hover:text-white"
                >
                  <FiLink size={20} />
                  <span className="text-base">Listing</span>
                </button>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCreatePostClick();
                }}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 font-medium text-white transition-all duration-300 hover:from-purple-600 hover:to-pink-600"
              >
                <FiEdit3 size={18} />
                <span className="text-nowrap text-sm md:text-base">Create</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mt-6 space-y-4">
        {/* Compact hero header */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#06133FBF] px-5 py-4 backdrop-blur-[17.5px]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
              Community Marketplace
            </p>
            <h1 className="mt-1 text-lg font-semibold text-white md:text-xl">
              Discover what people are listing &amp; discussing
            </h1>
          </div>
          {searchQuery && (
            <span className="ml-4 shrink-0 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
              &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        {/* Category chips — quick browse */}
        <CategoryChips onCategoryClick={handleCategoryClick} />

        <FeedTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="min-h-[calc(100vh-110px)]">{renderFeedItems()}</div>

        {marketplace.isError && !!posts.length && (
          <p className="pb-3 text-center text-sm text-white/40">
            Marketplace items could not load right now. Discussions are still available.
          </p>
        )}
      </section>
    </div>
  );
}
