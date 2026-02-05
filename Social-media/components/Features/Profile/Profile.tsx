"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import ProfileHeader from "./_components/ProfileHeader";
import Post from "../Main/Post/Post";
import ProfileSidebar from "./_components/ProfileSidebar";
import { useGetMyPostsQuery, useUpdatePostMutation, type PostItem } from "@/store/postApi";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import CreatePost from "../CreatePost/CreatePost";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiMenu, FiX } from "react-icons/fi";
import EmptyPostsState from "../../Shared/EmptyPostsState";
import ErrorState from "../../Shared/ErrorState";
import bg from "../../../public/main-bg.jpg";

const Profile = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "posts">("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allLoadedPosts, setAllLoadedPosts] = useState<PostItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerTargetOverview = useRef<HTMLDivElement>(null);
  const observerTargetPosts = useRef<HTMLDivElement>(null);

  const { data: postsResponse, isLoading, isFetching, isError, refetch } = useGetMyPostsQuery(
    { page: currentPage }
  );
  const { data: profileResponse } = useGetCurrentUserProfileQuery();
  const [updatePost] = useUpdatePostMutation();
  const profile = profileResponse?.data;

  // Extract posts from response and handle pagination
  useEffect(() => {
    if (!postsResponse) return;

    let newPosts: PostItem[] = [];

    // Handle different response structures
    if (Array.isArray(postsResponse.data)) {
      newPosts = postsResponse.data;
    } else if (Array.isArray(postsResponse.posts)) {
      newPosts = postsResponse.posts;
    } else if (postsResponse.results) {
      if (Array.isArray(postsResponse.results)) {
        newPosts = postsResponse.results;
      } else if (postsResponse.results.data && Array.isArray(postsResponse.results.data)) {
        newPosts = postsResponse.results.data;
      }
    }

    // Check if there are more pages
    const hasNextPage = postsResponse.next !== null && postsResponse.next !== undefined;
    setHasMore(hasNextPage);

    // Accumulate posts
    if (currentPage === 1) {
      // First page - replace all posts
      setAllLoadedPosts(newPosts);
    } else {
      // Subsequent pages - append new posts
      setAllLoadedPosts(prev => {
        // Avoid duplicates
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewPosts = newPosts.filter(p => p.id && !existingIds.has(p.id));
        return [...prev, ...uniqueNewPosts];
      });
    }
  }, [postsResponse, currentPage]);

  // Reset to page 1 only on initial mount or when refetching
  const [isInitialMount, setIsInitialMount] = useState(true);
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      setCurrentPage(1);
      setAllLoadedPosts([]);
      setHasMore(true);
    }
  }, [isInitialMount]);

  // Intersection Observer for infinite scrolling (Overview tab)
  useEffect(() => {
    if (activeTab !== "overview") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTargetOverview.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, activeTab]);

  // Intersection Observer for infinite scrolling (Posts tab)
  useEffect(() => {
    if (activeTab !== "posts") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTargetPosts.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, activeTab]);

  // Separate approved posts and drafts
  const { approvedPosts, draftPosts } = useMemo(() => {
    const approved = allLoadedPosts.filter(p => p.status === 'approved' || !p.status);
    const drafts = allLoadedPosts.filter(p => p.status === 'draft');

    return { approvedPosts: approved, draftPosts: drafts };
  }, [allLoadedPosts]);

  const handlePublishDraft = async (postId: number | string) => {
    try {
      await updatePost({
        postId,
        data: { status: "approved" }
      }).unwrap();
      toast.success("Post published successfully!");
      // Reset and refetch from page 1
      setCurrentPage(1);
      setAllLoadedPosts([]);
      setHasMore(true);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to publish post";
      toast.error(errorMessage);
    }
  };

  const openModal = () => {
    router.push('/main/edit-profile');
  };

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        setIsOpen(true);
      }, 10);
    } else {
      document.body.style.overflow = "unset";
      setIsOpen(false);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  const handleCloseSidebar = () => {
    setIsClosing(true);
    setIsOpen(false);
    setTimeout(() => {
      setIsSidebarOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const renderPosts = () => {
    if (isLoading) {
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

    if (isError) {
      return (
        <ErrorState
          message="Failed to load posts. Please try again later."
          onRetry={() => refetch()}
        />
      );
    }

    if (!approvedPosts.length && !draftPosts.length) {
      return (
        <EmptyPostsState
          message="You haven't created any posts yet"
          showCreateButton={false}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Approved Posts Only - Drafts are shown in Posts tab */}
        {approvedPosts.map((post) => (
          <Post key={post.id} post={post} profile={profile} />
        ))}

        {approvedPosts.length === 0 && (
          <EmptyPostsState
            message="No published posts yet"
            showCreateButton={false}
          />
        )}

        {/* Infinite scroll trigger */}
        <div ref={observerTargetOverview} className="h-10 flex items-center justify-center">
          {(isLoading || isFetching) && hasMore && (
            <div className="text-white/60 text-sm flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Loading more posts...
            </div>
          )}
        </div>
        {!hasMore && allLoadedPosts.length > 0 && (
          <div className="text-center text-white/40 text-sm py-4">
            No more posts to load
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="mx-auto  flex gap-10">
        <div className="w-full bg-[#06133F]/75 backdrop-blur-[17.5px] min-h-[calc(100vh-80px)] pt-10 p-4 xl:p-10 ">
          <div className="xl:max-w-[47vw] mx-auto">
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center justify-between mb-4 lg:mb-0">
                <div className="flex-1">
                  <ProfileHeader onAvatarClick={openModal} />
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
              <div className="flex items-center gap-2 mt-4 overflow-x-hidden">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-6 py-3 rounded-lg cursor-pointer ${activeTab === "overview"
                    ? "bg-white text-black"
                    : "border border-white/10 text-white"
                    }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`px-6 py-3 rounded-lg cursor-pointer ${activeTab === "posts"
                    ? "bg-white text-black"
                    : "border border-white/10 text-white"
                    }`}
                >
                  Posts
                </button>
              </div>
            </div>

            <div className=" space-y-6">
              {activeTab === "posts" ? (
                <div className="space-y-6">
                  <CreatePost isProfile={true} onSuccess={() => {
                    // Reset and refetch from page 1 when new post is created
                    setCurrentPage(1);
                    setAllLoadedPosts([]);
                    setHasMore(true);
                    refetch();
                  }} />

                  {/* Draft Posts Section - Below CreatePost Form */}
                  {draftPosts.length > 0 && (
                    <div className="border-t border-white/10 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-white/70 mb-4">Drafts</h3>
                      <div className="space-y-6">
                        {draftPosts.map((post) => (
                          <div key={post.id} className="relative">
                            <Post post={post} profile={profile} />
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
                  )}

                  {/* Approved Posts in Posts Tab */}
                  {approvedPosts.length > 0 && (
                    <div className="border-t border-white/10 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-white/70 mb-4">Published Posts</h3>
                      <div className="space-y-6">
                        {approvedPosts.map((post) => (
                          <Post key={post.id} post={post} profile={profile} />
                        ))}
                      </div>
                      {/* Infinite scroll trigger */}
                      <div ref={observerTargetPosts} className="h-10 flex items-center justify-center">
                        {isLoading && hasMore && (
                          <div className="text-white/60 text-sm">Loading more posts...</div>
                        )}
                      </div>
                      {!hasMore && allLoadedPosts.length > 0 && (
                        <div className="text-center text-white/40 text-sm py-4">
                          No more posts to load
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {renderPosts()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div
          style={{ scrollbarGutter: "stable both-edges" }}
          className=" hidden lg:block rounded-lg w-[370px] sticky top-34 hover:overflow-y-auto overflow-y-hidden custom-scroll  mr-5 mt-6 h-[calc(100vh-100px)]"
        >
          <ProfileSidebar />
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
            className={`fixed top-0 right-0 h-full w-[370px] bg-[#06133F]/95 backdrop-blur-[17.5px] shadow-2xl transition-transform duration-300 ease-in-out ${isOpen && !isClosing ? "translate-x-0" : "translate-x-full"
              }`}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundImage: `url(${bg.src})`,
              scrollbarGutter: "stable both-edges",
            }}
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
              <ProfileSidebar />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;