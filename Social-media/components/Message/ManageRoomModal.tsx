"use client";

import React, { useState, useMemo } from 'react';
import { AiOutlineClose, AiOutlineSearch, AiOutlinePlus, AiOutlineCrown } from 'react-icons/ai';
import Image from 'next/image';
import { useGetChatRoomsQuery, useMakeRoomAdminMutation, useRemoveRoomMemberMutation, useGetChatUsersQuery, useSearchChatUsersQuery, useAddRoomMembersMutation, type ChatUser, type ChatRoom } from '@/store/chatApi';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ManageRoomModalProps {
  isOpen: boolean;
  roomId: number | string;
  onClose: () => void;
}

const ManageRoomModal = ({ isOpen, onClose, roomId }: ManageRoomModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<"members" | "add">("members");
  const [memberToRemove, setMemberToRemove] = useState<ChatUser | null>(null);
  const { data: roomsResponse, refetch: refetchRooms } = useGetChatRoomsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [makeAdmin, { isLoading: isMakingAdmin }] = useMakeRoomAdminMutation();
  const [removeMember, { isLoading: isRemovingMember }] = useRemoveRoomMemberMutation();
  const [addMembers, { isLoading: isAddingMembers }] = useAddRoomMembersMutation();

  const shouldSearch = searchQuery.trim().length >= 2;
  const { data: chatUsersResponse } = useGetChatUsersQuery(undefined, { skip: shouldSearch || activeTab !== "add" });
  const { data: searchResponse } = useSearchChatUsersQuery(searchQuery.trim(), { skip: !shouldSearch || activeTab !== "add" });

  const room = useMemo(() => {
    if (!roomsResponse) return null;
    const rooms = roomsResponse.data ?? roomsResponse.results ?? roomsResponse.rooms ?? [];
    return rooms.find((r: ChatRoom) => r.id === roomId) as ChatRoom | undefined;
  }, [roomsResponse, roomId]);

  const members = useMemo(() => {
    if (!room) return [];
    return room.participants || [];
  }, [room]);

  const admins = useMemo(() => {
    if (!room) return [];
    return room.admins || [];
  }, [room]);

  const availableUsers = useMemo(() => {
    if (activeTab !== "add") return [];
    const response = shouldSearch ? searchResponse : chatUsersResponse;
    if (!response) return [];
    const usersData = response.data ?? response.results?.data ?? response.users ?? [];
    // Filter out users already in the room
    const memberIds = new Set(members.map((m: ChatUser) => m.id));
    return usersData.filter((user: ChatUser) => !memberIds.has(user.id));
  }, [shouldSearch, chatUsersResponse, searchResponse, members, activeTab]);

  const handleMakeAdmin = async (userId: number | string) => {
    try {
      await makeAdmin({ roomId, user_id: userId }).unwrap();
      toast.success('User is now an admin');
      // Refetch rooms to update the UI
      refetchRooms();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        'Failed to make user admin';
      toast.error('Failed to make user admin', { description: errorMessage });
    }
  };

  const handleRemoveMemberClick = (member: ChatUser) => {
    setMemberToRemove(member);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMember({ roomId, user_id: memberToRemove.id }).unwrap();
      toast.success('Member removed from room');
      setMemberToRemove(null);
      // Refetch rooms to update the UI
      refetchRooms();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        'Failed to remove member';
      toast.error('Failed to remove member', { description: errorMessage });
      setMemberToRemove(null);
    }
  };

  const handleCancelRemoveMember = () => {
    setMemberToRemove(null);
  };

  const handleAddMembers = async (userIds: (number | string)[]) => {
    if (userIds.length === 0) return;

    try {
      await addMembers({ roomId, member_ids: userIds }).unwrap();
      toast.success(`Added ${userIds.length} member(s) to the room`);
      setSearchQuery('');
      setActiveTab("members");
      // Refetch rooms to update the UI
      refetchRooms();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        'Failed to add members';
      toast.error('Failed to add members', { description: errorMessage });
    }
  };

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-[#06133f] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold text-white text-lg">Manage Room: {room.name}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-500 rounded-full transition-colors text-white"
          >
            <AiOutlineClose size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 border-b border-gray-700">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`flex-1 py-2 rounded-full cursor-pointer transition-colors ${
                activeTab === "members"
                  ? "bg-white text-black font-semibold"
                  : "bg-transparent text-white/60 hover:text-white"
              }`}
            >
              Members
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className={`flex-1 py-2 rounded-full cursor-pointer transition-colors ${
                activeTab === "add"
                  ? "bg-white text-black font-semibold"
                  : "bg-transparent text-white/60 hover:text-white"
              }`}
            >
              Add Members
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scroll">
          {activeTab === "members" ? (
            <div className="space-y-2">
              {members.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">No members in this room</p>
                </div>
              ) : (
                members.map((member: ChatUser) => {
                  const isAdmin = admins.some((admin: ChatUser) => admin.id === member.id);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
                    >
                      <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/20 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79]">
                        {member.avatar && member.avatar !== "/profile.jpg" && !member.avatar.includes("profile.jpg") ? (
                          <Image
                            src={member.avatar}
                            alt={member.display_name || member.username || 'User'}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-white text-xs font-semibold">
                            {(member.display_name || member.username || 'U').substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            {member.display_name || member.username || 'Unknown User'}
                          </p>
                          {isAdmin && (
                            <AiOutlineCrown className="text-yellow-400" size={16} title="Admin" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          @{member.username || 'unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isAdmin && (
                          <button
                            onClick={() => handleMakeAdmin(member.id)}
                            disabled={isMakingAdmin}
                            className="p-1.5 text-yellow-400 hover:bg-gray-700 rounded transition-colors"
                            title="Make Admin"
                          >
                            <AiOutlineCrown size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMemberClick(member)}
                          disabled={isRemovingMember}
                          className="p-1.5 text-red-400 hover:bg-gray-700 rounded transition-colors"
                          title="Remove Member"
                        >
                          <AiOutlineClose size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div>
              {/* Search */}
              <div className="mb-4">
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
              {availableUsers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">
                    {searchQuery ? 'No users found' : 'No users available to add'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map((user: ChatUser) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleAddMembers([user.id])}
                      disabled={isAddingMembers}
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
                      <AiOutlinePlus className="text-[#0059ff]" size={20} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirm Remove Member Dialog */}
      <ConfirmDialog
        open={memberToRemove !== null}
        title="Remove Member"
        description={`Are you sure you want to remove "${memberToRemove?.display_name || memberToRemove?.username || 'this member'}" from the room? This action cannot be undone.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmRemoveMember}
        onCancel={handleCancelRemoveMember}
      />
    </div>
  );
};

export default ManageRoomModal;

