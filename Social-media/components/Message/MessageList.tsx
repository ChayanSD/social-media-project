"use client";

import React, { useMemo } from 'react';
import MessageItem from './MessageItem';
import { useGetChatRoomsQuery, type ChatRoom, type ChatUser } from '@/store/chatApi';
import { getApiBaseUrl } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  avatar: string;
  username: string;
  isOnline: boolean;
  timestamp?: string;
  roomId?: number | string;
}

interface MessageListProps {
  searchQuery: string;
  onUserSelect: (user: User) => void;
  onManageRoom?: (roomId: number | string) => void;
  onDeleteRoom?: (roomId: number | string) => void;
}

const MessageList = ({ searchQuery, onUserSelect, onManageRoom, onDeleteRoom }: MessageListProps) => {
  const { data: roomsResponse, isLoading, isError } = useGetChatRoomsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const rooms = useMemo(() => {
    if (!roomsResponse) return [];
    return (
      roomsResponse.data ??
      roomsResponse.results ??
      roomsResponse.rooms ??
      []
    );
  }, [roomsResponse]);

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

  const getRoomDisplayInfo = (room: ChatRoom) => {
    // For group rooms, show room name and participants
    if (room.is_group) {
      const participants = room.participants || [];
      const participantCount = Array.isArray(participants) ? participants.length : 0;
      return {
        name: room.name || `Group Chat (${participantCount} members)`,
        avatar: null,
        isGroup: true,
      };
    }
    
    // For one-on-one rooms, show the other participant
    const participants = room.participants || [];
    const otherParticipant = room.other_participant || (Array.isArray(participants) ? participants[0] : null);
    
    if (otherParticipant) {
      const apiBase = getApiBaseUrl();
      return {
        name: (otherParticipant as ChatUser).display_name || (otherParticipant as ChatUser).username || 'Unknown',
        avatar: (otherParticipant as ChatUser).avatar 
          ? ((otherParticipant as ChatUser).avatar?.startsWith('http') 
              ? (otherParticipant as ChatUser).avatar 
              : `${apiBase}${(otherParticipant as ChatUser).avatar?.startsWith('/') ? (otherParticipant as ChatUser).avatar?.slice(1) : (otherParticipant as ChatUser).avatar}`)
          : '/profile.jpg',
        isGroup: false,
      };
    }
    
    return {
      name: 'Unknown User',
      avatar: '/profile.jpg',
      isGroup: false,
    };
  };

  const transformedRooms = useMemo(() => {
    return rooms
      .filter((room: ChatRoom) => room.is_group) // Only show group rooms
      .map((room: ChatRoom) => {
        const displayInfo = getRoomDisplayInfo(room);
        const lastMessage = (room.last_message as { content?: string; created_at?: string } | undefined) || {};
        
        return {
          id: String(room.id),
          roomId: room.id,
          sender: {
            name: displayInfo.name,
            avatar: displayInfo.avatar || '/profile.jpg',
            username: displayInfo.name.toLowerCase().replace(/\s+/g, '_'),
          },
          lastMessage: lastMessage.content || 'No messages yet',
          timestamp: formatTimestamp(lastMessage.created_at || room.updated_at || room.created_at),
          unreadCount: room.unread_count || 0,
          isOnline: false, // Groups don't have online status
          isGroup: true,
          isAdmin: room.is_admin || false,
        };
      });
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return transformedRooms;
    const query = searchQuery.toLowerCase();
    return transformedRooms.filter((room) =>
      room.sender.name.toLowerCase().includes(query) ||
      room.lastMessage.toLowerCase().includes(query)
    );
  }, [transformedRooms, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center mt-5">
          <p className="text-sm">Failed to load rooms</p>
          <p className="text-xs mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-sm w-60 mx-auto mt-5">
            {searchQuery ? 'No rooms found' : 'No group rooms yet. Create one to get started!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="  relative">
        {filteredRooms.map((room) => (
          <MessageItem 
            key={room.id} 
            message={room} 
            onUserSelect={onUserSelect}
            onManageRoom={onManageRoom}
            onDeleteRoom={onDeleteRoom}
          />
        ))}
      </div>
    </div>
  );
};

export default MessageList;
