"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { useGetAdminAllConversationsQuery, useGetAdminConversationMessagesQuery, useDeleteAdminConversationMutation, AdminConversation } from "@/store/chatApi";
import { getApiBaseUrl } from "@/lib/utils";
import { MessageSquare, Users } from "lucide-react";
import ConversationMessagesModal from "./ConversationMessagesModal";
import { TableFilters } from "@/components/admin/TableFilters";
import { SearchFilter } from "@/components/admin/SearchFilter";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";

export default function ConversationsManagementTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [conversationTypeFilter, setConversationTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedConversation, setSelectedConversation] = useState<AdminConversation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<AdminConversation | null>(null);

  const { data, isLoading, isError, refetch } = useGetAdminAllConversationsQuery({
    page: currentPage,
    limit: pageSize,
    type: conversationTypeFilter === "all" ? undefined : conversationTypeFilter,
    search: searchQuery.trim() || undefined,
  });

  // Get messages for selected conversation using admin endpoint
  const { data: messagesData, isLoading: isLoadingMessages } = useGetAdminConversationMessagesQuery(
    {
      type: selectedConversation?.type || 'direct',
      user1_id: selectedConversation?.type === 'direct' ? selectedConversation.user1?.id : undefined,
      user2_id: selectedConversation?.type === 'direct' ? selectedConversation.user2?.id : undefined,
      room_id: selectedConversation?.type === 'room' ? selectedConversation.room_id : undefined,
    },
    { skip: !selectedConversation || !isModalOpen }
  );

  const [deleteConversation, { isLoading: isDeleting }] = useDeleteAdminConversationMutation();

  const conversations = useMemo(() => {
    if (!data) return [];
    // Handle paginated response structure
    if (data.results?.data && Array.isArray(data.results.data)) {
      return data.results.data;
    }
    // Fallback to direct data array
    if (Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }, [data]);

  // Extract pagination info
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNext = data?.next !== null && data?.next !== undefined;
  const hasPrevious = data?.previous !== null && data?.previous !== undefined;

  const getImageUrl = (image: string | undefined) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    const baseUrl = getApiBaseUrl();
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = image.startsWith("/") ? image.slice(1) : image;
    return `${cleanBase}/${cleanPath}`;
  };

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString("en-GB", { month: "short" });
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch {
      return "N/A";
    }
  };

  const handleConversationClick = (conversation: AdminConversation) => {
    setSelectedConversation(conversation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConversation(null);
  };

  const handleDeleteClick = (conversation: AdminConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    try {
      const result = await deleteConversation({
        type: conversationToDelete.type,
        user1_id: conversationToDelete.type === 'direct' ? conversationToDelete.user1?.id : undefined,
        user2_id: conversationToDelete.type === 'direct' ? conversationToDelete.user2?.id : undefined,
        room_id: conversationToDelete.type === 'room' ? conversationToDelete.room_id : undefined,
      }).unwrap();

      if (result.success) {
        toast.success(result.message || "Conversation deleted successfully");
        setDeleteDialogOpen(false);
        setConversationToDelete(null);
        refetch();
      }
    } catch (error: unknown) {
      const errorMessage = 
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to delete conversation";
      toast.error(errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const getDeleteDialogTitle = () => {
    if (!conversationToDelete) return "Delete Conversation";
    if (conversationToDelete.type === "direct") {
      return "Delete Direct Conversation";
    } else {
      return "Delete Room Conversation";
    }
  };

  const getDeleteDialogDescription = () => {
    if (!conversationToDelete) return "";
    if (conversationToDelete.type === "direct") {
      const user1Name = conversationToDelete.user1?.display_name || conversationToDelete.user1?.username || "User 1";
      const user2Name = conversationToDelete.user2?.display_name || conversationToDelete.user2?.username || "User 2";
      return `Are you sure you want to delete the conversation between ${user1Name} and ${user2Name}? This will permanently delete all messages in this conversation. This action cannot be undone.`;
    } else {
      const roomName = conversationToDelete.name || "Unnamed Room";
      return `Are you sure you want to delete the room "${roomName}"? This will permanently delete the room and all messages in it. This action cannot be undone.`;
    }
  };

  const getMessages = () => {
    return messagesData?.data || messagesData?.messages || [];
  };

  const getModalTitle = () => {
    if (!selectedConversation) return "Messages";
    if (selectedConversation.type === "direct") {
      const user1Name = selectedConversation.user1?.display_name || selectedConversation.user1?.username || "User 1";
      const user2Name = selectedConversation.user2?.display_name || selectedConversation.user2?.username || "User 2";
      return `Direct Messages: ${user1Name} & ${user2Name}`;
    } else {
      return `Room Messages: ${selectedConversation.name || "Unnamed Room"}`;
    }
  };

  type ConversationRow = AdminConversation;

  const columns: Column<ConversationRow>[] = [
    {
      header: "Type",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.type === "direct" ? (
            <>
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Direct</span>
            </>
          ) : (
            <>
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-sm">Room</span>
            </>
          )}
        </div>
      ),
    },
    {
      header: "Participants",
      accessor: (row) => {
        if (row.type === "direct") {
          const user1 = row.user1;
          const user2 = row.user2;
          const user1Name = user1?.display_name || user1?.username || "User 1";
          const user2Name = user2?.display_name || user2?.username || "User 2";
          const user1Avatar = getImageUrl(user1?.avatar);
          const user2Avatar = getImageUrl(user2?.avatar);

          return (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {user1Avatar ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-slate-800">
                    <Image
                      src={user1Avatar}
                      alt={user1Name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#6B83FA] flex items-center justify-center text-white font-semibold text-xs border border-white/20">
                    {getUserInitials(user1Name)}
                  </div>
                )}
                {user2Avatar ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-slate-800">
                    <Image
                      src={user2Avatar}
                      alt={user2Name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white font-semibold text-xs border border-white/20">
                    {getUserInitials(user2Name)}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-white">{user1Name}</span>
                <span className="text-xs text-white/60">{user2Name}</span>
              </div>
            </div>
          );
        } else {
          const participantCount = row.participants?.length || 0;
          const participants = row.participants || [];
          return (
            <div className="relative group flex items-center gap-2">
              <Users className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white">
                {row.name || "Unnamed Room"} ({participantCount} {participantCount === 1 ? "member" : "members"})
              </span>
              {participants.length > 0 && (
                <div className="absolute left-0 top-full mt-2 z-50 hidden group-hover:block">
                  <div className="bg-black/95 border border-white/20 rounded-lg p-4 shadow-xl min-w-[250px] max-w-[400px]">
                    <div className="text-xs font-semibold text-white/80 mb-2 pb-2 border-b border-white/10">
                      Room Members ({participantCount})
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {participants.map((participant, idx) => {
                        const participantName = participant.display_name || participant.username || "Unknown";
                        const participantAvatar = getImageUrl(participant.avatar);
                        return (
                          <div key={participant.id || idx} className="flex items-center gap-2">
                            {participantAvatar ? (
                              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-slate-800 flex-shrink-0">
                                <Image
                                  src={participantAvatar}
                                  alt={participantName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#6B83FA] flex items-center justify-center text-white font-semibold text-xs border border-white/20 flex-shrink-0">
                                {getUserInitials(participantName)}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm text-white truncate">{participantName}</span>
                              {participant.username && participant.username !== participantName && (
                                <span className="text-xs text-white/60 truncate">@{participant.username}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
      },
    },
    {
      header: "Last Message",
      accessor: (row) => {
        const lastMessage = row.last_message;
        if (!lastMessage) return <span className="text-white/60 text-sm">No messages</span>;
        
        const content = lastMessage.content || "(No content)";
        const truncated = content.length > 50 ? content.substring(0, 50) + "..." : content;
        return (
          <div className="max-w-xs">
            <p className="text-sm text-white truncate" title={content}>
              {truncated}
            </p>
            <p className="text-xs text-white/50 mt-1">
              {lastMessage.sender?.display_name || lastMessage.sender?.username || "Unknown"}
            </p>
          </div>
        );
      },
    },
    {
      header: "Message Count",
      accessor: (row) => (
        <span className="text-white">{row.message_count || 0}</span>
      ),
    },
    {
      header: "Last Activity",
      accessor: (row) => (
        <span className="text-white/70 text-sm">{formatDate(row.created_at)}</span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => handleDeleteClick(row, e)}
            disabled={isDeleting}
            className={`p-2 rounded-lg bg-white/10 hover:bg-white/20 transition ${
              isDeleting
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            title="Delete conversation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      ),
      className: "text-center",
    },
  ];

  const conversationTypeFilterOptions = [
    { value: "all", label: "All" },
    { value: "direct", label: "Direct Messages" },
    { value: "room", label: "Room Messages" },
  ];

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setPageSize(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const handlePreviousPage = () => {
    if (hasPrevious) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div>
      <CustomTable
        title="All Conversations"
        description="View and manage all user-to-user and room conversations"
        isLoading={isLoading}
        filters={
          <>
            <TableFilters
              filters={[
                {
                  type: "select",
                  key: "type",
                  label: "Type",
                  options: conversationTypeFilterOptions,
                  value: conversationTypeFilter,
                  onChange: (value) => {
                    setConversationTypeFilter(value);
                    setCurrentPage(1); // Reset to first page when filter changes
                  },
                },
              ]}
            />
            <SearchFilter
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1); // Reset to first page when search changes
              }}
              placeholder="Search by name or email..."
              label="Search"
            />
          </>
        }
        columns={columns}
        data={conversations}
        emptyMessage="No conversations found"
        isError={isError}
        errorMessage="Failed to load conversations. Please try again later"
        onRowClick={handleConversationClick}
        disablePagination={true}
        serverPagination={{
          totalCount,
          currentPage,
          pageSize,
          hasNext,
          hasPrevious,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          getPageNumbers,
          handlePreviousPage,
          handleNextPage,
        }}
      />

      <ConversationMessagesModal
        open={isModalOpen}
        onClose={handleCloseModal}
        messages={getMessages()}
        conversationType={selectedConversation?.type || "direct"}
        title={getModalTitle()}
        isLoading={isLoadingMessages}
      />

      {/* Delete Conversation Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={getDeleteDialogTitle()}
        description={getDeleteDialogDescription()}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

