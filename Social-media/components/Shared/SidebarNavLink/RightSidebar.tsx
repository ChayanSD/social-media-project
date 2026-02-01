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
import { FiUsers, FiTag } from 'react-icons/fi';
import { toast } from 'sonner';
import Link from 'next/link';
import { getStoredAccessToken } from '@/lib/auth';

const RightSidebar = () => {
  const router = useRouter();
  const token = getStoredAccessToken();
  const { data: communitiesResponse, isLoading } = useGetPopularCommunitiesQuery(undefined, {
    skip: false, // Allow unauthenticated users to see communities
  });
  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const [joinCommunity, { isLoading: isJoining }] = useJoinCommunityMutation();
  const [leaveCommunity, { isLoading: isLeaving }] = useLeaveCommunityMutation();

  const allCommunities = useMemo(() => {
    if (!communitiesResponse) return [];
    const data = communitiesResponse.results?.data ?? communitiesResponse.data ?? [];
    return Array.isArray(data) ? data : [];
  }, [communitiesResponse]);

  // Filter to only show public communities (and restricted for authenticated users)
  const communities = useMemo(() => {
    if (!token) {
      // For unauthenticated users, only show public communities
      return allCommunities.filter((c: CommunityItem) => c.visibility === 'public').slice(0, 5);
    }
    // For authenticated users, show public and restricted
    return allCommunities.filter((c: CommunityItem) => 
      c.visibility === 'public' || c.visibility === 'restricted'
    ).slice(0, 5);
  }, [allCommunities, token]);

  // Get interest categories
  const categories = useMemo(() => {
    if (!categoriesResponse) return [];
    const data = categoriesResponse.data || [];
    return Array.isArray(data) ? data.slice(0, 5) : [];
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

  return (
        <div className='mt-24 space-y-6'>
            <div className='bg-[#06133FBF] backdrop-blur-[1px] py-6 px-4 rounded-2xl space-y-4 '>
                <h1 className='text-white text-lg font-semibold'>Popular Communities</h1>
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
                  <p className="text-white/60 text-sm text-center py-4">No communities available</p>
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
                            <h3 className='text-white text-sm font-semibold truncate'>{community.title || community.name}</h3>
                            <p className='text-gray-400 text-xs'>{formatMembers(community.members_count || 0)} Members</p>
                          </div>
                        </div>
                        {token ? (
                          <button 
                            onClick={(e) => {
                              if (community.is_member) {
                                handleLeave(community.name!, e);
                              } else {
                                handleJoin(community.name!, e);
                              }
                            }}
                            disabled={isJoining || isLeaving}
                            className='text-white px-4 py-2 hover:text-slate-400 duration-300 ease-in-out cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                          >
                            {community.is_member ? 'Joined' : 'Join'}
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/auth/login');
                            }}
                            className='text-white px-4 py-2 hover:text-slate-400 duration-300 ease-in-out cursor-pointer text-sm'
                          >
                            Join
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
            </div>
            <div className='bg-[#06133FBF] backdrop-blur-[1px] py-6 px-4 rounded-2xl space-y-4 '>
                <h1 className='text-white text-lg font-semibold'>Popular Categories</h1>
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
                  <p className="text-white/60 text-sm text-center py-4">No categories available</p>
                ) : (
                  categories.slice(0, 5).map((category) => {
                    const subcategoryCount = category.subcategories?.length || 0;
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
                            <h3 className='text-white text-sm font-semibold truncate'>{category.name}</h3>
                            <p className='text-gray-400 text-xs'>
                              {subcategoryCount} {subcategoryCount === 1 ? 'interest' : 'interests'}
                            </p>
                          </div>
                        </div>
                        <span className='text-white/60 text-xs group-hover:text-white transition-colors'>
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