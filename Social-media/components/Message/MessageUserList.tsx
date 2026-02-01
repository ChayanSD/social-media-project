"use client";

import React, { useMemo, useState, useEffect } from "react";
import { AiOutlineMore } from "react-icons/ai";
import { MdBlock, MdReport } from "react-icons/md";
import Image from "next/image";
import {
  useGetConversationsListQuery,
  useSearchChatUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetBlockedUsersQuery,
  useReportUserMutation,
  useAcceptMessageRequestMutation,
  useRejectMessageRequestMutation,
  useCancelMessageRequestMutation,
  type ChatUser,
  type ConversationItem,
  type MessageRequest,
} from "@/store/chatApi";
import { getApiBaseUrl } from "@/lib/utils";
import ReportUserModal from "./ReportUserModal";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  avatar: string;
  username: string;
  email?: string;
  isOnline: boolean;
  lastSeen?: string;
  timestamp?: string;
  roomId?: number | string;
  iBlockedThem?: boolean;
  theyBlockedMe?: boolean;
}

interface MessageUserListProps {
  searchQuery: string;
  onUserSelect: (user: User) => void;
}

const MessageUserList = ({ searchQuery, onUserSelect }: MessageUserListProps) => {
  const apiBase = getApiBaseUrl();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<{ userId: string; username: string } | null>(null);
  const [viewingRequestId, setViewingRequestId] = useState<string | null>(null);

  // Use search if query exists, otherwise get conversations list
  const shouldSearch = searchQuery.trim().length >= 2;
  const { data: conversationsResponse, isLoading: isLoadingConversations, refetch: refetchConversations } = useGetConversationsListQuery(undefined, {
    skip: shouldSearch,
    refetchOnMountOrArgChange: true,
  });
  const { data: searchResponse, isLoading: isLoadingSearch } = useSearchChatUsersQuery(
    searchQuery.trim(),
    { skip: !shouldSearch }
  );
  const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
  const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();
  const { data: blockedUsersResponse } = useGetBlockedUsersQuery();
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptMessageRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectMessageRequestMutation();
  const [cancelRequest, { isLoading: isCancelling }] = useCancelMessageRequestMutation();

  const isLoading = isLoadingConversations || isLoadingSearch;

  const blockedUsers = useMemo(() => {
    if (!blockedUsersResponse?.data) return [];
    return blockedUsersResponse.data.map((b: { blocked_user_id?: number | string }) => String(b.blocked_user_id || ''));
  }, [blockedUsersResponse]);

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return 'just now';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const conversations = useMemo(() => {
    if (shouldSearch) {
      // For search, return users without conversation data
      if (!searchResponse) return [];
      const usersData = searchResponse.data ?? searchResponse.results?.data ?? searchResponse.users ?? [];
      return usersData.map((user: ChatUser) => ({
        id: String(user.id),
        name: user.display_name || user.username || "Unknown User",
        username: user.username || String(user.id),
        email: user.email || "",
        avatar: user.avatar || "/profile.jpg",
        isOnline: user.is_online || false,
        lastSeen: (user as { last_seen?: string }).last_seen,
        lastMessage: 'Click to start conversation',
        timestamp: '',
        unreadCount: 0,
        iBlockedThem: false,
        theyBlockedMe: false,
        pendingRequest: null,
        hasPendingRequest: false,
        isRequestReceiver: false,
      }));
    }

    // For conversations list, show users with last message and unread count
    if (!conversationsResponse) return [];
    const conversationsData = conversationsResponse.data ?? conversationsResponse.results?.data ?? conversationsResponse.conversations ?? [];

    return conversationsData.map((conversation: ConversationItem) => {
      const user = conversation.user || {} as ChatUser;
      const lastMessage = conversation.last_message || {} as { content?: string; created_at?: string };

      // Show blocked indicator in last message if blocked
      let displayMessage = lastMessage.content || 'No messages yet';
      if (conversation.i_blocked_them) {
        displayMessage = 'You blocked this user';
      } else if (conversation.they_blocked_me) {
        displayMessage = 'This user blocked you';
      }

      return {
        id: String(user.id || ''),
        name: user.display_name || user.username || "Unknown User",
        username: user.username || String(user.id),
        email: user.email || "",
        avatar: user.avatar || "/profile.jpg",
        isOnline: user.is_online || false,
        lastSeen: (user as { last_seen?: string }).last_seen,
        lastMessage: displayMessage,
        timestamp: formatTimestamp(lastMessage.created_at || conversation.last_message_time),
        unreadCount: conversation.unread_count || 0,
        iBlockedThem: conversation.i_blocked_them || false,
        theyBlockedMe: conversation.they_blocked_me || false,
        pendingRequest: conversation.pending_request,
        hasPendingRequest: conversation.has_pending_request || false,
        isRequestReceiver: conversation.is_request_receiver || false,
      };
    });
  }, [shouldSearch, conversationsResponse, searchResponse]);

  const handleUserClick = async (conversation: typeof conversations[0], e?: React.MouseEvent) => {
    // Don't trigger user selection if clicking on menu button, accept/reject buttons
    if ((e?.target as HTMLElement)?.closest('.user-menu-button') ||
      (e?.target as HTMLElement)?.closest('.user-menu-dropdown') ||
      (e?.target as HTMLElement)?.closest('.request-action-button')) {
      return;
    }

    // If it's a pending request (received or sent), toggle view
    if (conversation.hasPendingRequest) {
      if (viewingRequestId === String(conversation.pendingRequest?.id || '')) {
        setViewingRequestId(null);
      } else {
        setViewingRequestId(String(conversation.pendingRequest?.id || ''));
      }
      return;
    }

    // For direct messaging, we just need the user ID - no room creation needed
    onUserSelect({
      id: conversation.id,
      name: conversation.name,
      username: conversation.username,
      email: conversation.email || "",
      avatar: conversation.avatar,
      isOnline: conversation.isOnline,
      lastSeen: conversation.lastSeen,
      timestamp: conversation.timestamp,
    });
  };

  const handleAcceptRequest = async (requestId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await acceptRequest({ request_id: requestId }).unwrap();
      toast.success("Message request accepted! You can now message each other.");
      refetchConversations();
      setViewingRequestId(null);
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || "Failed to accept message request");
    }
  };

  const handleRejectRequest = async (requestId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await rejectRequest({ request_id: requestId }).unwrap();
      toast.success("Message request rejected.");
      refetchConversations();
      setViewingRequestId(null);
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || "Failed to reject message request");
    }
  };

  const handleCancelRequest = async (requestId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await cancelRequest({ request_id: requestId }).unwrap();
      toast.success("Message request cancelled.");
      refetchConversations();
      setViewingRequestId(null);
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || "Failed to cancel message request");
    }
  };

  const handleBlockUser = async (userId: string, username: string) => {
    if (isBlocking || isUnblocking) return;

    const isBlocked = blockedUsers.includes(userId);

    try {
      if (isBlocked) {
        await unblockUser({ user_id: userId }).unwrap();
        toast.success(`You have unblocked ${username}`);
      } else {
        await blockUser({ user_id: userId }).unwrap();
        toast.success(`You have blocked ${username}`);
      }
      setOpenMenuId(null);
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || 'Failed to block/unblock user');
    }
  };

  const handleReportUser = (userId: string, username: string) => {
    setOpenMenuId(null);
    setShowReportModal({ userId, username });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId && !target.closest('.user-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center px-4">
          <p className="text-sm">
            {searchQuery
              ? "No users found. Try a different search."
              : "No conversations yet. Start chatting with someone!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-y-auto custom-scroll">
        {conversations.map((conversation) => {
          const isBlocked = blockedUsers.includes(conversation.id);
          return (
            <div
              key={conversation.id}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 border-b border-gray-800 last:border-b-0 transition-colors group relative"
            >
              <button
                type="button"
                onClick={(e) => handleUserClick(conversation, e)}
                className="flex-1 flex items-center gap-3 text-left min-w-0"
              >
                <div className="relative h-9 w-9 flex-shrink-0">
                  <div className="h-9 w-9 rounded-full overflow-hidden border border-white/20 flex items-center justify-center bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79]">
                    {conversation.avatar && conversation.avatar !== "/profile.jpg" && !conversation.avatar.includes("profile.jpg") ? (
                      <Image
                        src={conversation.avatar.startsWith('http')
                          ? conversation.avatar
                          : `${apiBase}${conversation.avatar?.startsWith('/') ? conversation.avatar?.slice(1) : conversation.avatar}`}
                        alt={conversation.name}
                        width={36}
                        height={36}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-semibold">
                        {conversation.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#06133f] rounded-full z-10 ${conversation.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {conversation.name}
                    </p>
                    {conversation.timestamp && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {conversation.timestamp}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {conversation.hasPendingRequest && conversation.isRequestReceiver ? (
                      <div className="flex-1">
                        {viewingRequestId === String(conversation.pendingRequest?.id) ? (
                          <div className="space-y-2">
                            <p className="text-sm text-yellow-400 mb-2">
                              {conversation.pendingRequest?.content || "No message content"}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => handleAcceptRequest(conversation.pendingRequest!.id!, e)}
                                disabled={isAccepting || isRejecting}
                                className="request-action-button flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                {isAccepting ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                ) : (
                                  "Accept"
                                )}
                              </button>
                              <button
                                onClick={(e) => handleRejectRequest(conversation.pendingRequest!.id!, e)}
                                disabled={isAccepting || isRejecting}
                                className="request-action-button flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                {isRejecting ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                ) : (
                                  "Reject"
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-yellow-400">Message request:</span>
                            <p className="text-sm text-gray-600 truncate flex-1">
                              {conversation.pendingRequest?.content || conversation.lastMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : conversation.hasPendingRequest && !conversation.isRequestReceiver ? (
                      <div className="flex-1">
                        {viewingRequestId === String(conversation.pendingRequest?.id) ? (
                          <div className="space-y-2">
                            <p className="text-sm text-blue-400 mb-2">
                              {conversation.pendingRequest?.content || "No message content"}
                            </p>
                            <button
                              onClick={(e) => handleCancelRequest(conversation.pendingRequest!.id!, e)}
                              disabled={isCancelling}
                              className="request-action-button w-full px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              {isCancelling ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                              ) : (
                                "Cancel Request"
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-400">Request sent</span>
                            <p className="text-sm text-gray-600 truncate flex-1">
                              {conversation.pendingRequest?.content || conversation.lastMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {conversation.lastMessage}
                      </p>
                    )}
                    {conversation.unreadCount > 0 && (
                      <div className="bg-[#ff4500] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0 font-medium">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </div>
                    )}
                    {conversation.hasPendingRequest && conversation.isRequestReceiver && (
                      <div className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0 font-medium">
                        !
                      </div>
                    )}
                    {conversation.hasPendingRequest && !conversation.isRequestReceiver && (
                      <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0 font-medium">
                        ⏱
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Menu Button */}
              <div className="user-menu-container relative flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === conversation.id ? null : conversation.id);
                  }}
                  className="user-menu-button p-1.5 hover:bg-gray-700 rounded-full transition-colors text-white opacity-0 group-hover:opacity-100"
                >
                  <AiOutlineMore size={16} />
                </button>

                {/* Dropdown Menu */}
                {openMenuId === conversation.id && (
                  <div className="user-menu-dropdown absolute right-0 top-full mt-1 w-40 bg-[#06133f] border border-gray-700 rounded-lg shadow-xl z-50">
                    <button
                      onClick={() => handleBlockUser(conversation.id, conversation.name)}
                      disabled={isBlocking || isUnblocking}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg"
                    >
                      <MdBlock size={16} />
                      {isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      onClick={() => handleReportUser(conversation.id, conversation.name)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-800 transition-colors last:rounded-b-lg"
                    >
                      <MdReport size={16} />
                      Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportUserModal
          isOpen={!!showReportModal}
          onClose={() => setShowReportModal(null)}
          userId={showReportModal.userId}
          username={showReportModal.username}
        />
      )}
    </div>
  );
};

export default MessageUserList;


