"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { AiOutlineClose, AiOutlineSearch, AiOutlinePlus } from 'react-icons/ai';
import ConversationView from './ConversationView';
import RoomConversationView from './RoomConversationView';
import MessageList from './MessageList';
import MessageUserList from './MessageUserList';
import CreateRoomModal from './CreateRoomModal';
import ManageRoomModal from './ManageRoomModal';
import { useGetChatRoomsQuery, useDeleteChatRoomMutation } from '@/store/chatApi';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { toast } from 'sonner';
import { useMessage } from '@/contexts/MessageContext';

interface MessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  username: string;
  isOnline?: boolean;
  lastSeen?: string;
  timestamp?: string;
  roomId?: number | string;
  isGroup?: boolean;
}

const MessagePopup = ({ isOpen, onClose }: MessagePopupProps) => {
  const { selectedUser: contextSelectedUser, selectUser, closeMessagePopup } = useMessage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "rooms">("users");
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showManageRoomModal, setShowManageRoomModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | string | null>(null);
  const { data: roomsResponse } = useGetChatRoomsQuery(undefined, { skip: !isOpen });
  const [deleteRoom] = useDeleteChatRoomMutation();
  
  // Initialize WebSocket connection when popup is open
  useChatWebSocket({ enabled: isOpen });

  // Sync context selected user with local state
  useEffect(() => {
    if (contextSelectedUser) {
      setSelectedUser(contextSelectedUser);
    }
  }, [contextSelectedUser]);

  const unreadCount = useMemo(() => {
    if (!roomsResponse) return 0;
    const rooms = roomsResponse.data ?? roomsResponse.results ?? roomsResponse.rooms ?? [];
    return rooms.reduce((total: number, room: { unread_count?: number }) => total + (room.unread_count || 0), 0);
  }, [roomsResponse]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    selectUser(user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    selectUser(null);
  };

  const handleClose = () => {
    setSelectedUser(null);
    closeMessagePopup();
    onClose();
  };

  const handleManageRoom = (roomId: number | string) => {
    setSelectedRoomId(roomId);
    setShowManageRoomModal(true);
  };

  const handleDeleteRoom = async (roomId: number | string) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteRoom(roomId).unwrap();
      toast.success('Room deleted successfully');
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        'Failed to delete room';
      toast.error('Failed to delete room', { description: errorMessage });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-[#06133f] rounded-lg shadow-2xl flex flex-col animate-in slide-in-from-bottom-2 duration-300">
      {selectedUser ? (
        selectedUser.isGroup ? (
          <RoomConversationView 
            room={{
              id: selectedUser.id,
              name: selectedUser.name,
              roomId: selectedUser.roomId,
              isGroup: true,
            }} 
            onBack={handleBackToList} 
          />
        ) : (
          <ConversationView user={selectedUser} onBack={handleBackToList} />
        )
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#06133f] rounded-t-lg">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm">Messages</h3>
              {unreadCount > 0 && (
                <span className="bg-[#ff4500] text-white text-xs px-2 py-1 rounded-full font-medium">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
                  <div className="flex items-center gap-1 text-white">
                    {activeTab === "rooms" && (
                      <button 
                        onClick={() => setShowCreateRoomModal(true)}
                        className="p-1.5 hover:bg-gray-500 rounded-full transition-colors"
                        title="Create Room"
                      >
                        <AiOutlinePlus size={14} />
                      </button>
                    )}
                    <button 
                      onClick={handleClose}
                      className="p-1.5 hover:bg-gray-500 rounded-full transition-colors"
                      title="Close"
                    >
                      <AiOutlineClose size={14} />
                    </button>
                  </div>
                </div>

          {/* Tabs */}
          <div className="px-3 pt-2 border-b border-gray-800 bg-[#06133f]">
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`flex-1 py-1.5 rounded-full cursor-pointer transition-colors ${
                  activeTab === "users"
                    ? "bg-white text-black font-semibold"
                    : "bg-transparent text-white/60 hover:text-white"
                }`}
              >
                Users
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rooms")}
                className={`flex-1 py-1.5 rounded-full cursor-pointer transition-colors ${
                  activeTab === "rooms"
                    ? "bg-white text-black font-semibold"
                    : "bg-transparent text-white/60 hover:text-white"
                }`}
              >
                Rooms
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder={activeTab === "users" ? "Search users..." : "Search messages..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-white pl-9 pr-4 py-2 border border-gray-800 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-transparent text-sm"
              />
            </div>
          </div>


          {/* Message / User List */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "users" ? (
              <MessageUserList searchQuery={searchQuery} onUserSelect={handleUserSelect} />
            ) : (
              <MessageList 
                searchQuery={searchQuery} 
                onUserSelect={handleUserSelect}
                onManageRoom={handleManageRoom}
                onDeleteRoom={handleDeleteRoom}
              />
            )}
          </div>
        </>
      )}
      
      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onRoomCreated={() => {
          setShowCreateRoomModal(false);
          setActiveTab("rooms");
        }}
      />

      {/* Manage Room Modal */}
      {selectedRoomId && (
        <ManageRoomModal
          isOpen={showManageRoomModal}
          roomId={selectedRoomId}
          onClose={() => {
            setShowManageRoomModal(false);
            setSelectedRoomId(null);
          }}
        />
      )}
    </div>
  );
};

export default MessagePopup;
