"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import CustomDialog from "@/components/ui/CustomDialog";
import { ChatMessage } from "@/store/chatApi";
import { getApiBaseUrl } from "@/lib/utils";
import { IoPersonOutline } from "react-icons/io5";

interface ConversationMessagesModalProps {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  conversationType: "direct" | "room";
  title: string;
  isLoading?: boolean;
}

const ConversationMessagesModal: React.FC<ConversationMessagesModalProps> = ({
  open,
  onClose,
  messages,
  conversationType,
  title,
  isLoading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open && messages.length > 0) {
      scrollToBottom();
    }
  }, [open, messages]);

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
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
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

  return (
    <CustomDialog
      open={open}
      onOpenChange={onClose}
      title={title}
      maxWidth="4xl"
      footer={null}
    >
      <div className="max-h-[70vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {isLoading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex gap-3">
                {/* Avatar Skeleton */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                </div>
                {/* Message Content Skeleton */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-4 bg-white/10 rounded w-24 animate-pulse" />
                    <div className="h-3 bg-white/10 rounded w-20 animate-pulse" />
                  </div>
                  <div className="bg-white/10 rounded-lg px-4 py-2">
                    <div className="h-4 bg-white/20 rounded w-full mb-2 animate-pulse" />
                    <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white/60">No messages found</div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const sender = message.sender;
              const senderName = sender?.display_name || sender?.username || "Unknown";
              const senderAvatar = sender?.avatar;
              const avatarUrl = getImageUrl(senderAvatar);

              return (
                <div key={message.id} className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {avatarUrl ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-slate-800">
                        <Image
                          src={avatarUrl}
                          alt={senderName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#6B83FA] flex items-center justify-center text-white font-semibold text-sm border border-white/20">
                        {getUserInitials(senderName)}
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {senderName}
                      </span>
                      <span className="text-xs text-white/50">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                    <div className="bg-white/10 rounded-lg px-4 py-2 text-white text-sm">
                      {message.content || "(No content)"}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </CustomDialog>
  );
};

export default ConversationMessagesModal;

