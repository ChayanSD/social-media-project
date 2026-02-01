"use client";

import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { 
  useGetConversationsListQuery,
  useAcceptMessageRequestMutation,
  useRejectMessageRequestMutation,
  useGetConversationQuery,
  type ConversationItem,
  type MessageRequest
} from "@/store/chatApi";
import { Loader2, Check, X, MessageSquare, Clock } from "lucide-react";
import { getApiBaseUrl } from "@/lib/utils";

interface ConversationListProps {
  onSelectConversation?: (userId: number | string) => void;
  selectedUserId?: number | string | null;
}

export default function ConversationList({ onSelectConversation, selectedUserId }: ConversationListProps) {
  const { data, isLoading, refetch } = useGetConversationsListQuery();
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptMessageRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectMessageRequestMutation();
  const [viewingRequestId, setViewingRequestId] = useState<number | string | null>(null);

  const conversations = data?.data || [];

  const handleAccept = async (requestId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await acceptRequest({ request_id: requestId }).unwrap();
      toast.success("Message request accepted! You can now message each other.");
      refetch();
      setViewingRequestId(null);
    } catch (error: unknown) {
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 'message' in error.data
         ? String(error.data.message)
         : null) ||
        "Failed to accept message request";
      toast.error(errorMessage);
    }
  };

  const handleReject = async (requestId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await rejectRequest({ request_id: requestId }).unwrap();
      toast.success("Message request rejected.");
      refetch();
      setViewingRequestId(null);
    } catch (error: unknown) {
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 'message' in error.data
         ? String(error.data.message)
         : null) ||
        "Failed to reject message request";
      toast.error(errorMessage);
    }
  };

  const handleConversationClick = (conversation: ConversationItem) => {
    if (conversation.has_pending_request && conversation.is_request_receiver) {
      // If viewing a pending request, toggle the view
      if (viewingRequestId === conversation.pending_request?.id) {
        setViewingRequestId(null);
      } else {
        setViewingRequestId(conversation.pending_request?.id || null);
      }
    } else if (conversation.user?.id) {
      // Normal conversation click
      onSelectConversation?.(conversation.user.id);
    }
  };

  const getImageUrl = (image: string | undefined) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    const baseUrl = getApiBaseUrl();
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = image.startsWith("/") ? image.slice(1) : image;
    return `${cleanBase}/${cleanPath}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) {
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      } else if (days === 1) {
        return "Yesterday";
      } else if (days < 7) {
        return date.toLocaleDateString("en-US", { weekday: "short" });
      } else {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    } catch {
      return "";
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 mx-auto text-white/30 mb-4" />
        <p className="text-white/60">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const user = conversation.user;
        const userName = user?.display_name || user?.username || "Unknown";
        const userAvatar = user?.avatar;
        const avatarUrl = getImageUrl(userAvatar);
        const isSelected = selectedUserId === user?.id;
        const isViewingRequest = viewingRequestId === conversation.pending_request?.id;
        const showRequestActions = conversation.has_pending_request && 
                                   conversation.is_request_receiver && 
                                   isViewingRequest;

        return (
          <div
            key={user?.id}
            className={`backdrop-blur-[17px] rounded-xl p-4 border transition-all cursor-pointer ${
              isSelected 
                ? "border-purple-500 bg-white/10" 
                : "border-white/20 bg-white/5 hover:bg-white/10"
            }`}
            onClick={() => handleConversationClick(conversation)}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={userName}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {getUserInitials(userName)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-white font-semibold truncate">
                    {userName}
                  </h4>
                  {conversation.has_pending_request && (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  )}
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <span className="bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </span>
                  )}
                </div>

                {/* Show request content or last message */}
                {conversation.has_pending_request && conversation.is_request_receiver ? (
                  <div className="mb-2">
                    {isViewingRequest ? (
                      <div className="space-y-3">
                        <p className="text-white/70 text-sm mb-2">
                          {conversation.pending_request?.content || "No message content"}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleAccept(conversation.pending_request!.id!, e)}
                            disabled={isAccepting || isRejecting}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {isAccepting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={(e) => handleReject(conversation.pending_request!.id!, e)}
                            disabled={isAccepting || isRejecting}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {isRejecting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 text-sm">Message request:</span>
                        <p className="text-white/70 text-sm truncate">
                          {conversation.pending_request?.content || "No message content"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : conversation.has_pending_request && !conversation.is_request_receiver ? (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-500 text-sm">Request sent</span>
                    <p className="text-white/50 text-sm truncate">
                      {conversation.pending_request?.content || "Waiting for response..."}
                    </p>
                  </div>
                ) : conversation.last_message ? (
                  <p className="text-white/70 text-sm truncate mb-1">
                    {conversation.last_message.content || "(No content)"}
                  </p>
                ) : (
                  <p className="text-white/50 text-sm italic">No messages yet</p>
                )}

                {/* Timestamp */}
                {conversation.last_message_time && (
                  <span className="text-xs text-white/50">
                    {formatDate(conversation.last_message_time)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

