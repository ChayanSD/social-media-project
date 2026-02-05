"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AiOutlineArrowLeft, AiOutlineMore } from 'react-icons/ai';
import { MdBlock, MdReport } from 'react-icons/md';
import Image from 'next/image';
import MessageBubble from './MessageBubble';
import { PiPaperPlaneRightFill } from 'react-icons/pi';
import { useGetConversationQuery, useSendDirectMessageMutation, useBlockUserMutation, useUnblockUserMutation, useGetBlockedUsersQuery, useUpdateDirectMessageMutation, useDeleteDirectMessageMutation, useAcceptMessageRequestMutation, useRejectMessageRequestMutation, useCancelMessageRequestMutation, useToggleReactionMutation, chatApi, type MessageRequest } from '@/store/chatApi';
import { useGetCurrentUserProfileQuery } from '@/store/authApi';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { store } from '@/store/store';
import { getApiBaseUrl } from '@/lib/utils';
import ReportUserModal from './ReportUserModal';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  avatar: string;
  username: string;
  email?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface ConversationViewProps {
  user: User;
  onBack: () => void;
}

const ConversationView = ({ user, onBack }: ConversationViewProps) => {
  const apiBase = useMemo(() => getApiBaseUrl(), []);
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => String(user.id), [user.id]);
  const { data: currentUser } = useGetCurrentUserProfileQuery();
  const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
  const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();
  const { data: blockedUsersResponse } = useGetBlockedUsersQuery(undefined, {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  const blockedUsers = useMemo(() => {
    if (!blockedUsersResponse?.data) return [];
    return blockedUsersResponse.data.map((b: { blocked_user_id?: number | string }) => String(b.blocked_user_id || ''));
  }, [blockedUsersResponse?.data]);

  const isBlocked = useMemo(() => {
    return blockedUsers.includes(String(userId));
  }, [blockedUsers, userId]);

  const formatLastSeen = useCallback((lastSeenString: string) => {
    if (!lastSeenString) return 'recently';
    const lastSeen = new Date(lastSeenString);
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return lastSeen.toLocaleDateString([], { month: 'short', day: 'numeric', year: lastSeen.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }, []);

  const { data: messagesResponse, isLoading: isLoadingMessages, refetch: refetchConversation } = useGetConversationQuery(
    userId,
    {
      skip: !userId,
      refetchOnMountOrArgChange: true, // Only refetch when userId changes
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );
  const [sendDirectMessage, { isLoading: isSending }] = useSendDirectMessageMutation();
  const [updateMessage, { isLoading: isUpdatingMessage }] = useUpdateDirectMessageMutation();
  const [deleteMessage, { isLoading: isDeletingMessage }] = useDeleteDirectMessageMutation();
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptMessageRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectMessageRequestMutation();
  const [cancelRequest, { isLoading: isCancelling }] = useCancelMessageRequestMutation();
  const [toggleReaction, { isLoading: isReacting }] = useToggleReactionMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = useMemo(() => {
    return currentUser?.data?.id || currentUser?.id || currentUser?.user?.id;
  }, [currentUser]);

  // Get user info and block status from response
  const userInfo = useMemo(() => {
    if (!messagesResponse) return null;
    return (messagesResponse as { user?: { is_online?: boolean; last_seen?: string;[key: string]: unknown } }).user;
  }, [messagesResponse]);

  const blockStatus = useMemo(() => {
    if (!messagesResponse) return { i_blocked_them: false, they_blocked_me: false };
    return (messagesResponse as { block_status?: { i_blocked_them?: boolean; they_blocked_me?: boolean } }).block_status || { i_blocked_them: false, they_blocked_me: false };
  }, [messagesResponse]);

  // Get message request info from response
  const messageRequestInfo = useMemo(() => {
    if (!messagesResponse) return null;
    const response = messagesResponse as {
      pending_request?: MessageRequest;
      has_pending_request?: boolean;
      is_request_receiver?: boolean;
    };
    if (response.has_pending_request) {
      return {
        request: response.pending_request,
        isReceiver: response.is_request_receiver || false,
      };
    }
    return null;
  }, [messagesResponse]);

  // Update user online status and last seen from API response
  // Only update when userInfo actually changes
  const updatedUser = useMemo(() => {
    if (userInfo) {
      const isOnline = userInfo.is_online || false;
      const lastSeen = userInfo.last_seen;

      // Only create new object if values actually changed
      if (user.isOnline !== isOnline || user.lastSeen !== lastSeen) {
        return {
          ...user,
          isOnline,
          lastSeen,
        };
      }
    }
    return user;
  }, [user, userInfo?.is_online, userInfo?.last_seen]);

  // Memoize the onMessage callback to prevent WebSocket reconnection
  // Use refs to avoid recreating the callback
  const userIdRef = useRef(userId);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    userIdRef.current = userId;
    currentUserIdRef.current = currentUserId;
  }, [userId, currentUserId]);

  const handleWebSocketMessage = useCallback((data: {
    type: string;
    room?: number | string;
    message?: {
      id: number | string;
      room?: number | string;
      sender?: {
        id: number | string;
        username?: string;
        display_name?: string;
        avatar?: string;
        is_online?: boolean;
      };
      content?: string;
      created_at?: string;
      is_read?: boolean;
      sender_id?: number | string;
      receiver_id?: number | string;
    };
    [key: string]: unknown;
  }) => {
    // Invalidate messages to refetch when new message or reaction arrives via WebSocket
    if ((data.type === 'message' || data.type === 'message_reaction')) {
      // For reactions, we have data.reaction.message_id
      // Extract sender_id and receiver_id from message (could be in sender object or directly)
      const reaction = data.reaction as { message_id?: number | string; user_id?: number | string } | undefined;
      const message = data.message;

      const senderId = message?.sender_id || message?.sender?.id || reaction?.user_id;
      const receiverId = message?.receiver_id;
      const currentUserIdValue = currentUserIdRef.current;
      const userIdValue = userIdRef.current;

      // If it's a reaction, we might not have receiverId, but we know it's for this conversation if we are here
      // However, to be safe, if it's a reaction we can just check if we are in a conversation
      if (data.type === 'message_reaction') {
        store.dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: userIdValue }]));
        store.dispatch(chatApi.util.invalidateTags(["Conversations"]));
        return;
      }

      if (
        (senderId && receiverId &&
          (String(senderId) === String(userIdValue) && String(receiverId) === String(currentUserIdValue)) ||
          (String(receiverId) === String(userIdValue) && String(senderId) === String(currentUserIdValue)))
      ) {
        store.dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: userIdValue }]));
        store.dispatch(chatApi.util.invalidateTags(["Conversations"]));
      }
    }
  }, []); // Empty deps - using refs instead

  // Enable WebSocket for real-time messages
  useChatWebSocket({
    enabled: !!userId && typeof userId !== 'undefined',
    onMessage: handleWebSocketMessage,
  });

  // Memoize messages with stable references
  const messages = useMemo(() => {
    if (!messagesResponse) return [];
    const messagesData =
      messagesResponse.data ??
      messagesResponse.results?.data ??
      messagesResponse.messages ??
      [];

    return messagesData.map((msg: {
      id: number | string;
      content?: string;
      text?: string;
      sender?: { id?: number | string };
      user?: { id?: number | string };
      sender_id?: number | string;
      created_at?: string;
      is_read?: boolean;
    }) => {
      const senderId = msg.sender?.id || msg.user?.id || msg.sender_id;
      const isCurrentUser = String(senderId) === String(currentUserId);

      return {
        id: String(msg.id),
        text: msg.content || msg.text || '',
        senderId: isCurrentUser ? 'current-user' : String(senderId),
        timestamp: msg.created_at
          ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          : 'just now',
        isRead: msg.is_read !== false,
        reactions: (msg as any).reactions || {},
        user_reaction: (msg as any).user_reaction || null,
      };
    });
  }, [
    messagesResponse?.data,
    messagesResponse?.results?.data,
    messagesResponse?.messages,
    currentUserId
  ]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Only scroll when messages length changes, not on every render
  const messagesLengthRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length !== messagesLengthRef.current) {
      messagesLengthRef.current = messages.length;
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages.length, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || isSending) return;

    // Prevent sending if blocked
    if (blockStatus.i_blocked_them || blockStatus.they_blocked_me) {
      toast.error(blockStatus.i_blocked_them ? 'You have blocked this user. Unblock to send messages.' : 'This user has blocked you. You cannot send messages.');
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Send direct message via REST API
      const result = await sendDirectMessage({
        receiver_id: userId,
        content: messageContent,
      }).unwrap();

      // Check if it was a message request (not a direct message)
      if (result.data && typeof result.data === 'object' && 'is_request' in result.data && result.data.is_request) {
        // It's a message request, refetch conversation to show the request
        await refetchConversation();
        toast.success("Message request sent. Waiting for response...");
      } else {
        // Regular message sent
      }

      // The backend will broadcast via WebSocket automatically
      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      const errorMessage = err?.data?.error || err?.data?.message || 'Failed to send message';
      toast.error(errorMessage);
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const handleAcceptRequest = async () => {
    if (!messageRequestInfo?.request?.id || isAccepting || isRejecting) return;
    try {
      await acceptRequest({ request_id: messageRequestInfo.request.id }).unwrap();
      toast.success("Message request accepted! You can now message each other.");
      await refetchConversation();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || "Failed to accept message request");
    }
  };

  const handleRejectRequest = async () => {
    if (!messageRequestInfo?.request?.id || isAccepting || isRejecting) return;
    try {
      await rejectRequest({ request_id: messageRequestInfo.request.id }).unwrap();
      toast.success("Message request rejected.");
      await refetchConversation();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || "Failed to reject message request");
    }
  };

  const handleCancelRequest = async () => {
    if (!messageRequestInfo?.request?.id || isCancelling) return;
    try {
      await cancelRequest({ request_id: messageRequestInfo.request.id }).unwrap();
      toast.success("Message request cancelled.");
      await refetchConversation();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || "Failed to cancel message request");
    }
  };

  const handleBlockUser = async () => {
    if (!userId || isBlocking || isUnblocking) return;

    try {
      if (isBlocked) {
        await unblockUser({ user_id: userId }).unwrap();
        toast.success(`You have unblocked ${user.name}`);
        setShowMenu(false);
        // Refetch conversation to update block status immediately
        await refetchConversation();
        // Also invalidate to ensure all related queries update
        store.dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: userId }]));
        store.dispatch(chatApi.util.invalidateTags(["Conversations"]));
        store.dispatch(chatApi.util.invalidateTags(["BlockedUsers"]));
      } else {
        await blockUser({ user_id: userId }).unwrap();
        toast.success(`You have blocked ${user.name}`);
        setShowMenu(false);
        // Refetch conversation to update block status immediately
        await refetchConversation();
        // Also invalidate to ensure all related queries update
        store.dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: userId }]));
        store.dispatch(chatApi.util.invalidateTags(["Conversations"]));
        store.dispatch(chatApi.util.invalidateTags(["BlockedUsers"]));
        // Optionally go back to list after blocking
        setTimeout(() => onBack(), 1000);
      }
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || 'Failed to block/unblock user');
    }
  };

  const handleReportUser = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showMenu && !target.closest('.user-menu-container')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-[#06133f] rounded-t-3xl relative">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-500 rounded-full transition-colors text-white"
        >
          <AiOutlineArrowLeft size={18} />
        </button>

        <div className="relative flex-shrink-0">
          {updatedUser.avatar && updatedUser.avatar !== "/profile.jpg" && !updatedUser.avatar.includes("profile.jpg") ? (
            <Image
              src={
                updatedUser.avatar.startsWith('http')
                  ? updatedUser.avatar
                  : `${apiBase}${updatedUser.avatar?.startsWith('/') ? updatedUser.avatar?.slice(1) : updatedUser.avatar}`
              }
              alt={updatedUser.name}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79] flex items-center justify-center text-white text-xs font-semibold">
              {updatedUser.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${updatedUser.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white text-sm truncate">{updatedUser.name}</h3>
          <p className="text-xs text-gray-500">
            {updatedUser.isOnline ? 'Online' : (updatedUser.lastSeen ? `Last seen ${formatLastSeen(updatedUser.lastSeen)}` : 'Offline')}
          </p>
        </div>

        {/* Menu Button */}
        <div className="user-menu-container relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-700 rounded-full transition-colors text-white"
          >
            <AiOutlineMore size={18} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-0 mt-2 w-48 bg-[#06133f] border border-gray-700 rounded-lg shadow-xl z-50">
              <button
                onClick={handleBlockUser}
                disabled={isBlocking || isUnblocking}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg"
              >
                <MdBlock size={18} />
                {isBlocked ? 'Unblock User' : 'Block User'}
              </button>
              <button
                onClick={handleReportUser}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors last:rounded-b-lg"
              >
                <MdReport size={18} />
                Report User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-14 space-y-3 custom-scroll">
        {/* Message Request Banner */}
        {messageRequestInfo && (
          <div className={`mb-4 p-4 rounded-lg border ${messageRequestInfo.isReceiver
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-blue-500/10 border-blue-500/30'
            }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-1 ${messageRequestInfo.isReceiver ? 'text-yellow-400' : 'text-blue-400'}`}>
                <p className="text-sm font-medium mb-1">
                  {messageRequestInfo.isReceiver ? '📩 Message Request Received' : '⏱ Message Request Sent'}
                </p>
                <p className="text-sm text-gray-300 mb-3">
                  {messageRequestInfo.request?.content || "No message content"}
                </p>
                {messageRequestInfo.isReceiver ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleAcceptRequest}
                      disabled={isAccepting || isRejecting}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isAccepting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        "✓ Accept"
                      )}
                    </button>
                    <button
                      onClick={handleRejectRequest}
                      disabled={isAccepting || isRejecting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isRejecting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        "✗ Reject"
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCancelRequest}
                    disabled={isCancelling}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCancelling ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      "Cancel Request"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 && !messageRequestInfo ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.senderId === 'current-user'}
                onEdit={async (messageId, newText) => {
                  try {
                    await updateMessage({ message_id: messageId, content: newText }).unwrap();
                    refetchConversation();
                  } catch (error) {
                    toast.error('Failed to update message');
                  }
                }}
                onDelete={async (messageId) => {
                  try {
                    await deleteMessage({ message_id: messageId }).unwrap();
                    toast.success('Message deleted');
                    refetchConversation();
                  } catch (error) {
                    toast.error('Failed to delete message');
                  }
                }}
                onReact={async (messageId, reactionType) => {
                  try {
                    await toggleReaction({ message_id: messageId, reaction_type: reactionType }).unwrap();
                    refetchConversation();
                  } catch (error) {
                    toast.error('Failed to react to message');
                  }
                }}
                isEditing={isUpdatingMessage}
                isDeleting={isDeletingMessage}
                isReacting={isReacting}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input or Blocked Message */}
      <div className="p-4 border-t border-gray-700 bg-[#06133f] rounded-b-3xl">
        {blockStatus.i_blocked_them ? (
          <div className="flex items-center justify-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="text-center flex">
              <p className="text-xs text-gray-400 text-nowrap">You have blocked {user.name} ,   </p>
              <button
                onClick={handleBlockUser}
                disabled={isBlocking || isUnblocking}
                className="text-xs cursor-pointer text-green-600 hover:text-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBlocking || isUnblocking ? 'Unblocking...' : 'Unblock'}
              </button>
            </div>
          </div>
        ) : blockStatus.they_blocked_me ? (
          <div className="flex items-center justify-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400">This person has blocked you. Can&apos;t send message anymore.</p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              rows={1}
              placeholder={`Message ${user.name}...`}
              className="flex-1 px-3 py-3 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-transparent text-sm text-white resize-none custom-scroll"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="p-2 bg-[#0059ff] text-white rounded-full hover:bg-[#0059ffcd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <PiPaperPlaneRightFill size={16} />
              )}
            </button>
          </form>
        )}
      </div>

      {/* Report Modal */}
      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        userId={userId}
        username={user.username || user.name}
      />
    </div>
  );
};

export default ConversationView;
