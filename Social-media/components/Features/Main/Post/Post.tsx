"use client";

import Image from "next/image";
import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FaRegComment } from "react-icons/fa";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { VscThumbsup } from "react-icons/vsc";
import { AiFillLike } from "react-icons/ai";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { BiSend } from "react-icons/bi";
import type { PostItem, CommentItem, FollowItem } from "@/store/postApi";
import { useLikePostMutation, useGetCommentsQuery, useCreateCommentMutation, useUpdateCommentMutation, useDeleteCommentMutation, useFollowUserMutation, useUnfollowUserMutation, useGetFollowingQuery, useDeletePostMutation, useSharePostMutation } from "@/store/postApi";
import { getApiBaseUrl } from "@/lib/utils";
import CustomDialog from "@/components/ui/CustomDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { FiEdit2, FiTrash2, FiFlag } from "react-icons/fi";
import EditPost from "../../EditPost/EditPost";
import ReportPostModal from "./ReportPostModal";
import { getStoredAccessToken } from "@/lib/auth";
import { toast } from "sonner";

interface Profile {
  id: string | number;
  username: string;
  email: string;
  display_name: string;
  avatar: string;
  cover_photo: string;
}

interface PostProps {
  post: PostItem;
  profile?: Profile;
}

const Post = ({ post, profile }: PostProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = getStoredAccessToken();
  const [showComments, setShowComments] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: number | string; username: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<number | string>>(new Set());
  const [editingComment, setEditingComment] = useState<number | string | null>(null);
  const [editText, setEditText] = useState("");
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(10);
  const [commentToDelete, setCommentToDelete] = useState<number | string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSharePreviewModalOpen, setIsSharePreviewModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [deletePost, { isLoading: isDeletingPost }] = useDeletePostMutation();
  const [sharePost, { isLoading: isSharing }] = useSharePostMutation();
  // For shared posts, get comments from the shared post itself (separate from original)
  const postIdForComments = post?.id;
  const { data: commentsData, isLoading: isLoadingComments } = useGetCommentsQuery(postIdForComments, {
    skip: !showComments || !postIdForComments,
  });
  const [createComment, { isLoading: isCreatingComment }] = useCreateCommentMutation();
  const [updateComment, { isLoading: isUpdatingComment }] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowing }] = useUnfollowUserMutation();
  const [followingId, setFollowingId] = useState<number | string | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);

  // Extract user_id for the follow button
  const postUserId = (post as { user?: number | string }).user;

  // Fetch following list to check if user is already following the post author
  const { data: followingData } = useGetFollowingQuery(undefined, {
    skip: !postUserId || !profile?.id,
  });

  // Check if user is already following from following API
  useEffect(() => {
    if (!postUserId) return;

    // If we have following data, use it to determine follow state
    if (followingData) {
      // Type guard: check if followingData is an array
      let following: FollowItem[] = [];
      if (Array.isArray(followingData)) {
        following = followingData;
      } else if ('data' in followingData && followingData.data) {
        following = Array.isArray(followingData.data) ? followingData.data : [];
      } else if ('results' in followingData && followingData.results) {
        const results = followingData.results as { data?: FollowItem[] };
        following = Array.isArray(results?.data) ? results.data : [];
      }

      // Find if the post's user ID is in the following list
      // The following API returns items where 'following' is the user ID being followed
      const followItem = following.find((item: FollowItem) => {
        const followingUserId = item.following;
        return followingUserId && String(followingUserId) === String(postUserId);
      });

      if (followItem && followItem.id) {
        setFollowingId(followItem.id);
        setIsFollowingUser(true);
      } else {
        setIsFollowingUser(false);
        setFollowingId(null);
      }
    } else {
      // Fallback to post data if following API hasn't loaded yet
      const postFollowingId = (post as { following_id?: number | string })?.following_id;
      const postIsFollowing = (post as { is_following?: boolean })?.is_following;

      if (postFollowingId) {
        setFollowingId(postFollowingId);
        setIsFollowingUser(true);
      } else if (postIsFollowing !== undefined) {
        setIsFollowingUser(postIsFollowing);
      }
    }
  }, [followingData, postUserId, post]);

  // For shared posts, use the shared post's own like count and is_liked status (separate from original)
  const isLiked = post?.is_liked || false;
  const likeCount = post?.likes_count as number || 0;

  const createdAt = useMemo(() => {
    if (!post?.created_at) return "just now";
    const date = new Date(post?.created_at);
    if (Number.isNaN(date.getTime())) return post?.created_at;
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [post?.created_at]);

  const allMediaUrls = useMemo(() => {
    if (!post?.media_file || post.media_file.length === 0) return [];
    const apiBase = getApiBaseUrl();
    const baseUrl = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
    return post.media_file.map((mediaPath) => {
      const cleanPath = mediaPath.startsWith("/") ? mediaPath.slice(1) : mediaPath;
      return `${baseUrl}media/${cleanPath}`;
    });
  }, [post?.media_file]);

  // Original post media URLs for shared posts
  const originalPostMediaUrls = useMemo(() => {
    if (!post?.original_post?.media_file || !Array.isArray(post.original_post.media_file) || post.original_post.media_file.length === 0) return [];
    const apiBase = getApiBaseUrl();
    const baseUrl = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
    return post.original_post.media_file.map((mediaPath: string) => {
      const cleanPath = mediaPath.startsWith("/") ? mediaPath.slice(1) : mediaPath;
      return `${baseUrl}media/${cleanPath}`;
    });
  }, [post?.original_post?.media_file]);

  // Helper function to detect if a media URL is a video
  const isVideoUrl = (url: string, index?: number): boolean => {
    // Check original media_file path first (most reliable)
    if (post?.media_file && typeof index === 'number' && post.media_file[index]) {
      const mediaPath = post.media_file[index].toLowerCase();
      const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

      // Check if it ends with video extension
      const hasVideoExt = videoExtensions.some(ext => mediaPath.endsWith(ext));
      // Check if it ends with image extension (to exclude false positives)
      const hasImageExt = imageExtensions.some(ext => mediaPath.endsWith(ext));

      if (hasImageExt) return false; // Definitely an image
      if (hasVideoExt) return true; // Definitely a video
    }

    // Fallback: Check URL filename extension
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerUrl = url.toLowerCase();

    // Extract filename from URL (remove query params if any)
    const urlWithoutParams = lowerUrl.split('?')[0];
    const urlParts = urlWithoutParams.split('/');
    const filename = urlParts[urlParts.length - 1];

    // Check if filename ends with image extension first (to exclude false positives)
    if (imageExtensions.some(ext => filename.endsWith(ext))) {
      return false;
    }

    // Check if filename ends with video extension
    if (videoExtensions.some(ext => filename.endsWith(ext))) {
      return true;
    }

    // Last resort: check URL path (but be cautious)
    // Only return true if URL explicitly contains '/video/' and not '/image/'
    return lowerUrl.includes('/video/') && !lowerUrl.includes('/image/') && !lowerUrl.includes('/media/images/');
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('v=')
        ? url.split('v=')[1].split('&')[0]
        : url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const videoUrl = post?.video_url;
  const embedUrl = getEmbedUrl(videoUrl || "");

  const comments = useMemo(() => {
    const source =
      commentsData?.data ??
      commentsData?.results ??
      commentsData?.comments ??
      [];

    const data = Array.isArray(source)
      ? source
      : Array.isArray((source as { data?: CommentItem[] }).data)
        ? (source as { data?: CommentItem[] }).data!
        : [];
    // Organize comments into parent-child structure
    const commentMap = new Map<number | string, CommentItem & { replies: CommentItem[] }>();
    const topLevelComments: (CommentItem & { replies: CommentItem[] })[] = [];

    // First pass: create map of all comments
    data?.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree structure
    data?.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent) {
        const parentComment = commentMap.get(comment.parent);
        if (parentComment) {
          parentComment.replies.push(commentWithReplies);
        }
      } else {
        topLevelComments.push(commentWithReplies);
      }
    });

    // Sort replies within each comment by created_at (newest first)
    topLevelComments.forEach((comment) => {
      comment.replies.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Newest first
      });
    });

    // Reverse to show newest comments first
    return topLevelComments.reverse();
  }, [commentsData]);

  // Reset visible comments count when comments change or when opening comments section
  useEffect(() => {
    if (showComments) {
      setVisibleCommentsCount(10);
    }
  }, [showComments, comments.length]);

  const content = post?.content || "No description provided.";
  const words = content.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;
  const shouldTruncate = wordCount > 50;
  const truncatedContent = useMemo(() => {
    if (!shouldTruncate || isContentExpanded) return content;
    return words.slice(0, 50).join(" ") + "...";
  }, [content, shouldTruncate, isContentExpanded, words]);

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allMediaUrls.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < allMediaUrls.length - 1 ? prev + 1 : 0));
  };

  const handleLikeClick = async () => {
    // Like the post itself (for shared posts, like the shared post, not the original)
    const postIdToLike = post?.id;

    if (!postIdToLike || isLiking) return;

    // Redirect to login if not authenticated
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Helper function to update post in any TanStack Query cache
    const updatePostInCache = (queryKey: string[]) => {
      queryClient.setQueryData(queryKey, (oldData: { pages?: unknown[]; posts?: PostItem[]; pageParams?: unknown[] } | undefined) => {
        if (!oldData) return oldData;

        const updatePost = (p: PostItem): PostItem => {
          if (p.id === postIdToLike) {
            // Use the component's isLiked prop (source of truth) to determine the action
            // This ensures consistency with what the user sees and clicks
            const newLikedState = !isLiked;
            // If isLiked is true, we're unliking (decrease count)
            // If isLiked is false, we're liking (increase count)
            const countChange = isLiked ? -1 : 1;
            const currentCount = p.likes_count || 0;
            const newCount = Math.max(0, currentCount + countChange);

            return {
              ...p,
              is_liked: newLikedState,
              likes_count: newCount,
            };
          }
          return p;
        };

        // Update posts in the flattened structure
        const updatedPosts = (oldData.posts || []).map(updatePost);

        // Update posts in pages
        const updatedPages = (oldData.pages || []).map((page: unknown) => {
          const pageData = page as { data?: PostItem[]; posts?: PostItem[]; results?: PostItem[] | { data?: PostItem[] } };
          let posts: PostItem[] = [];

          if (Array.isArray(pageData.data)) {
            posts = pageData.data;
          } else if (Array.isArray(pageData.posts)) {
            posts = pageData.posts;
          } else if (pageData.results) {
            if (Array.isArray(pageData.results)) {
              posts = pageData.results;
            } else if (pageData.results.data && Array.isArray(pageData.results.data)) {
              posts = pageData.results.data;
            }
          }

          const updatedPagePosts = posts.map(updatePost);

          if (Array.isArray(pageData.data)) {
            return { ...pageData, data: updatedPagePosts };
          } else if (Array.isArray(pageData.posts)) {
            return { ...pageData, posts: updatedPagePosts };
          } else if (pageData.results) {
            if (Array.isArray(pageData.results)) {
              return { ...pageData, results: updatedPagePosts };
            } else if (pageData.results.data) {
              return { ...pageData, results: { ...pageData.results, data: updatedPagePosts } };
            }
          }
          return pageData;
        });

        return {
          ...oldData,
          pages: updatedPages,
          posts: updatedPosts,
        };
      });
    };

    // Optimistically update all TanStack Query caches before API call
    // Update news feed cache
    updatePostInCache(["newsFeed"]);

    // Update all user posts queries (they have queryKey: ["userPosts", userId])
    queryClient.getQueryCache().getAll().forEach((query) => {
      const queryKey = query.queryKey as readonly unknown[];
      if (queryKey[0] === "userPosts" || queryKey[0] === "communityPosts") {
        updatePostInCache([...queryKey] as string[]);
      }
    });

    try {
      // Perform the API call in the background
      // The optimistic update already shows the change, no need to refetch
      if (isLiked) {
        await likePost({ postId: postIdToLike, isLiked: false }).unwrap();
      } else {
        await likePost({ postId: postIdToLike, isLiked: true }).unwrap();
      }
      // No refetch needed - optimistic update is sufficient
      // Data will be correct on next page load/refresh
    } catch (error) {
      console.error("Failed to like post:", error);
      // Revert optimistic updates on error
      queryClient.invalidateQueries({ queryKey: ["newsFeed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    }
  };

  const handleShareClick = () => {
    // Redirect to login if not authenticated
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (!post?.id) return;

    // Open share preview modal
    setIsSharePreviewModalOpen(true);
  };

  const handleConfirmShare = async () => {
    if (!post?.id || isSharing) return;

    try {
      await sharePost({ post: post.id }).unwrap();
      toast.success("Post shared successfully!");
      setIsSharePreviewModalOpen(false);
    } catch (error: unknown) {
      console.error("Failed to share post:", error);
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        'Failed to share post';
      toast.error('Failed to share post', {
        description: errorMessage,
      });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Comment on the post itself (for shared posts, comment on the shared post, not the original)
    const postIdForComment = post?.id;
    if (!commentText.trim() || !postIdForComment || isCreatingComment) return;

    // Redirect to login if not authenticated
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      await createComment({
        post: postIdForComment,
        content: commentText,
      }).unwrap();
      setCommentText("");
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reply on the post itself (for shared posts, reply on the shared post, not the original)
    const postIdForReply = post?.id;
    if (!replyText.trim() || !postIdForReply || !replyingTo || isCreatingComment) return;

    try {
      await createComment({
        post: postIdForReply,
        content: replyText,
        parent: replyingTo.id,
      }).unwrap();
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to create reply:", error);
    }
  };

  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? "just now" : `${minutes}m ago`;
    }
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const toggleReplies = (commentId: number | string) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleEditComment = (commentId: number | string, currentContent: string) => {
    setEditingComment(commentId);
    setEditText(currentContent);
  };

  const handleUpdateComment = async (e: React.FormEvent, commentId: number | string) => {
    e.preventDefault();
    if (!editText.trim() || !post?.id || isUpdatingComment) return;

    try {
      await updateComment({
        commentId,
        content: editText,
        postId: post.id,
      }).unwrap();
      setEditingComment(null);
      setEditText("");
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDeleteComment = (commentId: number | string) => {
    if (!post?.id) return;
    setCommentToDelete(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!post?.id || commentToDelete == null) return;
    try {
      await deleteComment({
        commentId: commentToDelete,
        postId: post.id,
      }).unwrap();
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setCommentToDelete(null);
    }
  };

  const cancelDeleteComment = () => {
    setCommentToDelete(null);
  };

  const handleFollowClick = async () => {
    // Redirect to login if not authenticated
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (!postUserId) {
      console.error("User ID not found in post data");
      return;
    }

    try {
      if (isFollowingUser && followingId) {
        // Unfollow
        await unfollowUser({ followingId }).unwrap();
        setIsFollowingUser(false);
        setFollowingId(null);
      } else {
        // Follow
        const result = await followUser({ userId: postUserId }).unwrap();
        const followId = (result as { id?: number | string; following_id?: number | string; data?: { id?: number | string; following_id?: number | string } })?.id ||
          (result as { id?: number | string; following_id?: number | string; data?: { id?: number | string; following_id?: number | string } })?.following_id ||
          (result as { id?: number | string; following_id?: number | string; data?: { id?: number | string; following_id?: number | string } })?.data?.id ||
          (result as { id?: number | string; following_id?: number | string; data?: { id?: number | string; following_id?: number | string } })?.data?.following_id;
        if (followId) {
          setFollowingId(followId);
          setIsFollowingUser(true);
        }
      }
    } catch (error) {
      console.error("Failed to follow/unfollow user:", error);
    }
  };

  // Check if post is created by another user (not the current user)
  const isOtherUserPost = postUserId && profile?.id && String(postUserId) !== String(profile.id);

  // Check if post belongs to current user
  const isCurrentUserPost = postUserId && profile?.id && String(postUserId) === String(profile.id);

  const handleEditPost = () => {
    setIsEditModalOpen(true);
  };

  const handleDeletePost = () => {
    if (!post?.id) return;
    setPostToDelete(post.id);
  };

  const confirmDeletePost = async () => {
    if (!post?.id || postToDelete == null) return;
    try {
      await deletePost({ postId: postToDelete }).unwrap();
      setPostToDelete(null);
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setPostToDelete(null);
    }
  };

  const cancelDeletePost = () => {
    setPostToDelete(null);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
  };

  const renderComment = (comment: CommentItem & { replies: CommentItem[] }, depth = 0) => {
    const commentAuthor = comment.author || comment.user;
    const authorName = commentAuthor?.username || comment.username || comment.user_name || "Anonymous";
    const authorAvatar = commentAuthor?.avatar || comment.avatar;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);
    const isCurrentUserComment = profile?.username === authorName;
    const isEditing = editingComment === comment.id;

    return (
      <div key={comment.id} className="relative">
        {/* Vertical line for nested comments */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-700" />
        )}

        <div className={`${depth > 0 ? "ml-10" : ""} pb-4`}>
          <div className="flex gap-2">
            {authorAvatar ? (
              <Image
                src={
                  authorAvatar.startsWith('http')
                    ? authorAvatar
                    : `${getApiBaseUrl()}${authorAvatar.startsWith('/') ? authorAvatar.slice(1) : authorAvatar}`
                }
                alt={authorName}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white">{authorName}</span>
                <span className="text-xs text-white/50">• {formatCommentTime(comment.created_at)}</span>
              </div>

              {isEditing ? (
                <form onSubmit={(e) => handleUpdateComment(e, comment.id)} className="space-y-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-slate-700/50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isUpdatingComment || !editText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded-md transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingComment(null);
                        setEditText("");
                      }}
                      className="text-white/60 hover:text-white text-xs px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-sm text-white/90 mb-2 break-words">{comment.content}</p>

                  <div className="flex items-center gap-4">

                    <button
                      onClick={() => setReplyingTo({ id: comment.id, username: authorName })}
                      className="text-xs text-white/60 hover:text-white transition-colors"
                    >
                      Reply
                    </button>
                    {isCurrentUserComment && (
                      <>
                        <button
                          onClick={() => handleEditComment(comment.id, comment.content)}
                          className="text-xs text-white/60 hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reply Input */}
          {replyingTo?.id === comment.id && (
            <div className="mt-3 ml-10 flex gap-2">
              <div className="flex-1 flex gap-2 items-start">
                {profile?.avatar ? (
                  <Image
                    src={`${profile.avatar}`}
                    alt={profile.username}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                    {profile?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1">
                  <form onSubmit={handleReplySubmit} className="space-y-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${replyingTo.username}...`}
                      className="w-full bg-slate-700/50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isCreatingComment || !replyText.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded-md transition-colors"
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                        className="text-white/60 hover:text-white text-xs px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Replies - Collapsible */}
          {hasReplies && (
            <div className="mt-3">
              <button
                onClick={() => toggleReplies(comment.id)}
                className="ml-10 px-3 py-1 bg-slate-700/50 hover:bg-slate-700 text-xs text-white/80 rounded-full transition-colors"
              >
                {isExpanded
                  ? `Hide ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`
                  : `View ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`
                }
              </button>

              {isExpanded && (
                <div className="mt-3">
                  {comment.replies.map((reply) => renderComment({ ...reply, replies: reply.replies || [] }, depth + 1))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderImageGallery = () => {
    if (allMediaUrls.length === 0) return null;

    const imageCount = allMediaUrls.length;
    const displayImages = imageCount > 5 ? allMediaUrls.slice(0, 5) : allMediaUrls;
    const remainingCount = imageCount > 5 ? imageCount - 5 : 0;

    // 1 media: full width
    if (imageCount === 1) {
      const isVideo = isVideoUrl(allMediaUrls[0], 0);
      return (
        <div className="rounded-lg overflow-hidden cursor-pointer relative" onClick={() => handleImageClick(0)}>
          {isVideo ? (
            <div className="relative w-full h-[50vh]">
              <video
                src={allMediaUrls[0]}
                className="w-full h-full object-contain"
                muted
                preload="metadata"
                playsInline
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  video.currentTime = 0.1;
                }}
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm">
                  <svg
                    className="w-8 h-8 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <Image
              src={allMediaUrls[0]}
              alt={post?.title || "post media"}
              width={800}
              height={400}
              className="w-full h-[50vh] object-contain"
              unoptimized
            />
          )}
        </div>
      );
    }

    // 2 media: 2 column grid
    if (imageCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
          {displayImages.map((url, idx) => {
            const isVideo = isVideoUrl(url, idx);
            return (
              <div key={idx} className="relative aspect-square cursor-pointer" onClick={() => handleImageClick(idx)}>
                {isVideo ? (
                  <>
                    <video
                      src={url}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      preload="metadata"
                      playsInline
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        video.currentTime = 0.1;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm">
                        <svg
                          className="w-5 h-5 text-white ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <Image
                    src={url}
                    alt={`${post?.title || "post"} ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // 3 media: first full width, second row 2 columns
    if (imageCount === 3) {
      const renderMediaItem = (url: string, idx: number, className: string) => {
        const isVideo = isVideoUrl(url, idx);
        return (
          <div className={className} onClick={() => handleImageClick(idx)}>
            {isVideo ? (
              <>
                <video
                  src={url}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  preload="metadata"
                  playsInline
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    video.currentTime = 0.1;
                  }}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-5 h-5 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <Image
                src={url}
                alt={`${post?.title || "post"} ${idx + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            )}
          </div>
        );
      };

      return (
        <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
          {renderMediaItem(allMediaUrls[0], 0, "row-span-2 relative cursor-pointer")}
          {renderMediaItem(allMediaUrls[1], 1, "relative aspect-square cursor-pointer")}
          {renderMediaItem(allMediaUrls[2], 2, "relative aspect-square cursor-pointer")}
        </div>
      );
    }

    // 4 media: 2x2 grid
    if (imageCount === 4) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
          {displayImages.map((url, idx) => {
            const isVideo = isVideoUrl(url, idx);
            return (
              <div key={idx} className="relative aspect-square cursor-pointer" onClick={() => handleImageClick(idx)}>
                {isVideo ? (
                  <>
                    <video
                      src={url}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      preload="metadata"
                      playsInline
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        video.currentTime = 0.1;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm">
                        <svg
                          className="w-5 h-5 text-white ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <Image
                    src={url}
                    alt={`${post?.title || "post"} ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // 5 media: first row 2, second row 3
    if (imageCount === 5) {
      const renderMediaItem = (url: string, idx: number) => {
        const isVideo = isVideoUrl(url, idx);
        return (
          <div className="relative aspect-square cursor-pointer" onClick={() => handleImageClick(idx)}>
            {isVideo ? (
              <>
                <video
                  src={url}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  preload="metadata"
                  playsInline
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    video.currentTime = 0.1;
                  }}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-5 h-5 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <Image
                src={url}
                alt={`${post?.title || "post"} ${idx + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            )}
          </div>
        );
      };

      return (
        <div className="space-y-2 rounded-lg overflow-hidden">
          {/* First row: 2 media */}
          <div className="grid grid-cols-2 gap-2">
            {renderMediaItem(allMediaUrls[0], 0)}
            {renderMediaItem(allMediaUrls[1], 1)}
          </div>
          {/* Second row: 3 media */}
          <div className="grid grid-cols-3 gap-2">
            {renderMediaItem(allMediaUrls[2], 2)}
            {renderMediaItem(allMediaUrls[3], 3)}
            {renderMediaItem(allMediaUrls[4], 4)}
          </div>
        </div>
      );
    }

    // More than 5 media: first row 2, second row 3 (last one with overlay)
    const renderMediaItem = (url: string, idx: number, showOverlay = false) => {
      const isVideo = isVideoUrl(url, idx);
      return (
        <div className="relative aspect-square cursor-pointer" onClick={() => handleImageClick(idx)}>
          {isVideo ? (
            <>
              <video
                src={url}
                className={`absolute inset-0 w-full h-full object-cover ${showOverlay ? 'opacity-30' : ''}`}
                muted
                preload="metadata"
                playsInline
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  video.currentTime = 0.1;
                }}
              />
              {!showOverlay && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-5 h-5 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Image
              src={url}
              alt={`${post?.title || "post"} ${idx + 1}`}
              fill
              className={`object-cover ${showOverlay ? 'opacity-30' : ''}`}
              unoptimized
            />
          )}
          {showOverlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center text-white">
                <div className="text-2xl font-bold">+{remainingCount}</div>
                <div className="text-sm">more</div>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-2 rounded-lg overflow-hidden">
        {/* First row: 2 media */}
        <div className="grid grid-cols-2 gap-2">
          {renderMediaItem(allMediaUrls[0], 0)}
          {renderMediaItem(allMediaUrls[1], 1)}
        </div>
        {/* Second row: 3 media (last one with overlay) */}
        <div className="grid grid-cols-3 gap-2">
          {renderMediaItem(allMediaUrls[2], 2)}
          {renderMediaItem(allMediaUrls[3], 3)}
          {renderMediaItem(allMediaUrls[4], 4, true)}
        </div>
      </div>
    );
  };

  // Get username for navigation
  const username = post?.user_name || post?.username || post?.author?.username || post?.user_id;

  const handleUserClick = () => {
    if (username) {
      router.push(`/main/user/${username}`);
    }
  };

  return (
    <div className="border border-slate-600 md:p-6 p-4 w-full rounded">
      <div className="flex justify-between items-center mb-5">
        <div
          className="flex items-center gap-[7px] cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleUserClick}
        >
          {post?.avatar && typeof post.avatar === 'string' ? (
            <Image
              src={post.avatar.startsWith('http')
                ? post.avatar
                : `${getApiBaseUrl()}${post.avatar.startsWith('/') ? post.avatar.slice(1) : post.avatar}`}
              alt={post?.author?.name || post?.user_name || post?.username || "Author Avatar"}
              width={32}
              height={32}
              className="h-[30px] w-[30px] md:h-[32px] md:w-[32px] rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="h-[30px] w-[30px] md:h-[32px] md:w-[32px] rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
              {(post?.user_name || post?.username || post?.author?.username || "A").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center md:gap-3.5 text-sm text-white">
            <p>{post?.user_name || post?.username || "Author Name"}</p>
            <p className="text-white/70 text-xs sm:text-sm ml-1">{createdAt}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCurrentUserPost && (
            <>
              <button
                onClick={handleEditPost}
                className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                title="Edit post"
              >
                <FiEdit2 size={18} />
              </button>
              <button
                onClick={handleDeletePost}
                disabled={isDeletingPost}
                className="text-red-400/60 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10 disabled:opacity-50"
                title="Delete post"
              >
                <FiTrash2 size={18} />
              </button>
            </>
          )}
          {!isCurrentUserPost && (
            <button
              onClick={() => {
                if (!token) {
                  router.push("/auth/login");
                  return;
                }
                setIsReportModalOpen(true);
              }}
              className="text-red-400/60 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"
              title="Report post"
            >
              <FiFlag size={18} />
            </button>
          )}
          {isOtherUserPost && (
            <button
              onClick={handleFollowClick}
              disabled={isFollowing || isUnfollowing}
              className={`text-xs cursor-pointer text-white px-4 py-1.5 rounded-full border border-white/10 transition-colors ${(isFollowing || isUnfollowing)
                && "bg-slate-600 opacity-50 cursor-not-allowed"

                }`}
            >
              {isFollowing || isUnfollowing
                ? (isFollowing ? "Following..." : "Unfollowing...")
                : (isFollowingUser ? "Unfollow" : "Follow")}
            </button>
          )}
        </div>
      </div>

      <div>
        {/* Shared Post Indicator */}
        {(post?.original_post && ((): React.ReactElement | null => {
          const isCurrentUserShare = profile?.username === (post?.user_name || post?.username);
          const originalPostId = post.original_post.id;
          const contentValue = post.original_post.content;
          const originalPostContent: string | null = typeof contentValue === 'string' && contentValue ? contentValue : null;

          const renderContent = (): React.ReactNode => {
            if (!originalPostContent) return null;
            return React.createElement('div', {
              dangerouslySetInnerHTML: { __html: originalPostContent },
              className: "text-base text-white whitespace-pre-line mb-3"
            });
          };

          return (
            <div
              className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors"
              onClick={() => {
                if (originalPostId) {
                  router.push(`/main/post/${originalPostId}`);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FaRegShareFromSquare className="text-green-400" size={16} />
                <span className="text-sm text-white/80">
                  {isCurrentUserShare ? (
                    <>
                      <span className="font-semibold text-white">You</span>
                      {" shared "}
                      <span className="font-semibold text-white">{post.original_post.user_name || "someone"}&apos;s post</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-white">{post?.user_name || post?.username || "User"}</span>
                      {" shared "}
                      <span className="font-semibold text-white">{post.original_post.user_name || "someone"}&apos;s post</span>
                    </>
                  )}
                </span>
              </div>
              {/* Original Post Content - Full Display */}
              <div className="pl-4 border-l-2 border-slate-600">
                {/* Original Post Author */}
                <div className="flex items-center gap-2 mb-3">
                  {post.original_post.avatar && typeof post.original_post.avatar === 'string' ? (
                    <Image
                      src={post.original_post.avatar.startsWith('http')
                        ? post.original_post.avatar
                        : `${getApiBaseUrl()}${post.original_post.avatar.startsWith('/') ? post.original_post.avatar.slice(1) : post.original_post.avatar}`}
                      alt={post.original_post.user_name || "Original Author"}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                      {(post.original_post.user_name || "A").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-white font-medium">
                    {post.original_post.user_name || "Original Author"}
                  </span>
                </div>

                {/* Original Post Title */}
                {post.original_post.title && (
                  <h3 className="text-xl font-bold text-white mb-3 break-words">
                    {post.original_post.title}
                  </h3>
                )}

                {/* Original Post Content */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {renderContent() as any}

                {/* Original Post Media - Full Gallery */}
                {originalPostMediaUrls.length > 0 && (
                  <div className="mb-3">
                    {originalPostMediaUrls.length === 1 ? (
                      <div className="rounded-lg overflow-hidden">
                        {isVideoUrl(originalPostMediaUrls[0], 0) ? (
                          <video
                            src={originalPostMediaUrls[0]}
                            className="w-full h-auto max-h-[50vh] object-contain"
                            muted
                            preload="metadata"
                            playsInline
                            onLoadedMetadata={(e) => {
                              const video = e.currentTarget;
                              video.currentTime = 0.1;
                            }}
                          />
                        ) : (
                          <Image
                            src={originalPostMediaUrls[0]}
                            alt={post.original_post.title || "Shared post media"}
                            width={800}
                            height={400}
                            className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
                            unoptimized
                          />
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                        {originalPostMediaUrls.slice(0, 4).map((url, idx) => (
                          <div key={idx} className="relative aspect-square">
                            {isVideoUrl(url, idx) ? (
                              <video
                                src={url}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                                playsInline
                              />
                            ) : (
                              <Image
                                src={url}
                                alt={`${post.original_post?.title || "Shared post"} ${idx + 1}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            )}
                          </div>
                        ))}
                        {originalPostMediaUrls.length > 4 && (
                          <div className="relative aspect-square bg-slate-700 flex items-center justify-center">
                            <span className="text-white text-lg font-semibold">
                              +{originalPostMediaUrls.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Original Post Link */}
                {post.original_post.link && typeof post.original_post.link === 'string' && (
                  <div className="mt-3">
                    <a
                      href={post.original_post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      <span className="break-all">{post.original_post.link}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })()) as React.ReactElement | null}

        <div className="mb-5">
          {/* Post Title - Bold - Only show if not a shared post */}
          {/* For shared posts, title is shown in the original_post section, so don't show it here */}
          {post?.title && !post?.original_post && (
            <h2
              className="text-xl font-bold text-white mb-3 break-words cursor-pointer hover:text-blue-400 transition-colors"
              onClick={() => {
                if (post.id) {
                  router.push(`/main/post/${post.id}`);
                }
              }}
            >
              {post.title}
            </h2>
          )}
          {/* Post Content - Only show if not a shared post */}
          {!post?.original_post && (
            <p dangerouslySetInnerHTML={{ __html: truncatedContent }} className="text-base text-white whitespace-pre-line">
            </p>
          )}
          {shouldTruncate && (
            <button
              onClick={() => setIsContentExpanded(!isContentExpanded)}
              className="text-base text-white font-bold mt-2 hover:underline cursor-pointer"
            >
              {isContentExpanded ? "See less" : "See more"}
            </button>
          )}
          {/* Post Link - Clickable */}
          {(post as { link?: string }).link && (
            <div className="mt-4">
              <a
                href={(post as { link?: string }).link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span className="break-all">{(post as { link?: string }).link}</span>
              </a>
            </div>
          )}
        </div>

        {videoUrl && !post?.original_post && (
          <div className="mb-5">
            <div
              className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/10 cursor-pointer group"
              onClick={() => setIsVideoModalOpen(true)}
            >
              {embedUrl?.includes('youtube.com/embed') ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src={`https://img.youtube.com/vi/${embedUrl.split('/').pop()}/maxresdefault.jpg`}
                    alt="Video thumbnail"
                    fill
                    className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    unoptimized
                  />
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="absolute bottom-4 text-white/70 text-sm">Play external video</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!post?.original_post && allMediaUrls.length > 0 && (
          <div className="mb-5">
            {renderImageGallery()}
          </div>
        )}
        {/* Post Tags - Hashtags */}
        {post?.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4">
        <button
          onClick={handleLikeClick}
          disabled={isLiking}
          className={`text-sm text-white cursor-pointer flex items-center gap-2 px-2.5 py-[5px] rounded-full transition-colors ${isLiked
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-slate-700 hover:bg-slate-600"
            } ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLiked ? (
            <AiFillLike size={18} className="text-blue-200" />
          ) : (
            <VscThumbsup size={18} />
          )}{" "}
          {likeCount}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-white cursor-pointer flex items-center gap-2 px-2.5 py-[5px] bg-slate-700 rounded-full"
        >
          <FaRegComment size={18} /> {post?.comments_count as number || 0}
        </button>
        <button
          type="button"
          onClick={() => {
            console.log("Share button onClick triggered");
            handleShareClick();
          }}
          className="text-sm text-white cursor-pointer flex items-center gap-2 px-2.5 py-[5px] bg-slate-700 rounded-full hover:bg-slate-600 transition-colors"
        >
          <FaRegShareFromSquare size={18} /> Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <div className="flex gap-3">
              {profile?.avatar ? (
                <Image
                  src={`${profile.avatar}`}
                  alt={profile.username}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {profile?.username?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-slate-700/50 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isCreatingComment || !commentText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-full p-2 transition-colors"
                >
                  <BiSend size={18} />
                </button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="text-white/60 text-center py-4">Loading comments...</div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.slice(0, visibleCommentsCount).map((comment) => (
                <div key={comment.id}>
                  {renderComment(comment)}
                </div>
              ))}
              {/* Show "Show more" button only after the last visible comment, aligned left like replies button */}
              {visibleCommentsCount < comments.length && (
                <div className="mt-3">
                  <button
                    onClick={() => setVisibleCommentsCount((prev) => Math.min(prev + 10, comments.length))}
                    className="ml-10 px-3 py-1 bg-slate-700/50 hover:bg-slate-700 text-xs text-white/80 rounded-full transition-colors"
                  >
                    Show more comments
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/60 text-center py-8">No comments yet. Be the first to comment!</div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      <CustomDialog
        open={isImageModalOpen}
        onOpenChange={setIsImageModalOpen}
        maxWidth="full"
        maxHeight="90vh"
        contentClassName="p-0 bg-black/80 border-none"
      >
        <div className="relative w-full h-[90vh] flex items-center justify-center">
          {/* Previous Button */}
          {allMediaUrls.length > 1 && (
            <button
              onClick={handlePreviousImage}
              className="absolute left-4 z-50 rounded-full bg-black/70 p-3 text-white hover:bg-black/90 transition-colors"
            >
              <IoChevronBack size={28} />
            </button>
          )}

          {/* Media (Image or Video) */}
          {allMediaUrls[currentImageIndex] && (
            <div className="relative w-full h-full flex items-center justify-center">
              {isVideoUrl(allMediaUrls[currentImageIndex], currentImageIndex) ? (
                <video
                  src={allMediaUrls[currentImageIndex]}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <Image
                  src={allMediaUrls[currentImageIndex]}
                  alt={`${post?.title || "post"} ${currentImageIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain"
                  unoptimized
                />
              )}
            </div>
          )}

          {/* Next Button */}
          {allMediaUrls.length > 1 && (
            <button
              onClick={handleNextImage}
              className="absolute right-4 z-50 rounded-full bg-black/70 p-3 text-white hover:bg-black/90 transition-colors"
            >
              <IoChevronForward size={28} />
            </button>
          )}

          {/* Image Counter */}
          {allMediaUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white text-sm">
              {currentImageIndex + 1} / {allMediaUrls.length}
            </div>
          )}
        </div>
      </CustomDialog>

      {/* Video Embed Modal */}
      <CustomDialog
        open={isVideoModalOpen}
        onOpenChange={setIsVideoModalOpen}
        maxWidth="4xl"
        maxHeight="90vh"
        title="Video Preview"
        contentClassName="bg-black/95 p-0 border-none"
      >
        <div className="relative w-full aspect-video">
          {embedUrl && (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </CustomDialog>

      {/* Delete Comment Confirm Dialog */}
      <ConfirmDialog
        open={commentToDelete !== null}
        title="Delete comment?"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteComment}
        onCancel={cancelDeleteComment}
      />

      {/* Delete Post Confirm Dialog */}
      <ConfirmDialog
        open={postToDelete !== null}
        title="Delete post?"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDeletePost}
        onCancel={cancelDeletePost}
      />

      {/* Edit Post Modal */}
      <EditPost
        post={post}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />


      {/* Report Post Modal */}
      <ReportPostModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        postId={post?.id || 0}
        postTitle={post?.title}
      />

      {/* Share Preview Modal */}
      <CustomDialog
        open={isSharePreviewModalOpen}
        onOpenChange={setIsSharePreviewModalOpen}
        maxWidth="2xl"
        maxHeight="90vh"
        contentClassName="overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Share Post</h2>
          <p className="text-white/70 mb-6">This is how your shared post will appear:</p>

          {/* Preview of Shared Post */}
          {(() => {
            const contentValue = post?.content;
            const previewContent: string | null = typeof contentValue === 'string' && contentValue ? contentValue : null;

            const renderPreviewContent = (): React.ReactNode => {
              if (!previewContent) return null;
              return React.createElement('div', {
                dangerouslySetInnerHTML: { __html: previewContent },
                className: "text-base text-white whitespace-pre-line mb-3"
              });
            };

            return (
              <div className="border border-slate-600 rounded-lg p-4 bg-slate-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <FaRegShareFromSquare className="text-green-400" size={16} />
                  <span className="text-sm text-white/80">
                    <span className="font-semibold text-white">You</span>
                    {" shared "}
                    <span className="font-semibold text-white">{post?.user_name || post?.username || "someone"}&apos;s post</span>
                  </span>
                </div>

                {/* Original Post Content Preview */}
                <div className="pl-4 border-l-2 border-slate-600">
                  {/* Original Post Author */}
                  <div className="flex items-center gap-2 mb-3">
                    {post?.avatar && typeof post.avatar === 'string' ? (
                      <Image
                        src={post.avatar.startsWith('http')
                          ? post.avatar
                          : `${getApiBaseUrl()}${post.avatar.startsWith('/') ? post.avatar.slice(1) : post.avatar}`}
                        alt={post?.user_name || post?.username || "Author"}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                        {(post?.user_name || post?.username || "A").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-white font-medium">
                      {post?.user_name || post?.username || "Author"}
                    </span>
                  </div>

                  {/* Original Post Title */}
                  {post?.title && (
                    <h3 className="text-xl font-bold text-white mb-3 break-words">
                      {post.title}
                    </h3>
                  )}

                  {/* Original Post Content */}
                  {/* Original Post Content */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {renderPreviewContent() as any}

                  {/* Original Post Media Preview */}
                  {allMediaUrls.length > 0 && (
                    <div className="mb-3">
                      {allMediaUrls.length === 1 ? (
                        <div className="rounded-lg overflow-hidden">
                          {isVideoUrl(allMediaUrls[0], 0) ? (
                            <video
                              src={allMediaUrls[0]}
                              className="w-full h-auto max-h-[40vh] object-contain"
                              muted
                              preload="metadata"
                              playsInline
                            />
                          ) : (
                            <Image
                              src={allMediaUrls[0]}
                              alt={post?.title || "Post media"}
                              width={800}
                              height={400}
                              className="w-full h-auto max-h-[40vh] object-contain rounded-lg"
                              unoptimized
                            />
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                          {allMediaUrls.slice(0, 4).map((url, idx) => (
                            <div key={idx} className="relative aspect-square">
                              {isVideoUrl(url, idx) ? (
                                <video
                                  src={url}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                  playsInline
                                />
                              ) : (
                                <Image
                                  src={url}
                                  alt={`${post?.title || "Post"} ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              )}
                            </div>
                          ))}
                          {allMediaUrls.length > 4 && (
                            <div className="relative aspect-square bg-slate-700 flex items-center justify-center">
                              <span className="text-white text-lg font-semibold">
                                +{allMediaUrls.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Original Post Link */}
                  {post?.link && typeof post.link === 'string' && (
                    <div className="mt-3">
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                        <span className="break-all">{post.link}</span>
                      </a>
                    </div>
                  )}

                  {/* Original Post Engagement (Like/Comment counts) */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-700">
                    <div className="text-sm text-white flex items-center gap-2">
                      <VscThumbsup size={18} />
                      <span>{post?.likes_count || 0}</span>
                    </div>
                    <div className="text-sm text-white flex items-center gap-2">
                      <FaRegComment size={18} />
                      <span>{post?.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() as React.ReactElement | null}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsSharePreviewModalOpen(false)}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
              disabled={isSharing}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmShare}
              disabled={isSharing}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sharing...
                </>
              ) : (
                <>
                  <FaRegShareFromSquare size={16} />
                  Share Post
                </>
              )}
            </button>
          </div>
        </div>
      </CustomDialog>
    </div>
  );
};

export default Post;