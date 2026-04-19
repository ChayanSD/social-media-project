"use client";

import Image from 'next/image';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetPopularCommunitiesQuery,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
  CommunityItem
} from '@/store/communityApi';
import { useGetCategoriesQuery } from '@/store/categoryApi';
import { FiUsers, FiTag, FiEdit3, FiMessageCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import Link from 'next/link';
import { useGetCurrentUserProfileQuery } from '@/store/authApi';
import { useGetMarketplaceItemsQuery } from '@/store/marketplaceApi';
import ProductFeedCard from '../../Cards/ProductFeedCard';
import { useNewsFeedInfinite } from '@/hooks/useNewsFeedInfinite';

type InterestSubcategory = {
  id?: number | string;
  is_approved?: boolean;
};

type InterestCategory = {
  id: number | string;
  name: string;
  is_approved?: boolean;
  subcategories?: InterestSubcategory[];
};


const RightSidebar = () => {
  const router = useRouter();
  const { data: profileResponse } = useGetCurrentUserProfileQuery();
  const isAuthenticated = !!profileResponse?.data;
  const { data: communitiesResponse, isLoading } = useGetPopularCommunitiesQuery(undefined, {
    skip: false,
  });
  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const { data: marketplaceResponse, isLoading: isMarketplaceLoading } = useGetMarketplaceItemsQuery({ page: 1 });
  const [joinCommunity, { isLoading: isJoining }] = useJoinCommunityMutation();
  const [leaveCommunity, { isLoading: isLeaving }] = useLeaveCommunityMutation();

  const allCommunities = useMemo(() => {
    if (!communitiesResponse) return [];
    const data = communitiesResponse.results?.data ?? communitiesResponse.data ?? [];
    return Array.isArray(data) ? data : [];
  }, [communitiesResponse]);

  // Filter to only show public communities (and restricted for authenticated users)
  const communities = useMemo(() => {
    if (!isAuthenticated) {
      return allCommunities.filter((c: CommunityItem) => c.visibility === 'public').slice(0, 5);
    }
    return allCommunities.filter((c: CommunityItem) =>
      c.visibility === 'public' || c.visibility === 'restricted'
    ).slice(0, 5);
  }, [allCommunities, isAuthenticated]);

  const trendingProducts = useMemo(() => {
    const rawItems =
      marketplaceResponse?.data ??
      marketplaceResponse?.results?.data ??
      marketplaceResponse?.items ??
      [];

    return rawItems
      .filter((item) => {
        const status = String(item.status || "").toLowerCase();
        return !status || status === "published" || status === "approved";
      })
      .slice(0, 4);
  }, [marketplaceResponse]);

  // Get interest categories
  const categories = useMemo(() => {
    if (!categoriesResponse) return [];
    const data = (categoriesResponse.data || []) as InterestCategory[];
    // Filter to only show approved categories
    return data
      .filter((cat) => cat.is_approved === true)
      .slice(0, 5);
  }, [categoriesResponse]);

  const formatMembers = (members: number) => {
    if (members >= 100000) return '100k+';
    if (members >= 10000) return '10k+';
    if (members >= 1000) return '1k+';
    return members.toString();
  };

  const handleJoin = async (communityName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await joinCommunity(communityName).unwrap();
      toast.success('Successfully joined community!');
    } catch (error: unknown) {
      console.error('Failed to join community:', error);
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        'An error occurred';
      toast.error('Failed to join community', {
        description: errorMessage,
      });
    }
  };

  const handleLeave = async (communityName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await leaveCommunity(communityName).unwrap();
      toast.success('Successfully left community!');
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        'An error occurred';
      toast.error('Failed to leave community', {
        description: errorMessage,
      });
    }
  };

  /* ── Trending discussions (top 3 from news feed) ─────────── */
  const trendingFeed = useNewsFeedInfinite();
  const trendingDiscussions = useMemo(() => {
    const allPosts = trendingFeed.data?.posts || [];
    // Sort by likes_count descending, take top 3
    return [...allPosts]
      .sort((a, b) => ((b.likes_count as number) || 0) - ((a.likes_count as number) || 0))
      .slice(0, 3);
  }, [trendingFeed.data]);

  return (
    <div className='mt-24 space-y-6'>
      {/* Quick Create CTA */}
      {isAuthenticated && (
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/20 backdrop-blur-[1px] py-5 px-4 rounded-2xl">
          <h3 className="text-white font-semibold text-base mb-3">Share something</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/main/create-post')}
              className="w-full flex items-center gap-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all"
            >
              <FiEdit3 size={16} />
              <span>Write a Post</span>
            </button>
            <button
              onClick={() => router.push('/marketplace/promote')}
              className="w-full flex items-center gap-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all"
            >
              <FiTag size={16} />
              <span>List a Product</span>
            </button>
            <button
              onClick={() => router.push('/main/create-post?type=question')}
              className="w-full flex items-center gap-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all"
            >
              <FiMessageCircle size={16} />
              <span>Ask a Question</span>
            </button>
          </div>
        </div>
      )}

      <div className='bg-[#06133FBF] backdrop-blur-[1px] py-6 px-4 rounded-2xl space-y-4 '>
        <div className="flex items-center justify-between gap-3">
          <h1 className='text-white text-xl font-semibold'>Trending Products</h1>
          <Link href="/marketplace" className="text-sm text-white/50 hover:text-white">
            View
          </Link>
        </div>
        {isMarketplaceLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="animate-pulse flex gap-3">
                <div className="h-20 w-20 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-white/10" />
                  <div className="h-3 w-20 rounded bg-white/10" />
                  <div className="h-3 w-24 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : trendingProducts.length === 0 ? (
          <p className="text-white/60 text-base text-center py-4">No products available</p>
        ) : (
          <div className="space-y-3">
            {trendingProducts.map((product) => (
              <ProductFeedCard key={product.id} item={product} compact />
            ))}
          </div>
        )}
      </div>
      <div className='bg-[#06133FBF] backdrop-blur-[1px] py-6 px-4 rounded-2xl space-y-4 '>
        <h1 className='text-white text-xl font-semibold'>Popular Communities</h1>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="animate-pulse flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-white/10" />
                  <div className="h-3 w-16 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <p className="text-white/60 text-base  text-center py-4">No communities available</p>
        ) : (
          communities.slice(0, 5).map((community: CommunityItem) => {
            const iconUrl = community.icon || community.profile_image
              ? `${(community.icon || community.profile_image)?.startsWith("/") ? (community.icon || community.profile_image)?.slice(1) : (community.icon || community.profile_image)}`
              : null;

            return (
              <div
                key={community.id}
                className='flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity'
                onClick={() => router.push(`/main/communities/${encodeURIComponent(community.name || '')}`)}
              >
                <div className='flex items-center gap-2 flex-1 min-w-0'>
                  {iconUrl ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={iconUrl}
                        alt={community.title || community.name || ''}
                        fill
                        className='object-cover'
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <FiUsers className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className='text-white text-base font-semibold truncate'>{community.title || community.name}</h3>
                    <p className='text-gray-400 text-sm'>{formatMembers(community.members_count || 0)} Members</p>
                  </div>
                </div>
                {isAuthenticated ? (
                  <button
                    onClick={(e) => {
                      if (community.is_member) {
                        handleLeave(community.name!, e);
                      } else {
                        handleJoin(community.name!, e);
                      }
                    }}
                    disabled={isJoining || isLeaving}
                    className='text-white px-4 py-2 hover:text-slate-400 duration-300 ease-in-out cursor-pointer text-base disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {community.is_member ? 'Joined' : 'Join'}
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/login');
                    }}
                    className='text-white px-4 py-2 hover:text-slate-400 duration-300 ease-in-out cursor-pointer text-base'
                  >
                    Join
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* Trending Discussions */}
      <div className='bg-[#06133FBF] backdrop-blur-[1px] py-6 px-4 rounded-2xl space-y-4'>
        <div className="flex items-center justify-between gap-3">
          <h1 className='text-white text-xl font-semibold'>Trending Discussions</h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white">View</Link>
        </div>
        {trendingFeed.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="animate-pulse space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : trendingDiscussions.length === 0 ? (
          <p className="text-white/60 text-base text-center py-4">No discussions yet</p>
        ) : (
          <div className="space-y-3">
            {trendingDiscussions.map((post) => (
              <Link
                key={post.id}
                href={`/main/post/${post.id}`}
                className="block rounded-xl p-3 hover:bg-white/5 transition-all group"
              >
                <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {post.title || 'Untitled post'}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-white/50">
                  <span>{post.user_name || post.author?.name || 'Someone'}</span>
                  <span className="flex items-center gap-1">
                    ♥ {post.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    💬 {post.comments_count || 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className='bg-[#06133FBF] backdrop-blur-[1px] py-6 px-4 rounded-2xl space-y-4 '>
        <h1 className='text-white text-xl font-semibold'>Popular Categories</h1>
        {isCategoriesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="animate-pulse flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-white/10" />
                  <div className="h-3 w-16 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-white/60 text-center py-4">No categories available</p>
        ) : (
          categories.map((category) => {
            const approvedSubcategories = category.subcategories?.filter((sub) => sub.is_approved === true) || [];
            const subcategoryCount = approvedSubcategories.length;
            return (
              <Link
                key={category.id}
                href="/main/join-categories"
                className='flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity group'
              >
                <div className='flex items-center gap-2 flex-1 min-w-0'>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <FiTag className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className='text-white text-base font-semibold truncate'>{category.name}</h3>
                    <p className='text-gray-400 text-sm'>
                      {subcategoryCount} {subcategoryCount === 1 ? 'interest' : 'interests'}
                    </p>
                  </div>
                </div>
                <span className='text-white/60 text-sm group-hover:text-white transition-colors'>
                  View
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
