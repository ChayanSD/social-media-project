"use client";
import { useMemo, useState } from "react";
import { useGetRejectedPostsQuery, useApprovePostMutation, useDeletePostMutation, PostItem } from "@/store/postApi";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { getApiBaseUrl } from "@/lib/utils";
import Image from "next/image";
import { Trash2, CheckCircle } from "lucide-react";
import PostDetailsModal from "@/components/admin/PostDetailsModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";

export default function RejectedPostsTable() {
  const { data, isLoading, isError, refetch } = useGetRejectedPostsQuery();
  const [approvePost, { isLoading: isApproving }] = useApprovePostMutation();
  const [deletePost] = useDeletePostMutation();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToApprove, setPostToApprove] = useState<{
    id: number | string;
    title: string;
  } | null>(null);
  const [postToDelete, setPostToDelete] = useState<{
    id: number | string;
    title: string;
  } | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Backend now filters rejected posts via status=rejected parameter, so no need to filter on frontend
  const rejectedPosts = useMemo((): PostItem[] => {
    if (!data) return [];
    
    // Handle different response structures
    if (Array.isArray(data)) {
      return data;
    }
    
    // Handle object with data property
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as { data?: PostItem[]; results?: { data?: PostItem[] } | PostItem[]; posts?: PostItem[] };
      if (Array.isArray(dataObj.data)) {
        return dataObj.data;
      }
      if (dataObj.results) {
        if (Array.isArray(dataObj.results)) {
          return dataObj.results;
        }
        if (Array.isArray(dataObj.results.data)) {
          return dataObj.results.data;
        }
      }
      if (Array.isArray(dataObj.posts)) {
        return dataObj.posts;
      }
    }
    
    return [];
  }, [data]);

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

  const handleRowClick = (post: PostItem) => {
    setSelectedPost(post);
    setDetailsModalOpen(true);
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

  const handleDeleteClick = (post: PostItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.id) return;
    const postTitle = post.title || "Post";
    setPostToDelete({ id: post.id, title: postTitle });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    
    try {
      await deletePost({ postId: postToDelete.id }).unwrap();
      toast.success("Post deleted successfully!");
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to delete post";
      toast.error("Failed to delete post", { description: errorMessage });
    }
  };

  type PostRow = PostItem;

  const columns: Column<PostRow>[] = [
    {
      header: "SL",
      accessor: (row, index) => <span>{index + 1}.</span>,
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
      accessor: () => {
        return (
          <div className="flex items-center justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
              Rejected
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
      accessor: (row) => (
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={(e) => handleApproveClick(row, e)}
            disabled={isApproving}
            className="p-2 cursor-pointer text-green-500 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Approve and Repost"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleDeleteClick(row, e)}
            className="p-2 cursor-pointer text-red-500 rounded-lg bg-white/10 hover:bg-white/20 transition"
            title="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "text-center",
    },
  ];

  if (isLoading) {
    return (
      <div className="w-full p-6 border bg-black/30 backdrop-blur-sm rounded-xl border-white/20">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-semibold text-center text-white mb-8">Rejected Posts</h2>
        </div>
        <div className="animate-pulse space-y-4 mt-8">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-20 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <CustomTable
        title="Rejected Posts"
        description="View and manage posts that have been rejected"
        columns={columns}
        data={rejectedPosts}
        emptyMessage="No rejected posts found."
        isError={isError}
        errorMessage="Failed to load rejected posts. Please try again later."
        onRowClick={handleRowClick}
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
