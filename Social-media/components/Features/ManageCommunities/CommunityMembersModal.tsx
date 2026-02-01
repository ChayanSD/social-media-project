"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { 
  useGetCommunityMembersQuery,
  CommunityMemberItem 
} from "@/store/communityApi";
import { FiUsers, FiShield, FiUser } from "react-icons/fi";
import { getApiBaseUrl } from "@/lib/utils";
import CustomDialog from "@/components/ui/CustomDialog";

interface CommunityMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityName: string;
  communityTitle?: string;
}

const CommunityMembersModal: React.FC<CommunityMembersModalProps> = ({
  isOpen,
  onClose,
  communityName,
  communityTitle,
}) => {
  const { data: membersResponse, isLoading } = useGetCommunityMembersQuery(communityName, {
    skip: !isOpen || !communityName,
  });
  const apiBase = getApiBaseUrl();

  const members = useMemo(() => {
    if (!membersResponse) return [];
    const data = membersResponse.data ?? membersResponse.results?.data ?? [];
    return Array.isArray(data) ? data : [];
  }, [membersResponse]);

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

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <FiShield className="w-4 h-4 text-purple-400" />;
      case 'moderator':
        return <FiShield className="w-4 h-4 text-blue-400" />;
      default:
        return <FiUser className="w-4 h-4 text-white/60" />;
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
            Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Moderator
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/60 border border-white/20">
            Member
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Community Members"
      description={communityTitle || communityName}
      maxWidth="3xl"
      maxHeight="85vh"
      contentClassName="flex flex-col"
    >

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scroll p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse bg-white/5 rounded-lg border border-white/10 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-white/10" />
                      <div className="h-3 w-24 rounded bg-white/10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FiUsers className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white text-lg font-medium mb-2">No members yet</p>
              <p className="text-white/60 text-sm">
                This community doesn&apos;t have any members
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member: CommunityMemberItem) => {
                const avatar = member.user_avatar;
                const displayName = member.user_display_name || member.username || "Unknown User";
                const username = member.username || String(member.user);
                const role = member.role || 'member';
                
                return (
                  <div
                    key={member.id}
                    className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20 bg-white/10 flex items-center justify-center">
                        {avatar ? (
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
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{displayName}</p>
                            {getRoleIcon(role)}
                          </div>
                          {getRoleBadge(role)}
                        </div>
                        <p className="text-white/60 text-sm mb-1">@{username}</p>
                        <p className="text-white/40 text-xs">
                          Joined on {formatDate(member.joined_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-white/60 text-sm">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </CustomDialog>
  );
};

export default CommunityMembersModal;

