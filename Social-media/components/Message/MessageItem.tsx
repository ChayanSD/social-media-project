"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { AiOutlineMore } from 'react-icons/ai';

interface Message {
  id: string;
  roomId?: number | string;
  sender: {
    name: string;
    avatar: string;
    username: string;
  };
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  isGroup?: boolean;
  isAdmin?: boolean;
}

interface MessageItemProps {
  message: Message;
  onUserSelect: (user: User) => void;
  onManageRoom?: (roomId: number | string) => void;
  onDeleteRoom?: (roomId: number | string) => void;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  username: string;
  isOnline: boolean;
  timestamp?: string;
  roomId?: number | string;
  isGroup?: boolean;
}

const MessageItem = ({ message, onUserSelect, onManageRoom, onDeleteRoom }: MessageItemProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on the menu
    if ((e.target as HTMLElement).closest('.room-menu')) {
      return;
    }

    const user: User = {
      id: message.isGroup ? String(message.roomId || message.id) : message.id, // For rooms, use roomId
      name: message.sender.name,
      avatar: message.sender.avatar,
      username: message.sender.username,
      isOnline: message.isOnline,
      timestamp: message.timestamp,
      roomId: message.roomId || message.id, // Room ID for group chats
      isGroup: message.isGroup,
    };
    onUserSelect(user);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleManageRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onManageRoom && message.roomId) {
      onManageRoom(message.roomId);
    }
  };

  const handleDeleteRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDeleteRoom && message.roomId) {
      onDeleteRoom(message.roomId);
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-slate-800 cursor-pointer border-b border-gray-800 last:border-b-0 transition-colors group relative"
      onClick={handleClick}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        {message.sender.avatar && message.sender.avatar !== "/profile.jpg" && !message.sender.avatar.includes("profile.jpg") ? (
          <Image
            src={message.sender.avatar}
            alt={message.sender.name}
            width={36}
            height={36}
            className="rounded-full object-cover"
            unoptimized={true}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79] flex items-center justify-center text-white text-xs font-semibold">
            {message.sender.name.substring(0, 2).toUpperCase()}
          </div>
        )}
        {/* Only show online indicator for non-group chats */}
        {!message.isGroup && (
          <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full z-10 ${message.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-white text-sm truncate group-hover:text-gray-300 transition-colors">
            {message.sender.name}
          </h4>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
            {message.timestamp}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 truncate flex-1">
            {message.lastMessage}
          </p>
          {message.unreadCount > 0 && (
            <div className="bg-[#ff4500] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0 font-medium">
              {message.unreadCount > 9 ? '9+' : message.unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* 3-dot menu for rooms (only for admins) */}
      {message.isGroup && message.isAdmin && (
        <div className="relative room-menu" ref={menuRef}>
          <button
            onClick={handleMenuClick}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white z-10"
            title="Room options"
          >
            <AiOutlineMore size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[100] min-w-[150px]">
              <button
                onClick={handleManageRoom}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 rounded-t-lg transition-colors"
              >
                Manage Room
              </button>
              <button
                onClick={handleDeleteRoom}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 rounded-b-lg transition-colors"
              >
                Delete Room
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
