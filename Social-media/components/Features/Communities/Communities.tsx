"use client";
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useGetPopularCommunitiesQuery, 
  useJoinCommunityMutation, 
  useLeaveCommunityMutation,
  useCancelJoinRequestMutation,
  useGetInvitationsQuery,
  useAcceptInvitationMutation,
  useRejectInvitationMutation,
  CommunityItem
} from '@/store/communityApi';
import { FiSearch, FiFilter, FiUserPlus, FiUserMinus, FiCheck, FiX } from 'react-icons/fi';
import FriendsIcon from '../../Icons/FriendsIcon';
import { toast } from 'sonner';
import CommunityCard from '../../Shared/CommunityCard/CommunityCard';
import PageHeader from '../../Shared/PageHeader/PageHeader';
import ErrorState from '../../Shared/ErrorState';

const Communities = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: communitiesResponse, isLoading, isError, refetch } = useGetPopularCommunitiesQuery();
  const [joinCommunity, { isLoading: isJoining }] = useJoinCommunityMutation();
  const [leaveCommunity, { isLoading: isLeaving }] = useLeaveCommunityMutation();
  const [cancelJoinRequest, { isLoading: isCanceling }] = useCancelJoinRequestMutation();
  const { data: invitationsResponse } = useGetInvitationsQuery();
  const [acceptInvitation, { isLoading: isAccepting }] = useAcceptInvitationMutation();
  const [rejectInvitation, { isLoading: isRejecting }] = useRejectInvitationMutation();

  const allCommunities = useMemo(() => {
    if (!communitiesResponse) return [];
    const data = communitiesResponse.results?.data ?? communitiesResponse.data ?? [];
    return Array.isArray(data) ? data : [];
  }, [communitiesResponse]);

  // Get pending invitations
  const pendingInvitations = useMemo(() => {
    if (!invitationsResponse) return [];
    const data = invitationsResponse.data ?? invitationsResponse.results ?? [];
    return Array.isArray(data) ? data.filter((inv: { status?: string }) => inv.status === 'pending') : [];
  }, [invitationsResponse]);

  // Create a map of community name to invitation ID
  const invitationMap = useMemo(() => {
    const map: Record<string, { id: number | string; community_name?: string }> = {};
    pendingInvitations.forEach((inv: { community_name?: string; community?: string | number; id?: number | string }) => {
      const commName = inv.community_name || String(inv.community);
      if (commName && inv.id) {
        map[commName] = { id: inv.id, community_name: commName };
      }
    });
    return map;
  }, [pendingInvitations]);

  // Show all communities user can view (public, restricted, private communities user is member of, or has pending invitation)
  const communities = useMemo(() => {
    return allCommunities.filter((c: CommunityItem) => {
      // Show public and restricted communities (everyone can view)
      if (c.visibility === 'public' || c.visibility === 'restricted') {
        return true;
      }
      // Show private communities if user is a member OR has pending invitation
      if (c.visibility === 'private') {
        const hasInvitation = (c as { user_has_pending_invitation?: boolean }).user_has_pending_invitation || 
                              invitationMap[c.name || ''] !== undefined;
        return c.is_member === true || hasInvitation;
      }
      return false;
    });
  }, [allCommunities, invitationMap]);

  const filteredCommunities = useMemo(() => {
    if (!searchQuery.trim()) return communities;
    const query = searchQuery.toLowerCase();
    return communities.filter((community: CommunityItem) => 
      community.name?.toLowerCase().includes(query) ||
      community.title?.toLowerCase().includes(query) ||
      community.description?.toLowerCase().includes(query)
    );
  }, [communities, searchQuery]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleJoin = async (communityName: string) => {
    try {
      await joinCommunity(communityName).unwrap();
      refetch();
      
      // Check if it's a join request or direct join
      const community = allCommunities.find((c: CommunityItem) => c.name === communityName);
      if (community?.visibility === 'public') {
        toast.success('Successfully joined community!');
      } else {
        toast.success('Join request sent! Waiting for approval.');
      }
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

  const handleLeave = async (communityName: string) => {
    try {
      await leaveCommunity(communityName).unwrap();
      refetch();
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

  const handleCancelRequest = async (communityName: string) => {
    try {
      await cancelJoinRequest(communityName).unwrap();
      refetch();
      toast.success('Join request cancelled successfully!');
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'An error occurred';
      toast.error('Failed to cancel join request', {
        description: errorMessage,
      });
    }
  };

  const handleAcceptInvitation = async (invitationId: number | string) => {
    try {
      await acceptInvitation(invitationId).unwrap();
      refetch();
      toast.success('Invitation accepted! You are now a member.');
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'An error occurred';
      toast.error('Failed to accept invitation', {
        description: errorMessage,
      });
    }
  };

  const handleRejectInvitation = async (invitationId: number | string) => {
    try {
      await rejectInvitation(invitationId).unwrap();
      refetch();
      toast.success('Invitation declined');
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'An error occurred';
      toast.error('Failed to reject invitation', {
        description: errorMessage,
      });
    }
  };


  const renderLoadingState = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-white/5 rounded-xl border border-white/10 p-6"
          >
            <div className="h-32 bg-white/10 rounded-lg mb-4" />
            <div className="h-12 w-12 rounded-full bg-white/10 mb-4" />
            <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
            <div className="h-4 w-full bg-white/10 rounded mb-2" />
            <div className="h-4 w-2/3 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  };

  const renderErrorState = () => {
    return (
      
          <ErrorState
            message="Failed to load communities. Please try again later."
            onRetry={() => refetch()} 
          />
     
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mx-auto mb-4 opacity-50 w-16 h-16">
            <FriendsIcon />
          </div>
          <p className="text-white/60 text-lg">No communities found</p>
          <p className="text-white/40 text-sm mt-2">
            {searchQuery ? 'Try adjusting your search query' : 'Be the first to create a community!'}
          </p>
        </div>
      </div>
    );
  };

  const renderCommunitiesGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2  2xl:grid-cols-3 gap-6">
      {filteredCommunities.map((community: CommunityItem) => {
        const isMember = community.is_member === true;
        const hasPendingRequest = (community as { user_has_pending_request?: boolean }).user_has_pending_request;
        const hasPendingInvitation = (community as { user_has_pending_invitation?: boolean }).user_has_pending_invitation || 
                                     invitationMap[community.name || ''] !== undefined;
        const invitationId = invitationMap[community.name || '']?.id;
        
        return (
          <CommunityCard
            key={community.id}
            community={community}
            variant="grid"
            onCardClick={isMember ? () => router.push(`/main/communities/${community.name}`) : undefined}
            showCreatedBy={true}
            formatDate={formatDate}
            actions={
              community.name ? (
                <div className="flex gap-2">
                  {isMember ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/main/communities/${community.name}`);
                        }}
                        className="flex-1 py-2.5 rounded-lg font-medium transition-all bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        View Posts
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeave(community.name!);
                        }}
                        disabled={isLeaving}
                        className={`flex-1 py-2.5 rounded-lg font-bold transition-all bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 flex items-center justify-center gap-2 ${isLeaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <FiUserMinus className="w-4 h-4" />
                        <span>Leave</span>
                      </button>
                    </>
                  ) : community.visibility === 'private' && hasPendingInvitation && invitationId ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptInvitation(invitationId);
                        }}
                        disabled={isAccepting || isRejecting}
                        className={`flex-1 py-2.5 rounded-lg font-bold transition-all bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/30 flex items-center justify-center gap-2 ${(isAccepting || isRejecting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <FiCheck className="w-4 h-4" />
                        <span>{isAccepting ? 'Accepting...' : 'Accept'}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectInvitation(invitationId);
                        }}
                        disabled={isAccepting || isRejecting}
                        className={`flex-1 py-2.5 rounded-lg font-bold transition-all bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 flex items-center justify-center gap-2 ${(isAccepting || isRejecting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <FiX className="w-4 h-4" />
                        <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasPendingRequest) {
                          handleCancelRequest(community.name!);
                        } else {
                          handleJoin(community.name!);
                        }
                      }}
                      disabled={isJoining || isCanceling}
                      className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${
                        hasPendingRequest
                          ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 border border-orange-500/30'
                          : 'bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/30'
                      } ${(isJoining || isCanceling) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex items-center justify-center gap-2`}
                    >
                      {hasPendingRequest ? (
                        <span>{isCanceling ? 'Canceling...' : 'Pending'}</span>
                      ) : (
                        <>
                          <FiUserPlus className="w-4 h-4" />
                          <span>{community.visibility === 'public' ? 'Join' : 'Request to Join'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );

  return (
    <>
        <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
          <div className="page-container">
            {/* Header Section */}
            <PageHeader
              icon={
                <div className="w-8 h-8">
                  <FriendsIcon />
                </div>
              }
              title="Explore Communities"
              description="Discover and join communities that match your interests. Connect with like-minded people and share your passions."
            />

            {/* Search and Filter Bar */}
            <div className="mb-8 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search communities by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-white/40"
                />
              </div>
              <button className="flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all">
                <FiFilter className="w-5 h-5" />
                <span>Filter</span>
              </button>
            </div>

            {/* Communities Grid */}
            {isLoading && renderLoadingState()}
            {isError && renderErrorState()}
            {!isLoading && !isError && filteredCommunities.length === 0 && renderEmptyState()}
            {!isLoading && !isError && filteredCommunities.length > 0 && renderCommunitiesGrid()}

            {/* Create Community CTA */}
            {!isLoading && !isError && (
              <div className="mt-12 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl border border-blue-500/30 p-6 md:p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-3">Want to Create Your Own Community?</h3>
                <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                  Start your own community and bring people together around shared interests, hobbies, or causes.
                </p>
                <button 
                  onClick={() => router.push('/main/create-community')}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg"
                >
                  Create Community
                </button>
              </div>
            )}
          </div>
        </div>
    </>
  );
};

export default Communities;
