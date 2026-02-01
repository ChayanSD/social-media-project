"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AiOutlineArrowLeft, AiOutlineMore } from 'react-icons/ai';
import MessageBubble from './MessageBubble';
import { PiPaperPlaneRightFill } from 'react-icons/pi';
import { useGetRoomMessagesQuery, useSendMessageMutation, useUpdateChatRoomMutation, useDeleteChatRoomMutation, useGetChatRoomsQuery, useUpdateRoomMessageMutation, useDeleteRoomMessageMutation, chatApi, type ChatRoom } from '@/store/chatApi';
import { useGetCurrentUserProfileQuery } from '@/store/authApi';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { store } from '@/store/store';
import { toast } from 'sonner';

interface Room {
  id: string;
  name: string;
  avatar?: string;
  roomId?: number | string;
  isGroup?: boolean;
}

interface RoomConversationViewProps {
  room: Room;
  onBack: () => void;
}

const RoomConversationView = ({ room, onBack }: RoomConversationViewProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRoomName, setEditRoomName] = useState(room.name);
  const roomId = useMemo(() => {
    // Ensure roomId is a number for the API
    const id = room.roomId || room.id;
    if (typeof id === 'string' && !isNaN(Number(id))) {
      return Number(id);
    }
    return id;
  }, [room.roomId, room.id]);
  const { data: currentUser } = useGetCurrentUserProfileQuery();
  const { data: roomsResponse } = useGetChatRoomsQuery();
  
  const currentRoom = useMemo(() => {
    if (!roomsResponse) return null;
    const rooms = roomsResponse.data ?? roomsResponse.results ?? roomsResponse.rooms ?? [];
    return rooms.find((r: ChatRoom) => r.id === roomId) as ChatRoom | undefined;
  }, [roomsResponse, roomId]);
  
  const isAdmin = useMemo(() => {
    return currentRoom?.is_admin || false;
  }, [currentRoom]);
  const { data: messagesResponse, isLoading: isLoadingMessages, error: messagesError } = useGetRoomMessagesQuery(
    roomId as number | string,
    { 
      skip: !roomId || roomId === 0 || roomId === '0',
      refetchOnMountOrArgChange: true,
    }
  );
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [updateRoom, { isLoading: isUpdating }] = useUpdateChatRoomMutation();
  const [deleteRoom, { isLoading: isDeleting }] = useDeleteChatRoomMutation();
  const [updateMessage, { isLoading: isUpdatingMessage }] = useUpdateRoomMessageMutation();
  const [deleteMessage, { isLoading: isDeletingMessage }] = useDeleteRoomMessageMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUserId = useMemo(() => {
    return currentUser?.data?.id || currentUser?.id || currentUser?.user?.id;
  }, [currentUser]);
  
  // Enable WebSocket for real-time messages in this room
  useChatWebSocket({ 
    enabled: !!roomId && typeof roomId !== 'undefined',
    roomId: typeof roomId === 'string' && !isNaN(Number(roomId)) ? Number(roomId) : roomId,
    onMessage: (data) => {
      // Invalidate messages to refetch when new message arrives via WebSocket
      // Backend sends 'data' field for room messages, 'message' for direct messages
      const message = (data as { message?: unknown; data?: unknown }).message || (data as { data?: unknown }).data || data;
      const messageObj = message as { room_id?: number | string; room?: number | string; [key: string]: unknown };
      const messageRoomId = messageObj.room_id || messageObj.room || (data as { room?: number | string }).room;
      
      if ((data as { type?: string }).type === 'message' && messageRoomId && String(messageRoomId) === String(roomId)) {
        console.log('RoomConversationView - Invalidating cache for room:', roomId);
        // Invalidate to trigger refetch
        store.dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: roomId }]));
        store.dispatch(chatApi.util.invalidateTags(["ChatRooms"]));
      }
    }
  });

  const messages = useMemo(() => {
    if (!messagesResponse) {
      console.log('RoomConversationView - No messagesResponse, roomId:', roomId);
      return [];
    }
    
    const messagesData = 
      messagesResponse.data ??
      messagesResponse.results?.data ??
      messagesResponse.messages ??
      [];
    
    console.log('RoomConversationView - messagesData:', messagesData, 'roomId:', roomId);
    
    return messagesData.map((msg: {
      id: number | string;
      content?: string;
      text?: string;
      sender?: { id?: number | string; username?: string; display_name?: string };
      sender_id?: number | string;
      sender_username?: string;
      created_at?: string;
      is_read?: boolean;
    }) => {
      const senderId = msg.sender?.id || msg.sender_id;
      const isCurrentUser = String(senderId) === String(currentUserId);
      
      return {
        id: String(msg.id),
        text: msg.content || msg.text || '',
        senderId: isCurrentUser ? 'current-user' : String(senderId),
        senderName: msg.sender?.display_name || msg.sender?.username || msg.sender_username || 'Unknown',
        timestamp: msg.created_at 
          ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          : 'just now',
        isRead: msg.is_read !== false,
      };
    });
  }, [messagesResponse, currentUserId, roomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || isSending) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      await sendMessage({
        content: messageContent,
        room: roomId,
      }).unwrap();
      
      // Invalidate to refetch messages
      store.dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: roomId }]));
      store.dispatch(chatApi.util.invalidateTags(["ChatRooms"]));
      
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageContent);
      toast.error('Failed to send message');
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoomName.trim() || isUpdating) return;

    try {
      await updateRoom({
        id: roomId,
        name: editRoomName.trim(),
      }).unwrap();
      toast.success('Room updated successfully');
      setShowEditModal(false);
      setShowMenu(false);
    } catch {
      toast.error('Failed to update room');
    }
  };

  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteRoom(roomId).unwrap();
      toast.success('Room deleted successfully');
      onBack();
    } catch {
      toast.error('Failed to delete room');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-[#06133f] rounded-t-3xl">
        <button 
          onClick={onBack}
          className="p-1 hover:bg-gray-500 rounded-full transition-colors text-white"
        >
          <AiOutlineArrowLeft size={18} />
        </button>
        
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79] flex items-center justify-center text-white text-xs font-semibold">
            {room.name.substring(0, 2).toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white text-sm truncate">{room.name}</h3>
          <p className="text-xs text-gray-500">Group chat</p>
        </div>

        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-500 rounded-full transition-colors text-white"
            >
              <AiOutlineMore size={18} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-10 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[150px]">
                <button
                  onClick={() => {
                    setShowEditModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 rounded-t-lg"
                >
                  Edit Room
                </button>
                <button
                  onClick={handleDeleteRoom}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 rounded-b-lg"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Room'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Room Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#06133f] rounded-lg w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-semibold text-white text-lg mb-4">Edit Room</h3>
            <form onSubmit={handleUpdateRoom}>
              <input
                type="text"
                value={editRoomName}
                onChange={(e) => setEditRoomName(e.target.value)}
                placeholder="Room name"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent text-sm mb-4"
                required
                disabled={isUpdating}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditRoomName(room.name);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editRoomName.trim() || isUpdating}
                  className="flex-1 px-4 py-2 bg-[#0059ff] text-white rounded-md hover:bg-[#0059ffcd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messagesError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-red-500">Failed to load messages</p>
              <p className="text-xs text-gray-500 mt-1">Room ID: {String(roomId)}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id}>
                {message.senderId !== 'current-user' && (
                  <p className="text-xs text-gray-500 mb-1 px-2">{message.senderName}</p>
                )}
                <MessageBubble 
                  message={message} 
                  isCurrentUser={message.senderId === 'current-user'}
                  onEdit={async (messageId, newText) => {
                    try {
                      await updateMessage({ roomId, message_id: messageId, content: newText }).unwrap();
                      toast.success('Message updated');
                    } catch (error) {
                      toast.error('Failed to update message');
                    }
                  }}
                  onDelete={async (messageId) => {
                    try {
                      await deleteMessage({ roomId, message_id: messageId }).unwrap();
                      toast.success('Message deleted');
                    } catch (error) {
                      toast.error('Failed to delete message');
                    }
                  }}
                  isEditing={isUpdatingMessage}
                  isDeleting={isDeletingMessage}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700 bg-[#06133f] rounded-b-3xl">
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
            placeholder={`Message ${room.name}...`}
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
      </div>
    </div>
  );
};

export default RoomConversationView;

