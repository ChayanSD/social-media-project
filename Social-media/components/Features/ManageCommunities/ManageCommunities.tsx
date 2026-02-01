"use client";

import React, { useMemo, useState } from "react";
import { useGetMyCommunitiesQuery, useDeleteCommunityMutation, useJoinCommunityMutation, useLeaveCommunityMutation, CommunityItem } from "@/store/communityApi";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import { FaUsers } from "react-icons/fa";
import { FiTrash2, FiUserPlus, FiUsers as FiUsersIcon, FiUserMinus, FiSettings } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CommunityCard from "../../Shared/CommunityCard/CommunityCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import JoinRequestsModal from "./JoinRequestsModal";
import CommunityMembersModal from "./CommunityMembersModal";
import InviteMemberModal from "./InviteMemberModal";
import PageHeader from '../../Shared/PageHeader/PageHeader';
import ErrorState from '../../Shared/ErrorState';

const ManageCommunities = () => {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [communityToDelete, setCommunityToDelete] = useState<CommunityItem | null>(null);
  const [joinRequestsModalOpen, setJoinRequestsModalOpen] = useState(false);
  const [selectedCommunityForRequests, setSelectedCommunityForRequests] = useState<CommunityItem | null>(null);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedCommunityForMembers, setSelectedCommunityForMembers] = useState<CommunityItem | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCommunityForInvite, setSelectedCommunityForInvite] = useState<CommunityItem | null>(null);
  const { data: communitiesResponse, isLoading, isError, refetch: refetchMyCommunities } = useGetMyCommunitiesQuery();
  const { data: currentUserResponse } = useGetCurrentUserProfileQuery();
  const [deleteCommunity, { isLoading: isDeleting }] = useDeleteCommunityMutation();
  const [joinCommunity, { isLoading: isJoining }] = useJoinCommunityMutation();
  const [leaveCommunity, { isLoading: isLeaving }] = useLeaveCommunityMutation();
  
  const currentUserId = useMemo(() => {
    return currentUserResponse?.data?.id || currentUserResponse?.id;
  }, [currentUserResponse]);

  const communities = useMemo(() => {
    if (!communitiesResponse) return [];
    return (
      communitiesResponse.data ??
      communitiesResponse.results?.data ??
      communitiesResponse.communities ??
      []
    );
  }, [communitiesResponse]);

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

  const handleDeleteClick = (community: CommunityItem) => {
    setCommunityToDelete(community);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!communityToDelete) return;

    const communityName = communityToDelete.name || communityToDelete.id?.toString() || "";
    
    try {
      await deleteCommunity(communityName).unwrap();
      toast.success("Community deleted successfully!", {
        description: `The community "${communityToDelete.title || communityToDelete.name || communityName}" has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setCommunityToDelete(null);
    } catch (error: unknown) {
      console.error('Error deleting community:', error);
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 
         ('message' in error.data || 'detail' in error.data))
          ? (error.data as { message?: string; detail?: string }).message || 
            (error.data as { message?: string; detail?: string }).detail
          : "Failed to delete community. Please try again.";
      
      toast.error("Error deleting community", {
        description: errorMessage || "Failed to delete community. Please try again.",
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCommunityToDelete(null);
  };

  const renderLoadingState = () => {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-[#06133FBF] backdrop-blur-md rounded-2xl border border-white/20 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 rounded bg-white/10" />
                <div className="h-4 w-full rounded bg-white/10" />
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="flex gap-4 mt-4">
                  <div className="h-4 w-20 rounded bg-white/10" />
                  <div className="h-4 w-20 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderErrorState = () => {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ErrorState
          message="Failed to load communities. Please try again later."
          onRetry={() => refetchMyCommunities()}
        />
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center">
              <FaUsers size={32} className="text-white/40" />
            </div>
          </div>
          <p className="text-white text-xl font-semibold mb-2">
            No communities yet
          </p>
          <p className="text-white/60 text-sm mb-6">
            You haven&apos;t created any communities. Start by creating your first community!
          </p>
          <button
            onClick={() => router.push("/main/create-community")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-medium transition-colors"
          >
            Create Community
          </button>
        </div>
      </div>
    );
  };

  const handleCardClick = (community: CommunityItem) => {
    const communityName = community.name || community.id?.toString() || "";
    if (communityName) {
      router.push(`/main/communities/${encodeURIComponent(communityName)}`);
    }
  };

  const handleViewJoinRequests = (community: CommunityItem) => {
    setSelectedCommunityForRequests(community);
    setJoinRequestsModalOpen(true);
  };

  const handleCloseJoinRequestsModal = () => {
    setJoinRequestsModalOpen(false);
    setSelectedCommunityForRequests(null);
  };

  const handleViewMembers = (community: CommunityItem) => {
    setSelectedCommunityForMembers(community);
    setMembersModalOpen(true);
  };

  const handleCloseMembersModal = () => {
    setMembersModalOpen(false);
    setSelectedCommunityForMembers(null);
  };

  const handleInviteMember = (community: CommunityItem) => {
    setSelectedCommunityForInvite(community);
    setInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
    setSelectedCommunityForInvite(null);
  };

  const handleJoin = async (communityName: string) => {
    try {
      await joinCommunity(communityName).unwrap();
      toast.success('Successfully joined community!');
    } catch (error: unknown) {
      console.error('Failed to join community:', error);
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 
         ('message' in error.data || 'detail' in error.data))
          ? (error.data as { message?: string; detail?: string }).message || 
            (error.data as { message?: string; detail?: string }).detail
          : "Failed to join community. Please try again.";
      
      toast.error('Failed to join community', {
        description: errorMessage || "Failed to join community. Please try again.",
      });
    }
  };

  const handleLeave = async (communityName: string) => {
    try {
      await leaveCommunity(communityName).unwrap();
      toast.success('Successfully left community!');
    } catch (error: unknown) {
      console.error('Failed to leave community:', error);
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 
         ('message' in error.data || 'detail' in error.data))
          ? (error.data as { message?: string; detail?: string }).message || 
            (error.data as { message?: string; detail?: string }).detail
          : "Failed to leave community. Please try again.";
      
      toast.error('Failed to leave community', {
        description: errorMessage || "Failed to leave community. Please try again.",
      });
    }
  };

  const renderCommunities = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2  2xl:grid-cols-3 gap-6">
        {communities.map((community) => (
          <CommunityCard
            key={community.id}
            community={community}
            variant="grid"
            showCreatedBy={false}
            formatDate={formatDate}
            onCardClick={() => handleCardClick(community)}
            actions={
              (() => {
                const isCreator = community.created_by === currentUserId || community.can_manage === true;
                const isMember = community.is_member === true;
                const communityName = community.name || community.id?.toString() || "";
                
                // Creator buttons
                if (isCreator) {
                  const isPrivate = community.visibility === 'private';
                  return (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMembers(community);
                          }}
                          className="flex-1 py-2.5 cursor-pointer rounded-lg font-medium transition-all bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 flex items-center justify-center gap-2"
                        >
                          <FiUsersIcon className="w-4 h-4" />
                          <span>Members</span>
                        </button>
                       {!isPrivate && <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewJoinRequests(community);
                          }}
                          className="flex-1 py-2.5 cursor-pointer rounded-lg font-medium transition-all bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 flex items-center justify-center gap-2"
                        >
                          <FiUserPlus className="w-4 h-4" />
                          <span>Requests</span>
                        </button>}
                        {isPrivate && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInviteMember(community);
                          }}
                          className=" p-2.5 cursor-pointer rounded-lg font-medium transition-all bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 flex items-center justify-center gap-2"
                        >
                          <FiUserPlus className="w-4 h-4" />
                          <span>Invite Member</span>
                        </button>
                      )}
                      </div>
                      
                      <div className="flex gap-2">
                   
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/main/edit-community/${encodeURIComponent(communityName)}`);
                          }}
                          className="flex-1 py-2.5 cursor-pointer rounded-lg font-medium transition-all bg-white/10 hover:bg-white/20 text-white border border-white/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(community);
                          }}
                          disabled={isDeleting}
                          className={`py-2.5 px-4 cursor-pointer rounded-lg font-medium transition-all bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                }
                
                // Normal user buttons - Join/Leave
                return (
                  <div className="flex gap-2">
                    {isMember ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (communityName) {
                            handleLeave(communityName);
                          }
                        }}
                        disabled={isLeaving}
                        className={`flex-1 py-2.5 cursor-pointer rounded-lg font-bold transition-all bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 flex items-center justify-center gap-2 ${isLeaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <FiUserMinus className="w-4 h-4" />
                        <span>Leave</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (communityName) {
                            handleJoin(communityName);
                          }
                        }}
                        disabled={isJoining}
                        className={`flex-1 py-2.5 cursor-pointer rounded-lg font-bold transition-all bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/30 flex items-center justify-center gap-2 ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <FiUserPlus className="w-4 h-4" />
                        <span>Join</span>
                      </button>
                    )}
                  </div>
                );
              })()
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
      <div className="page-container">
        {/* Header Section */}
        <PageHeader
          icon={<FiSettings className="w-8 h-8 text-white" />}
          title="Manage Communities"
          description="View and manage all communities you've created"
        />

        {isLoading && renderLoadingState()}
        {isError && renderErrorState()}
        {!isLoading && !isError && communities.length === 0 && renderEmptyState()}
        {!isLoading && !isError && communities.length > 0 && renderCommunities()}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Community"
        description={`Are you sure you want to delete "${communityToDelete?.title || communityToDelete?.name || 'this community'}"? This action cannot be undone and will permanently remove the community and all its content.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {selectedCommunityForRequests && (
        <JoinRequestsModal
          isOpen={joinRequestsModalOpen}
          onClose={handleCloseJoinRequestsModal}
          communityName={selectedCommunityForRequests.name || selectedCommunityForRequests.id?.toString() || ""}
          communityTitle={selectedCommunityForRequests.title || selectedCommunityForRequests.name}
        />
      )}

      {selectedCommunityForMembers && (
        <CommunityMembersModal
          isOpen={membersModalOpen}
          onClose={handleCloseMembersModal}
          communityName={selectedCommunityForMembers.name || selectedCommunityForMembers.id?.toString() || ""}
          communityTitle={selectedCommunityForMembers.title || selectedCommunityForMembers.name}
        />
      )}

      {selectedCommunityForInvite && (
        <InviteMemberModal
          isOpen={inviteModalOpen}
          onClose={handleCloseInviteModal}
          communityName={selectedCommunityForInvite.name || selectedCommunityForInvite.id?.toString() || ""}
          communityTitle={selectedCommunityForInvite.title || selectedCommunityForInvite.name}
        />
      )}
    </div>
  );
};

export default ManageCommunities;

