"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import UserProfileHeader from "./_components/UserProfileHeader";
import Post from "../Main/Post/Post";
import UserProfileSidebar from "./_components/UserProfileSidebar";
import { useGetUserProfileQuery, useToggleFollowMutation, useUpdatePostMutation, type PostItem } from "@/store/postApi";
import { useGetCurrentUserProfileQuery, useGetPublicUsersQuery } from "@/store/authApi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMessage } from "@/contexts/MessageContext";
import { FiMenu, FiX } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import EmptyPostsState from "../../Shared/EmptyPostsState";
import ErrorState from "../../Shared/ErrorState";
import { useUserPostsInfinite } from "@/hooks/useUserPostsInfinite";

const UserProfile = () => {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;
  const { openMessagePopup } = useMessage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Get current user to check if viewing own profile
  const { data: currentUserProfile } = useGetCurrentUserProfileQuery();
  const currentUserId = currentUserProfile?.data?.id;

  // Get all users to find user by username (using public endpoint that allows authenticated users)
  const { data: usersResponse } = useGetPublicUsersQuery();

  // Resolve user ID from username or ID
  const userId = useMemo(() => {
    // If username is a number, treat it as ID
    if (!isNaN(Number(username))) {
      return username;
    }

    // Otherwise, find user by username
    const user = usersResponse?.data?.find((u: { username?: string; id?: string | number }) =>
      u.username === username
    );

    return user?.id || username; // Fallback to username if not found
  }, [username, usersResponse]);

  const { data: userProfileResponse, isLoading: isProfileLoading, refetch: refetchProfile } = useGetUserProfileQuery(userId, {
    skip: !userId || !username,
  });

  // Use infinite query for user posts
  const {
    data: postsResponse,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPostsLoading,
    isError: isPostsError,
    refetch: refetchPosts,
  } = useUserPostsInfinite(userId);

  // Track if initial load is complete
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Mark initial load as complete once we have data and are not loading
  useEffect(() => {
    if (!isPostsLoading && postsResponse && postsResponse.pages && postsResponse.pages.length > 0 && !isInitialLoadComplete) {
      // Small delay to ensure initial render is complete
      const timer = setTimeout(() => {
        setIsInitialLoadComplete(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPostsLoading, postsResponse, isInitialLoadComplete]);

  // Only set up intersection observer if we have posts loaded and more pages available
  const hasInitialData = postsResponse && postsResponse.pages && postsResponse.pages.length > 0;
  const allPosts = useMemo((): PostItem[] => {
    return postsResponse?.posts || [];
  }, [postsResponse]);

  const shouldObserve = hasNextPage && !isPostsLoading && allPosts.length > 0 && hasInitialData && isInitialLoadComplete;

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px", // Small margin to start loading before reaching exact bottom
    triggerOnce: false,
  });

  // Load more when scrolled to bottom - only if initial load is complete
  useEffect(() => {
    if (inView && shouldObserve && !isFetchingNextPage && isInitialLoadComplete) {
      fetchNextPage();
    }
  }, [inView, shouldObserve, isFetchingNextPage, isInitialLoadComplete, fetchNextPage]);

  const [toggleFollow, { isLoading: isTogglingFollow }] = useToggleFollowMutation();
  const [updatePost] = useUpdatePostMutation();

  const userProfile = userProfileResponse?.data;
  const isFollowing = userProfile?.is_following || false;
  const isOwnProfile = currentUserId && userId && String(currentUserId) === String(userId);

  // Separate approved posts and drafts (only for own profile)
  const { approvedPosts, draftPosts } = useMemo(() => {
    const allPosts: PostItem[] = (() => {
      if (!postsResponse) return [];
      if (Array.isArray(postsResponse)) return postsResponse;
      if (typeof postsResponse === 'object' && postsResponse !== null) {
        if (Array.isArray((postsResponse as { posts?: PostItem[] }).posts)) {
          return (postsResponse as { posts: PostItem[] }).posts;
        }
      }
      return [];
    })();

    const approved = allPosts.filter(p => p.status === 'approved' || !p.status);
    const drafts = isOwnProfile ? allPosts.filter(p => p.status === 'draft') : [];

    return { approvedPosts: approved, draftPosts: drafts };
  }, [postsResponse, isOwnProfile]);

  const handlePublishDraft = async (postId: number | string) => {
    try {
      await updatePost({
        postId,
        data: { status: "approved" }
      }).unwrap();
      toast.success("Post published successfully!");
      refetchPosts();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to publish post";
      toast.error(errorMessage);
    }
  };

  const posts = useMemo((): PostItem[] => {
    if (!postsResponse) return [];

    if (Array.isArray(postsResponse)) {
      return postsResponse;
    }

    if (typeof postsResponse === 'object' && postsResponse !== null) {
      if (Array.isArray((postsResponse as { posts?: PostItem[] }).posts)) {
        return (postsResponse as { posts: PostItem[] }).posts;
      }
    }

    return [];
  }, [postsResponse]);

  const handleFollowToggle = async () => {
    if (!userId) return;

    try {
      await toggleFollow({ userId }).unwrap();
      refetchProfile();
      toast.success(isFollowing ? "Unfollowed successfully" : "Followed successfully");
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to update follow status";
      toast.error(errorMessage);
    }
  };

  const handleSendMessage = () => {
    // Find user data from users list
    const user = usersResponse?.data?.find((u: { id?: string | number; username?: string }) =>
      String(u.id) === String(userId) || u.username === username
    );

    if (user) {
      // Open message popup with the selected user
      openMessagePopup({
        id: String(user.id),
        name: user.display_name || user.username || username,
        username: user.username || String(user.id),
        avatar: user.avatar || user.profile_image || "/profile.jpg",
        isOnline: Boolean(user.is_online),
        lastSeen: (user as { last_seen?: string }).last_seen,
      });
    } else {
      // Fallback: navigate to messages page if user not found in list
      router.push(`/main/messages?user=${userId}`);
    }
  };

  const renderPosts = () => {
    if (isPostsLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse border border-white/10 rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10" />
                <div className="h-3 w-32 rounded bg-white/10" />
              </div>
              <div className="h-3 w-full rounded bg-white/10" />
              <div className="h-48 rounded bg-white/5" />
            </div>
          ))}
        </div>
      );
    }

    if (isPostsError) {
      return (
        <ErrorState
          message="Failed to load posts. Please try again later."
          onRetry={() => refetchPosts()}
        />
      );
    }

    if (!approvedPosts.length && !draftPosts.length) {
      return (
        <EmptyPostsState
          message={`${userProfile?.username || "This user"} hasn't created any posts yet`}
          showCreateButton={false}
        />
      );
    }

    return (
      <>
        <div className="space-y-6">
          {/* Approved Posts */}
          {approvedPosts.map((post) => (
            <Post key={post.id} post={post} profile={currentUserProfile?.data} />
          ))}

          {/* Draft Posts Section (only for own profile) */}
          {isOwnProfile && draftPosts.length > 0 && (
            <>
              <div className="border-t border-white/10 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-white/70 mb-4">Drafts</h3>
                <div className="space-y-6">
                  {draftPosts.map((post) => (
                    <div key={post.id} className="relative">
                      <Post post={post} profile={currentUserProfile?.data} />
                      <button
                        onClick={() => handlePublishDraft(post.id)}
                        className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all duration-300 z-10"
                      >
                        Publish
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        {/* Infinite scroll trigger - Only render when initial load is complete */}
        {hasNextPage && allPosts.length > 0 && isInitialLoadComplete && (
          <div
            ref={ref}
            className="h-20 flex flex-col items-center justify-center py-4 w-full gap-2"
            style={{ minHeight: '80px' }}
          >
            {isFetchingNextPage && (
              <>
                <Loader2 className="animate-spin text-white/60" size={24} />
                <div className="text-white/60 text-sm">Loading more posts...</div>
              </>
            )}
          </div>
        )}
        {!hasNextPage && allPosts.length > 0 && (
          <div className="text-center text-white/40 text-sm py-4">
            No more posts to load
          </div>
        )}
      </>
    );
  };

  if (isProfileLoading || !usersResponse) {
    return (
      <div className="mx-auto flex gap-10 pt-6 lg:p-4">
        {/* Main Content */}
        <div className="w-full bg-[#06133F]/75 backdrop-blur-[17.5px] rounded-lg p-4 xl:p-10">
          {/* Header Skeleton */}
          <div className="border-b border-white/10 pb-4 mb-6">
            <div className="animate-pulse space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Avatar and Name Skeleton */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-48 bg-white/10 rounded" />
                    <div className="h-4 w-32 bg-white/10 rounded" />
                  </div>
                </div>
                {/* Buttons Skeleton */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-10 w-24 bg-white/10 rounded-lg" />
                  <div className="h-10 w-24 bg-white/10 rounded-lg" />
                  <div className="h-10 w-24 bg-white/10 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Posts Skeleton */}
          <div className="mt-6 space-y-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse border border-white/10 rounded-lg p-4 md:p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-24 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-white/10 rounded" />
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                </div>
                <div className="h-48 rounded bg-white/5" />
                <div className="flex items-center gap-4">
                  <div className="h-6 w-16 bg-white/10 rounded" />
                  <div className="h-6 w-16 bg-white/10 rounded" />
                  <div className="h-6 w-16 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div
          style={{ scrollbarGutter: "stable both-edges" }}
          className="h-[90vh] hidden lg:block rounded-lg w-[370px] sticky top-18"
        >
          <div className="space-y-4 animate-pulse">
            {/* Cover Photo Skeleton */}
            <div className="bg-[#06133F]/75 backdrop-blur-[17.5px] rounded-2xl">
              <div className="h-32 bg-white/10 rounded-t-2xl" />
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-white/10 rounded" />
                  <div className="h-4 w-24 bg-white/10 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="h-3 w-20 bg-white/10 rounded" />
                    <div className="h-4 w-8 bg-white/10 rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-20 bg-white/10 rounded" />
                    <div className="h-4 w-8 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            </div>
            {/* Actions Skeleton */}
            <div className="bg-[#06133F]/75 backdrop-blur-[17.5px] rounded-2xl p-4 space-y-3">
              <div className="h-5 w-20 bg-white/10 rounded" />
              <div className="h-12 w-full bg-white/10 rounded-lg" />
              <div className="h-12 w-full bg-white/10 rounded-lg" />
              <div className="h-12 w-full bg-white/10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="mx-auto flex gap-10 pt-6 lg:p-4">
        <div className="w-full bg-[#06133F]/75 backdrop-blur-[17.5px] rounded-lg p-4 xl:p-10">
          <p className="text-red-400 text-sm">User not found.</p>
        </div>
      </div>
    );
  }

  const handleCloseSidebar = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsSidebarOpen(false);
      setIsClosing(false);
    }, 300);
  };

  return (
    <>
      <div className="mx-auto flex gap-10 ">
        <div className="w-full bg-[#06133F]/75 backdrop-blur-[17.5px] p-4 xl:p-10 ">
          <div className="lg:max-w-[47vw] mx-auto">
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center justify-between mb-4 lg:mb-0">
                <div className="flex-1">
                  <UserProfileHeader
                    userId={userId}
                    username={userProfile.username || username}
                    isFollowing={isFollowing}
                    isOwnProfile={isOwnProfile}
                    onFollowToggle={handleFollowToggle}
                    onSendMessage={handleSendMessage}
                    isTogglingFollow={isTogglingFollow}
                  />
                </div>
                {/* Mobile Sidebar Toggle Button */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  aria-label="Open sidebar"
                >
                  <FiMenu size={24} className="text-white" />
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-6 ">
              {renderPosts()}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div
          style={{ scrollbarGutter: "stable both-edges" }}
          className="h-[90vh] hidden lg:block rounded-lg w-[370px] sticky top-36 hover:overflow-y-auto overflow-y-hidden custom-scroll"
        >
          <UserProfileSidebar
            userId={userId}
            userProfile={userProfile}
            isOwnProfile={isOwnProfile}
            onFollowToggle={handleFollowToggle}
            onSendMessage={handleSendMessage}
            isFollowing={isFollowing}
            isTogglingFollow={isTogglingFollow}
          />
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <div
          className={`fixed top-0 right-0 h-full w-full bg-black/50 z-50 duration-300 transition-all lg:hidden ${isClosing ? "opacity-0" : "opacity-100"
            }`}
          onClick={handleCloseSidebar}
        >
          <div
            className={`fixed top-0 right-0 h-full w-[370px] bg-[#06133F]/95 backdrop-blur-[17.5px] shadow-2xl transition-transform duration-300 ease-in-out ${isClosing ? "translate-x-full" : "translate-x-0"
              }`}
            onClick={(e) => e.stopPropagation()}
            style={{ scrollbarGutter: "stable both-edges" }}
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Profile Info</h2>
              <button
                onClick={handleCloseSidebar}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <FiX size={24} className="text-white" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="overflow-y-auto h-[calc(100vh-64px)] custom-scroll p-4">
              <UserProfileSidebar
                userId={userId}
                userProfile={userProfile}
                isOwnProfile={isOwnProfile}
                onFollowToggle={handleFollowToggle}
                onSendMessage={handleSendMessage}
                isFollowing={isFollowing}
                isTogglingFollow={isTogglingFollow}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;

