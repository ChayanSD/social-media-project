"use client";
import { useMemo, useState } from "react";
import { useGetAllPostsQuery, useDeletePostMutation, useApprovePostMutation, PostItem } from "@/store/postApi";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { TableFilters } from "@/components/admin/TableFilters";
import { DateFilter, DateRangePreset, DateRange } from "@/components/admin/DateFilter";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { getApiBaseUrl } from "@/lib/utils";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import PostDetailsModal from "@/components/admin/PostDetailsModal";

export default function AllPostsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { data, isLoading, isError, refetch } = useGetAllPostsQuery({
    page: currentPage,
    limit: pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
    start_date: dateRange?.start_date,
    end_date: dateRange?.end_date,
    search: searchQuery.trim() || undefined,
  });
  const [deletePost] = useDeletePostMutation();
  const [approvePost, { isLoading: isApproving }] = useApprovePostMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{
    id: number | string;
    title: string;
  } | null>(null);
  const [postToApprove, setPostToApprove] = useState<{
    id: number | string;
    title: string;
  } | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const posts = useMemo((): PostItem[] => {
    if (!data) return [];
    
    // Handle DRF paginated response structure:
    // { count, next, previous, results: { success, message, data: [...] } }
    if (data.results) {
      // If results is an object with data property (DRF pagination wrapper)
      if (typeof data.results === 'object' && !Array.isArray(data.results)) {
        if (data.results.data && Array.isArray(data.results.data)) {
          return data.results.data;
        }
      }
      // If results is directly an array
      if (Array.isArray(data.results)) {
        return data.results;
      }
    }
    
    // Fallback to other possible structures
    if (Array.isArray(data.data)) {
      return data.data;
    }
    if (Array.isArray(data.posts)) {
      return data.posts;
    }
    
    return [];
  }, [data]);

  // Extract pagination info from response
  // DRF pagination returns: { count, next, previous, results: {...} }
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNext = data?.next !== null && data?.next !== undefined;
  const hasPrevious = data?.previous !== null && data?.previous !== undefined;

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

  const getImageUrl = (image: string | undefined) => {
    if (!image) return "/sheep.jpg";
    if (image.startsWith("http")) return image;
    const baseUrl = getApiBaseUrl();
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = image.startsWith("/") ? image.slice(1) : image;
    return `${cleanBase}/${cleanPath}`;
  };

  const handleDeleteClick = (post: PostItem) => {
    const postTitle = post.title || "Post";
    setPostToDelete({ id: post.id!, title: postTitle });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      await deletePost({ postId: postToDelete.id }).unwrap();
      toast.success("Post deleted successfully!");
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      // If current page becomes empty after deletion, go to previous page
      if (posts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        refetch();
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to delete post";
      toast.error("Failed to delete post", { description: errorMessage });
    }
  };

  const handleApproveClick = (post: PostItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.id) return;
    const postTitle = post.title || "Post";
    setPostToApprove({ id: post.id, title: postTitle });
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!postToApprove) return;
    
    try {
      await approvePost({ postId: postToApprove.id }).unwrap();
      toast.success("Post approved and reposted successfully!");
      setApproveDialogOpen(false);
      setPostToApprove(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to approve post";
      toast.error("Failed to approve post", { description: errorMessage });
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setPageSize(newLimit);
    setCurrentPage(1); // Reset to first page when limit changes
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleRowClick = (post: PostItem) => {
    setSelectedPost(post);
    setDetailsModalOpen(true);
  };

  // Generate page numbers to display
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

  type PostRow = PostItem;

  const columns: Column<PostRow>[] = [
    {
      header: "SL",
      accessor: (row, index) => <span>{(currentPage - 1) * pageSize + index + 1}.</span>,
    },
    {
      header: "Post Head",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.title || "N/A"}>
          {row.title || "N/A"}
        </div>
      ),
    },
    {
      header: "Author",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.author?.avatar || row.media?.[0] ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={getImageUrl(row.author?.avatar || row.media?.[0])}
                alt={row.author?.name || row.author?.username || row.username || "User"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : null}
          <span className="max-w-xs truncate">
            {row.author?.name || row.author?.username || row.username || row.user_name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "Post Date",
      accessor: (row) => <span>{formatDate(row.created_at)}</span>,
    },
    {
      header: "Status",
      accessor: (row) => {
        const status = (row as { status?: string }).status || "pending";
        const statusColors: Record<string, { bg: string; text: string }> = {
          approved: { bg: "bg-green-500/20", text: "text-green-300" },
          rejected: { bg: "bg-red-500/20", text: "text-red-300" },
          pending: { bg: "bg-yellow-500/20", text: "text-yellow-300" },
        };
        const colors = statusColors[status.toLowerCase()] || statusColors.pending;
        return (
          <div className="flex items-center justify-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        );
      },
      className: "text-center",
    },
    {
      header: "Likes",
      accessor: (row) => (
        <span className="text-center">{row.likes_count || 0}</span>
      ),
      className: "text-center",
    },
    {
      header: "Comments",
      accessor: (row) => (
        <span className="text-center">{row.comments_count || 0}</span>
      ),
      className: "text-center",
    },
    {
      header: "Actions",
      accessor: (row) => {
        const postStatus = (row as { status?: string }).status?.toLowerCase() || "approved";
        const isPending = postStatus === "pending";
        const isRejected = postStatus === "rejected";
        
        return (
          <div className="flex items-center justify-center space-x-3">
            {/* Show approve button for pending or rejected posts */}
            {(isPending || isRejected) && (
              <button
                onClick={(e) => handleApproveClick(row, e)}
                disabled={isApproving}
                className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Approve and Repost"
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row);
              }}
              className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="Delete post"
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
        );
      },
      className: "text-center",
    },
  ];

  const statusFilterOptions = [
    { value: "all", label: "All" },
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "rejected", label: "Rejected" },
    { value: "draft", label: "Draft" },
  ];

  return (
    <>
      <div className="w-[88vw] lg:w-full">
        <CustomTable
          columns={columns}
          data={posts}
          title="All Posts"
          description="View and manage all posts created by users"
          isLoading={isLoading}
          filters={
            <>
              <TableFilters
                filters={[
                  {
                    type: "select",
                    key: "status",
                    label: "Status",
                    options: statusFilterOptions,
                    value: statusFilter,
                    onChange: (value) => {
                      setStatusFilter(value);
                      setCurrentPage(1); // Reset to first page when filter changes
                    },
                  },
                ]}
              />
              <DateFilter
                value={datePreset}
                dateRange={dateRange}
                onChange={(preset, range) => {
                  setDatePreset(preset);
                  setDateRange(range);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                label="Date"
              />
              <SearchFilter
                value={searchQuery}
                onChange={(value) => {
                  setSearchQuery(value);
                  setCurrentPage(1);
                }}
                placeholder="Search by title, content, or author..."
                label="Search"
              />
            </>
          }
          emptyMessage="No posts found"
          isError={isError}
          errorMessage="Failed to load posts. Please try again later"
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
          onRowClick={handleRowClick}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Post?"
        description={`Are you sure you want to delete "${postToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setPostToDelete(null);
        }}
      />

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        open={approveDialogOpen}
        title="Approve Post?"
        description={`Are you sure you want to approve and repost "${postToApprove?.title}"?`}
        confirmLabel="Approve"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleApproveConfirm}
        onCancel={() => {
          setApproveDialogOpen(false);
          setPostToApprove(null);
        }}
      />

      {/* Post Details Modal */}
      <PostDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
      />
    </>
  );
}
