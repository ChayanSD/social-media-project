"use client";

import React, { useState, useMemo } from 'react';
import { AiOutlineClose, AiOutlineSearch, AiOutlineCheck } from 'react-icons/ai';
import Image from 'next/image';
import { useGetChatUsersQuery, useSearchChatUsersQuery, useCreateChatRoomMutation, type ChatUser } from '@/store/chatApi';
import { toast } from 'sonner';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated?: () => void;
}

const CreateRoomModal = ({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) => {
  const [roomName, setRoomName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<number | string>>(new Set());
  const [createRoom, { isLoading: isCreatingRoom }] = useCreateChatRoomMutation();

  const shouldSearch = searchQuery.trim().length >= 2;
  const { data: chatUsersResponse } = useGetChatUsersQuery(undefined, { skip: shouldSearch });
  const { data: searchResponse } = useSearchChatUsersQuery(searchQuery.trim(), { skip: !shouldSearch });

  const users = useMemo(() => {
    const response = shouldSearch ? searchResponse : chatUsersResponse;
    if (!response) return [];
    const usersData = response.data ?? response.results?.data ?? response.users ?? [];
    return usersData.filter((user: ChatUser) => !selectedMembers.has(user.id));
  }, [shouldSearch, chatUsersResponse, searchResponse, selectedMembers]);

  const handleToggleMember = (userId: number | string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || isCreatingRoom) return;

    try {
      await createRoom({
        name: roomName.trim(),
        member_ids: Array.from(selectedMembers),
      }).unwrap();
      toast.success('Room created successfully!');
      setRoomName('');
      setSelectedMembers(new Set());
      setSearchQuery('');
      onClose();
      if (onRoomCreated) onRoomCreated();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        'Failed to create room';
      toast.error('Failed to create room', { description: errorMessage });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-[#06133f] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold text-white text-lg">Create Group Room</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-500 rounded-full transition-colors text-white"
          >
            <AiOutlineClose size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateRoom} className="flex flex-col flex-1 overflow-hidden">
          {/* Room Name */}
          <div className="p-4 border-b border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room Name *
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent text-sm"
              required
              disabled={isCreatingRoom}
            />
          </div>

          {/* Selected Members */}
          {selectedMembers.size > 0 && (
            <div className="p-4 border-b border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selected Members ({selectedMembers.size})
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedMembers).map((memberId) => {
                  // Find member in users list
                  const allUsers = [
                    ...(chatUsersResponse?.data ?? []),
                    ...(searchResponse?.data ?? []),
                  ];
                  const member = allUsers.find((u: ChatUser) => u.id === memberId);
                  if (!member) return null;
                  
                  return (
                    <div
                      key={memberId}
                      className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full"
                    >
                      <span className="text-white text-xs">
                        {member.display_name || member.username || 'Unknown'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleMember(memberId)}
                        className="text-gray-400 hover:text-white"
                      >
                        <AiOutlineClose size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-white pl-9 pr-4 py-2 border border-gray-800 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-transparent text-sm bg-gray-800"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scroll">
            {users.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">
                  {searchQuery ? 'No users found' : 'No users available'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user: ChatUser) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleToggleMember(user.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors text-left"
                  >
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/20 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79]">
                      {user.avatar && user.avatar !== "/profile.jpg" && !user.avatar.includes("profile.jpg") ? (
                        <Image
                          src={user.avatar}
                          alt={user.display_name || user.username || 'User'}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-semibold">
                          {(user.display_name || user.username || 'U').substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.display_name || user.username || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{user.username || 'unknown'}
                      </p>
                    </div>
                    {selectedMembers.has(user.id) && (
                      <div className="flex-shrink-0">
                        <AiOutlineCheck className="text-[#0059ff]" size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
              disabled={isCreatingRoom}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!roomName.trim() || isCreatingRoom}
              className="flex-1 px-4 py-2 bg-[#0059ff] text-white rounded-md hover:bg-[#0059ffcd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isCreatingRoom ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;

