"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineClose } from "react-icons/ai";
import { GoBell } from "react-icons/go";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  type NotificationItem,
} from "@/store/notificationApi";
import { IoCheckmarkDone } from "react-icons/io5";
import { toast } from "sonner";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown = ({
  isOpen,
  onClose,
}: NotificationDropdownProps) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, isFetching } = useGetNotificationsQuery({ page: currentPage });
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAllAsRead }] = useMarkAllNotificationsAsReadMutation();

  const notifications = useMemo(() => {
    return data?.data ?? data?.notifications ?? data?.results?.data ?? [];
  }, [data]);

  const hasNextPage = data?.next !== null && data?.next !== undefined;
  const showViewMore = hasNextPage && notifications.length > 0;

  // Check if there are any unread notifications
  const hasUnreadNotifications = notifications.some((n: NotificationItem) => !n.is_read);

  // Reset to page 1 when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAllAsRead().unwrap();
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleViewMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPage(prev => prev + 1);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await markAsRead({ notificationId: notification.id }).unwrap();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Navigate based on notification type
    if (notification.notification_type === "community_invite" && notification.community_name) {
      router.push(`/main/communities/${encodeURIComponent(notification.community_name)}`);
    } else if (notification.post) {
      router.push(`/main/post/${notification.post}`);
    }

    onClose();
  };

  const getNotificationTitle = (notification: NotificationItem) => {
    console.log(notification);

    const senderName = notification.sender_name ?? "Someone";

    if (notification.notification_type === "follow") {
      return `${senderName} following you`;
    }

    if (notification.notification_type === "like") {
      return `${senderName} like your post`;
    }

    if (notification.notification_type === "comment") {
      return `${senderName} commented on your post`;
    }

    if (notification.notification_type === "community_invite") {
      return `${senderName} invited you to join`;
    }

    return "New notification";
  };

  const getNotificationSubtitle = (notification: NotificationItem) => {
    if (notification.notification_type === "community_invite" && notification.community_title) {
      return notification.community_title;
    }

    if (notification.notification_type === "like" && notification.post_title) {
      return notification.post_title;
    }

    if (notification.post_title) {
      return notification.post_title;
    }

    return "";
  };

  const formatNotificationTime = (isoDate?: string) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleString("en-US", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-[#06133f] rounded-lg shadow-2xl border border-gray-700 z-50 animate-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <GoBell className="text-white" size={16} />
          <h3 className="font-semibold text-white text-sm">Notifications</h3>
          {hasUnreadNotifications && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="flex items-center cursor-pointer gap-1 px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mark all as read"
            >
              <IoCheckmarkDone size={14} />
              <span>Mark all read</span>
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-700 rounded-full text-white transition-colors"
          title="Close"
        >
          <AiOutlineClose size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="h-96 flex flex-col overflow-hidden">
        {isLoading && (
          <ul className="flex-1 overflow-y-auto divide-y divide-gray-800 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {Array.from({ length: 5 }).map((_, idx) => (
              <li key={idx} className="px-4 py-3 flex gap-3">
                <div className="mt-1 flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                  <div className="h-2 w-1/3 bg-white/5 rounded animate-pulse" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {isError && !isLoading && (
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-xs text-red-400 text-center">
              Failed to load notifications. Please try again later.
            </p>
          </div>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-xs text-gray-300 text-center">
              You don&apos;t have any notifications yet.
            </p>
          </div>
        )}

        {!isLoading && !isError && notifications.length > 0 && (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-800 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {notifications.map((notification: NotificationItem) => {
                const isUnread = !notification.is_read;
                return (
                  <li
                    key={notification.id}
                    className={`
                      px-4 py-3 cursor-pointer transition-colors flex gap-3 relative
                      ${isUnread
                        ? "bg-gray-800/40 hover:bg-gray-800/70 border-l-2 border-[#ff4500]"
                        : "bg-transparent hover:bg-gray-800/30 opacity-70"
                      }
                    `}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {isUnread && (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ff4500] animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs line-clamp-1 ${isUnread
                            ? "font-semibold text-white"
                            : "font-normal text-gray-400"
                          }`}
                      >
                        {getNotificationTitle(notification)}
                      </p>
                      {getNotificationSubtitle(notification) && (
                        <p
                          className={`text-xs mt-0.5 line-clamp-2 ${isUnread ? "text-gray-300" : "text-gray-500"
                            }`}
                        >
                          {getNotificationSubtitle(notification)}
                        </p>
                      )}
                      {notification.created_at && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          {formatNotificationTime(notification.created_at)}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {showViewMore && (
              <div className="px-4 py-3 border-t border-gray-700">
                <button
                  onClick={handleViewMore}
                  disabled={isFetching}
                  className="w-full px-4 py-2 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetching ? "Loading..." : "View More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;


