"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Sparkles, TrendingUp, Users } from "lucide-react";
import { useGetMarketplaceCategoriesQuery } from "@/store/marketplaceApi";
import { useGetPopularCommunitiesQuery } from "@/store/communityApi";
import MixedFeedHome from "./MixedFeedHome";

export default function ExploreHome() {
  const { data: categoriesRes } = useGetMarketplaceCategoriesQuery();
  const { data: communitiesRes } = useGetPopularCommunitiesQuery();

  const categories = useMemo(() => {
    const raw = categoriesRes?.data ?? categoriesRes?.results?.data ?? [];
    return raw.slice(0, 6);
  }, [categoriesRes]);

  const communities = useMemo(() => {
    const raw = communitiesRes?.results?.data ?? communitiesRes?.data ?? [];
    return Array.isArray(raw) ? raw.slice(0, 4) : [];
  }, [communitiesRes]);

  return (
    <div className="space-y-4 px-2 md:px-4 xl:px-10">
      {/* ── Hero ────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#06133F] via-[#0d1d5c] to-purple-900/40 p-6 md:p-8 backdrop-blur-[17.5px]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-purple-400" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-purple-300">
              Community Marketplace
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            Discover, Discuss, Trade
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-white/60">
            Browse marketplace products, join community discussions, and discover what people are sharing.
          </p>

          {/* Quick action buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/main/communities"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              <Users size={16} /> Browse Communities
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-purple-600 hover:to-pink-600"
            >
              <TrendingUp size={16} /> Trending Products
            </Link>
          </div>
        </div>
      </div>

      {/* ── Category chips ──────────────────────────── */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/marketplace?category=${encodeURIComponent(cat.name)}`}
              className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-purple-400/40 hover:bg-purple-500/10 hover:text-white"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* ── Community preview strip ─────────────────── */}
      {communities.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {communities.map((comm) => (
            <Link
              key={comm.id}
              href={`/main/communities/${encodeURIComponent(comm.name || "")}`}
              className="group flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-[#06133FBF] px-4 py-2 transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {(comm.title || comm.name || "C")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate max-w-[120px]">
                  {comm.title || comm.name}
                </p>
                <p className="text-xs text-white/50">
                  {comm.members_count || 0} members
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Mixed Feed ──────────────────────────────── */}
      <div className="-mx-2 md:-mx-4 xl:-mx-10">
        <MixedFeedHome publicMode defaultTab="products" />
      </div>
    </div>
  );
}
