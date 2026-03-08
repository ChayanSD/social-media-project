"use client";
import { useMemo, useState } from "react";
import { useGetPendingPostsQuery, useApprovePostMutation, useRejectPostMutation, useDeletePostMutation, PostItem } from "@/store/postApi";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { getApiBaseUrl } from "@/lib/utils";
import Image from "next/image";
import { Trash2, CheckCircle, XCircle, User } from "lucide-react";
import PostDetailsModal from "@/components/admin/PostDetailsModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";

export default function PendingPostsTable() {
    const { data, isLoading, isError, refetch } = useGetPendingPostsQuery();
    const [approvePost, { isLoading: isApproving }] = useApprovePostMutation();
    const [rejectPost, { isLoading: isRejecting }] = useRejectPostMutation();
    const [deletePost] = useDeletePostMutation();

    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [postToApprove, setPostToApprove] = useState<{ id: number | string; title: string } | null>(null);
    const [postToReject, setPostToReject] = useState<{ id: number | string; title: string } | null>(null);
    const [postToDelete, setPostToDelete] = useState<{ id: number | string; title: string } | null>(null);

    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    const pendingPosts = useMemo((): PostItem[] => {
        if (!data) return [];

        // Handle different response structures
        if (Array.isArray(data)) {
            return data;
        }

        if (typeof data === 'object' && data !== null) {
            const dataObj = data as any;
            if (Array.isArray(dataObj.data)) return dataObj.data;
            if (dataObj.results) {
                if (Array.isArray(dataObj.results)) return dataObj.results;
                if (Array.isArray(dataObj.results.data)) return dataObj.results.data;
            }
            if (Array.isArray(dataObj.posts)) return dataObj.posts;
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

    const handleApproveConfirm = async () => {
        if (!postToApprove) return;
        try {
            await approvePost({ postId: postToApprove.id }).unwrap();
            toast.success("Post approved and published successfully!");
            setApproveDialogOpen(false);
            setPostToApprove(null);
            refetch();
        } catch (error: any) {
            const errorMessage = error?.data?.error || error?.data?.message || "Failed to approve post";
            toast.error("Failed to approve post", { description: errorMessage });
        }
    };

    const handleRejectConfirm = async () => {
        if (!postToReject) return;
        try {
            await rejectPost({
                postId: postToReject.id,
                reason: rejectionReason || "Violation of community guidelines"
            }).unwrap();
            toast.success("Post rejected successfully!");
            setRejectDialogOpen(false);
            setPostToReject(null);
            setRejectionReason("");
            refetch();
        } catch (error: any) {
            const errorMessage = error?.data?.error || error?.data?.message || "Failed to reject post";
            toast.error("Failed to reject post", { description: errorMessage });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!postToDelete) return;
        try {
            await deletePost({ postId: postToDelete.id }).unwrap();
            toast.success("Post deleted successfully!");
            setDeleteDialogOpen(false);
            setPostToDelete(null);
            refetch();
        } catch (error: any) {
            const errorMessage = error?.data?.error || error?.data?.message || "Failed to delete post";
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
                    <User className="w-4 h-4" />
                    <span className="max-w-xs truncate">
                        {row?.user_name || row.author?.username || row.username || "N/A"}
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
            accessor: () => (
                <div className="flex items-center justify-center">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300">
                        Pending
                    </span>
                </div>
            ),
            className: "text-center",
        },
        {
            header: "Actions",
            accessor: (row) => (
                <div className="flex items-center justify-center space-x-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setPostToApprove({ id: row.id!, title: row.title || "Post" });
                            setApproveDialogOpen(true);
                        }}
                        disabled={isApproving}
                        className="p-2 cursor-pointer text-green-500 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                        title="Approve Post"
                    >
                        <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setPostToReject({ id: row.id!, title: row.title || "Post" });
                            setRejectDialogOpen(true);
                        }}
                        disabled={isRejecting}
                        className="p-2 cursor-pointer text-red-500 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                        title="Reject Post"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setPostToDelete({ id: row.id!, title: row.title || "Post" });
                            setDeleteDialogOpen(true);
                        }}
                        className="p-2 cursor-pointer text-white/50 hover:text-red-500 rounded-lg bg-white/10 hover:bg-white/20 transition"
                        title="Delete Post"
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
            <div className="w-full p-6 border bg-black/30 backdrop-blur-sm rounded-xl border-white/20 animate-pulse">
                <div className="h-8 w-48 bg-white/10 rounded mb-8 mx-auto" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-white/5 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <CustomTable
                title="Pending Posts"
                description="View and manage posts waiting for approval"
                columns={columns}
                data={pendingPosts}
                emptyMessage="No pending posts found."
                isError={isError}
                errorMessage="Failed to load pending posts."
                onRowClick={handleRowClick}
            />

            <ConfirmDialog
                open={approveDialogOpen}
                title="Approve Post?"
                description={`Are you sure you want to approve "${postToApprove?.title}"?`}
                confirmLabel="Approve"
                onConfirm={handleApproveConfirm}
                onCancel={() => setApproveDialogOpen(false)}
            />

            <ConfirmDialog
                open={rejectDialogOpen}
                title="Reject Post?"
                description={
                    <div className="space-y-4">
                        <p>Are you sure you want to reject &quot;{postToReject?.title}&quot;?</p>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">Reason (Optional)</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Violation of community guidelines..."
                                className="w-full h-24 bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                            />
                        </div>
                    </div>
                }
                confirmLabel="Reject"
                cancelLabel="Cancel"
                variant="destructive"
                onConfirm={handleRejectConfirm}
                onCancel={() => {
                    setRejectDialogOpen(false);
                    setPostToReject(null);
                    setRejectionReason("");
                }}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                title="Delete Post?"
                description={`Permanently delete "${postToDelete?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteDialogOpen(false)}
            />

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
