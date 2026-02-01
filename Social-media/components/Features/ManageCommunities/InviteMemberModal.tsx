"use client";

import React, { useState, useMemo } from 'react';
import { FiSearch, FiUser, FiUserPlus } from 'react-icons/fi';
import Image from 'next/image';
import { useGetChatUsersQuery, useSearchChatUsersQuery, type ChatUser } from '@/store/chatApi';
import { useInviteUserToCommunityMutation, useGetCommunityMembersQuery } from '@/store/communityApi';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import CustomDialog from '@/components/ui/CustomDialog';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityName: string;
  communityTitle?: string;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  communityName,
  communityTitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteUser, { isLoading: isInviting }] = useInviteUserToCommunityMutation();
  const apiBase = getApiBaseUrl();

  const shouldSearch = searchQuery.trim().length >= 2;
  const { data: chatUsersResponse } = useGetChatUsersQuery(undefined, { skip: shouldSearch || !isOpen });
  const { data: searchResponse } = useSearchChatUsersQuery(searchQuery.trim(), { skip: !shouldSearch || !isOpen });
  const { data: membersResponse } = useGetCommunityMembersQuery(communityName, {
    skip: !isOpen || !communityName,
  });

  // Get list of existing member IDs to exclude from search
  const existingMemberIds = useMemo(() => {
    if (!membersResponse) return new Set<number | string>();
    const data = membersResponse.data ?? membersResponse.results?.data ?? [];
    return new Set(data.map((member: { user: number | string }) => String(member.user)));
  }, [membersResponse]);

  const users = useMemo(() => {
    const response = shouldSearch ? searchResponse : chatUsersResponse;
    if (!response) return [];
    const usersData = response.data ?? response.results?.data ?? response.users ?? [];
    // Filter out users who are already members
    return usersData.filter((user: ChatUser) => !existingMemberIds.has(String(user.id)));
  }, [shouldSearch, chatUsersResponse, searchResponse, existingMemberIds]);

  const handleInvite = async (userId: number | string) => {
    try {
      await inviteUser({
        community: communityName,
        user_id: userId,
      }).unwrap();
      toast.success('Invitation sent successfully!', {
        description: 'The user will be notified of the invitation.',
      });
      setSearchQuery('');
    } catch (error: unknown) {
      console.error('Failed to invite user:', error);
      const errorMessage =
        (error && typeof error === 'object' && 'data' in error &&
          error.data && typeof error.data === 'object' &&
          ('message' in error.data || 'detail' in error.data || 'error' in error.data))
          ? (error.data as { message?: string; detail?: string; error?: string }).message ||
          (error.data as { message?: string; detail?: string; error?: string }).detail ||
          (error.data as { message?: string; detail?: string; error?: string }).error
          : "Failed to send invitation. Please try again.";

      toast.error('Failed to send invitation', {
        description: errorMessage || "Failed to send invitation. Please try again.",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Invite Member"
      description={communityTitle || communityName}
      maxWidth="3xl"
      maxHeight="85vh"
      contentClassName="flex flex-col"
    >

      {/* Search */}
      <div className="p-6 border-b border-white/10">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-white pl-10 pr-4 py-2.5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/5 placeholder-white/40"
            />
          </div>
          {!shouldSearch && (
            <p className="text-white/40 text-xs mt-2">
              Start typing to search for users (minimum 2 characters)
            </p>
          )}
        </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto custom-scroll p-6">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FiUser className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white text-lg font-medium mb-2">
                {searchQuery.trim().length >= 2 ? 'No users found' : 'Search for users'}
              </p>
              <p className="text-white/60 text-sm text-center">
                {searchQuery.trim().length >= 2
                  ? 'Try a different search term'
                  : 'Type at least 2 characters to search for users to invite'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user: ChatUser) => {
                const avatar = user.avatar;
                const displayName = user.display_name || user.username || "Unknown User";
                const username = user.username || String(user.id);

                return (
                  <div
                    key={user.id}
                    className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20 bg-white/10 flex items-center justify-center">
                        {avatar && avatar !== "/profile.jpg" && !avatar.includes("profile.jpg") ? (
                          <Image
                            src={
                              avatar.startsWith("http")
                                ? avatar
                                : `${apiBase}${avatar.startsWith("/") ? avatar.slice(1) : avatar}`
                            }
                            alt={displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <FiUser className="w-6 h-6 text-white/60" />
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{displayName}</p>
                        <p className="text-white/60 text-sm truncate">@{username}</p>
                      </div>

                      {/* Invite Button */}
                      <button
                        onClick={() => handleInvite(user.id)}
                        disabled={isInviting}
                        className={`px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 ${isInviting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <FiUserPlus className="w-4 h-4" />
                        Invite
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </CustomDialog>
  );
};

export default InviteMemberModal;

