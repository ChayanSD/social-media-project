"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetFollowingQuery, useGetFollowersQuery, useGetSuggestionsQuery, useFollowUserMutation, useUnfollowUserMutation, FollowItem, UserSuggestion } from "@/store/postApi";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import { IoPersonOutline } from "react-icons/io5";
import { FiUsers } from "react-icons/fi";
import { toast } from "sonner";
import Image from "next/image";
import { getApiBaseUrl } from "@/lib/utils";
import PageHeader from "../../Shared/PageHeader/PageHeader";


const USERS_PER_PAGE = 20;

const Friends = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"following" | "followers" | "suggestions">("suggestions");
  
  // Pagination state for each tab (using page numbers)
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);
  const [followersPage, setFollowersPage] = useState(1);
  
  // Accumulated users for each tab
  const [accumulatedSuggestions, setAccumulatedSuggestions] = useState<UserSuggestion[]>([]);
  const [accumulatedFollowing, setAccumulatedFollowing] = useState<FollowItem[]>([]);
  const [accumulatedFollowers, setAccumulatedFollowers] = useState<FollowItem[]>([]);
  
  // Always fetch both lists to check follow status
  const { data: followingResponse, isLoading: isLoadingFollowing, refetch: refetchFollowing } = useGetFollowingQuery({
    limit: USERS_PER_PAGE,
    page: followingPage,
  });
  const { data: followersResponse, isLoading: isLoadingFollowers, refetch: refetchFollowers } = useGetFollowersQuery({
    limit: USERS_PER_PAGE,
    page: followersPage,
  });
  const { data: suggestionsResponse, isLoading: isLoadingSuggestions, refetch: refetchSuggestions } = useGetSuggestionsQuery({
    limit: USERS_PER_PAGE,
    page: suggestionsPage,
  });
  const { data: profileResponse } = useGetCurrentUserProfileQuery();
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();
  const currentUser = profileResponse?.data;

  // Track if we've initialized each tab to avoid resetting on first load
  const [initializedTabs, setInitializedTabs] = React.useState<Set<string>>(new Set());

  // Update accumulated data when new data arrives
  React.useEffect(() => {
    if (followingResponse) {
      const newData: FollowItem[] = Array.isArray(followingResponse) 
        ? followingResponse 
        : ('data' in followingResponse && followingResponse.data) 
          ? followingResponse.data 
          : ('results' in followingResponse && followingResponse.results && 'data' in followingResponse.results && followingResponse.results.data)
            ? followingResponse.results.data
            : [];
      if (followingPage === 1 && !initializedTabs.has("following")) {
        setAccumulatedFollowing(newData);
        setInitializedTabs(prev => new Set([...prev, "following"]));
      } else if (followingPage > 1) {
        setAccumulatedFollowing(prev => [...prev, ...newData]);
      }
    }
  }, [followingResponse, followingPage, initializedTabs]);

  React.useEffect(() => {
    if (followersResponse) {
      const newData: FollowItem[] = Array.isArray(followersResponse) 
        ? followersResponse 
        : ('data' in followersResponse && followersResponse.data) 
          ? followersResponse.data 
          : ('results' in followersResponse && followersResponse.results && 'data' in followersResponse.results && followersResponse.results.data)
            ? followersResponse.results.data
            : [];
      if (followersPage === 1 && !initializedTabs.has("followers")) {
        setAccumulatedFollowers(newData);
        setInitializedTabs(prev => new Set([...prev, "followers"]));
      } else if (followersPage > 1) {
        setAccumulatedFollowers(prev => [...prev, ...newData]);
      }
    }
  }, [followersResponse, followersPage, initializedTabs]);

  React.useEffect(() => {
    if (suggestionsResponse) {
      const newData: UserSuggestion[] = Array.isArray(suggestionsResponse) 
        ? suggestionsResponse 
        : ('data' in suggestionsResponse && suggestionsResponse.data) 
          ? suggestionsResponse.data 
          : ('results' in suggestionsResponse && suggestionsResponse.results && 'data' in suggestionsResponse.results && suggestionsResponse.results.data)
            ? suggestionsResponse.results.data
            : [];
      if (suggestionsPage === 1 && !initializedTabs.has("suggestions")) {
        setAccumulatedSuggestions(newData);
        setInitializedTabs(prev => new Set([...prev, "suggestions"]));
      } else if (suggestionsPage > 1) {
        setAccumulatedSuggestions(prev => [...prev, ...newData]);
      }
    }
  }, [suggestionsResponse, suggestionsPage, initializedTabs]);

  const following = accumulatedFollowing;
  const followers = accumulatedFollowers;
  
  // Filter suggestions to only show users who are NOT being followed
  // Get list of user IDs that are being followed
  const followingUserIds = new Set(
    following.map(item => String(item.following))
  );
  
  // Filter out users who are already being followed and the current user
  const suggestions = React.useMemo(() => {
    return accumulatedSuggestions.filter(user => {
      const userId = String(user.id);
      // Only show if not following AND not the current user
      return !followingUserIds.has(userId) && String(user.id) !== String(currentUser?.id);
    });
  }, [accumulatedSuggestions, followingUserIds, currentUser?.id]);
  
  // Check if there are more users to load using the 'next' field from paginated response
  const hasMoreSuggestions = suggestionsResponse?.next !== null && suggestionsResponse?.next !== undefined;
  const hasMoreFollowing = followingResponse?.next !== null && followingResponse?.next !== undefined;
  const hasMoreFollowers = followersResponse?.next !== null && followersResponse?.next !== undefined;

  const handleFollow = async (userId: number | string) => {
    try {
      // Find user info from followers list to add to following list optimistically
      const userFromFollowers = accumulatedFollowers.find(item => String(item.follower) === String(userId));
      const userFromSuggestions = accumulatedSuggestions.find(user => user.id === userId);
      
      // Remove from suggestions immediately (since they're now being followed)
      setAccumulatedSuggestions(prev => 
        prev.filter(user => String(user.id) !== String(userId))
      );
      
      // Optimistically add to following list if not already there
      // This is important for the followers tab - when you follow someone back, they should appear as "following" immediately
      if (userId && !accumulatedFollowing.some(f => String(f.following) === String(userId))) {
        const newFollowItem: FollowItem = {
          id: Date.now(), // Temporary ID, will be replaced on refetch
          following: userId,
          following_name: userFromFollowers?.follower_name || userFromSuggestions?.display_name || userFromSuggestions?.username || "User",
          following_avatar: userFromFollowers?.follower_avatar || userFromSuggestions?.avatar || null,
          following_about: userFromFollowers?.follower_about || userFromSuggestions?.about || null,
        };
        setAccumulatedFollowing(prev => [...prev, newFollowItem]);
      }
      
      await followUser({ userId }).unwrap();
      toast.success("Followed successfully");
      
      // Refetch to get updated data with correct follow_id
      // RTK Query will automatically refetch due to cache invalidation, but we also manually refetch to ensure immediate update
      refetchFollowing();
      refetchFollowers();
      refetchSuggestions();
    } catch (error) {
      // Revert optimistic updates on error
      // Add back to suggestions if we removed them
      const userFromSuggestions = accumulatedSuggestions.find(user => user.id === userId);
      if (!userFromSuggestions) {
        // Need to refetch suggestions to get the user back
        refetchSuggestions();
      }
      // Remove from following list if we added it optimistically (temporary IDs are large timestamps)
      setAccumulatedFollowing(prev => 
        prev.filter(item => {
          const isTempId = item.id && typeof item.id === 'number' && item.id > 1000000000000;
          const matchesUserId = String(item.following) === String(userId);
          // Remove if it matches userId AND is a temporary ID we just added
          return !(matchesUserId && isTempId);
        })
      );
      console.error("Failed to follow user:", error);
      toast.error("Failed to follow user");
    }
  };

  const handleUnfollow = async (followId: number | string) => {
    try {
      // Find the user to update optimistically from following list
      const followItem = accumulatedFollowing.find(item => item.id === followId);
      const userIdToUpdate = followItem?.following;
      
      // Remove from following list immediately
      setAccumulatedFollowing(prev => 
        prev.filter(item => item.id !== followId)
      );
      
      // Add back to suggestions if they were in suggestions before
      // Since we filter suggestions to exclude followed users, we need to add them back when unfollowed
      if (userIdToUpdate && followItem) {
        // Check if user is not already in suggestions
        const alreadyInSuggestions = accumulatedSuggestions.some(user => String(user.id) === String(userIdToUpdate));
        if (!alreadyInSuggestions && String(userIdToUpdate) !== String(currentUser?.id)) {
          // Add them back to suggestions optimistically
          const newSuggestion: UserSuggestion = {
            id: userIdToUpdate,
            username: followItem.following_name || "User",
            display_name: followItem.following_name || undefined,
            avatar: followItem.following_avatar || null,
            about: followItem.following_about || null,
            is_following: false,
            follow_id: undefined,
            followers_count: 0,
            posts_count: 0,
          };
          setAccumulatedSuggestions(prev => [...prev, newSuggestion]);
        }
      }
      
      await unfollowUser({ followingId: followId }).unwrap();
      toast.success("Unfollowed successfully");
      
      // Refetch to get updated data
      // RTK Query will automatically refetch due to cache invalidation, but we also manually refetch to ensure immediate update
      refetchFollowing();
      refetchFollowers();
      refetchSuggestions();
    } catch (error) {
      // Revert optimistic update on error - refetch to get correct state
      refetchSuggestions();
      refetchFollowing();
      refetchFollowers();
      console.error("Failed to unfollow user:", error);
      toast.error("Failed to unfollow user");
    }
  };

  const handleShowMore = () => {
    if (activeTab === "suggestions") {
      setSuggestionsPage(prev => prev + 1);
    } else if (activeTab === "following") {
      setFollowingPage(prev => prev + 1);
    } else if (activeTab === "followers") {
      setFollowersPage(prev => prev + 1);
    }
  };

  const isLoadingMore = 
    (activeTab === "suggestions" && isLoadingSuggestions && suggestionsPage > 1) ||
    (activeTab === "following" && isLoadingFollowing && followingPage > 1) ||
    (activeTab === "followers" && isLoadingFollowers && followersPage > 1);

  const hasMore = 
    (activeTab === "suggestions" && hasMoreSuggestions) ||
    (activeTab === "following" && hasMoreFollowing) ||
    (activeTab === "followers" && hasMoreFollowers);

  const renderSuggestionList = (users: UserSuggestion[]) => {
    const isLoading = isLoadingSuggestions;
    
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="animate-pulse flex items-center gap-4 p-4 border border-white/10 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-white/10 mb-2" />
                <div className="h-3 w-24 rounded bg-white/10" />
              </div>
              <div className="h-8 w-20 rounded bg-white/10" />
            </div>
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-white/60 text-sm">
            No user suggestions available.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {users.map((user) => {
          const userId = user.id;
          const userName = user.display_name || user.username || "Unknown User";
          const userAvatar = user.avatar;
          const userAbout = user.about;
          const isFollowing = user.is_following || false;
          const followId = user.follow_id;

          const handleCardClick = () => {
            const username = user.username || user.id;
            if (username) {
              router.push(`/main/user/${username}`);
            }
          };

          return (
            <div
              key={user.id}
              onClick={handleCardClick}
              className="bg-[#06133FBF] backdrop-blur-[17.5px] border border-white/10 rounded-xl hover:border-white/20 transition-all duration-300 p-6 flex flex-col cursor-pointer"
            >
              {/* Top Row: Avatar + Name on left, Button on right */}
              <div className="flex items-center justify-between gap-3 mb-3">
                {/* Left side: Avatar and Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                    {userAvatar ? (
                      <Image
                        src={userAvatar.startsWith("http") ? userAvatar : `${getApiBaseUrl()}${userAvatar.startsWith("/") ? userAvatar.slice(1) : userAvatar}`}
                        alt={userName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79] flex items-center justify-center">
                        <IoPersonOutline className="text-white" size={24} />
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <h3 className="text-white font-bold text-lg truncate">
                    {userName}
                  </h3>
                </div>
                
                {/* Right side: Follow Button */}
                {userId && String(userId) !== String(currentUser?.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click when clicking follow button
                      if (isFollowing && followId) {
                        // Unfollow: use the follow relation ID
                        handleUnfollow(followId);
                      } else {
                        // Follow: use the user ID
                        handleFollow(userId);
                      }
                    }}
                    className={`px-3 py-1.5 cursor-pointer rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                      isFollowing
                        ? "bg-gray-600 hover:bg-gray-700 text-white"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    }`}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>

              {/* About/Description - below, starting from left */}
              <div className="flex-1">
                <p className="text-white/70 text-sm line-clamp-2">
                  {userAbout || "No description available."}
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 mt-3 text-xs text-white/60">
                <span>{user.followers_count || 0} followers</span>
                <span>{user.posts_count || 0} posts</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderUserList = (users: FollowItem[], isFollowingTab: boolean) => {
    const isLoading = isFollowingTab ? isLoadingFollowing : isLoadingFollowers;
    
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="animate-pulse flex items-center gap-4 p-4 border border-white/10 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-white/10 mb-2" />
                <div className="h-3 w-24 rounded bg-white/10" />
              </div>
              <div className="h-8 w-20 rounded bg-white/10" />
            </div>
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-white/60 text-sm">
            {isFollowingTab ? "You are not following anyone yet." : "No one is following you yet."}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2  gap-4">
        {users.map((item) => {
          const userId = isFollowingTab ? item.following : item.follower;
          const userName = isFollowingTab ? item.following_name : item.follower_name;
          const userAvatar = isFollowingTab ? item.following_avatar : item.follower_avatar;
          const userAbout = isFollowingTab ? item.following_about : item.follower_about;

          // Check if current user is following this user (for followers tab)
          // In following tab, they're already following, so always true
          // In followers tab, check if this user exists in the following list
          const isFollowing = isFollowingTab 
            ? true 
            : following.some((f) => String(f.following) === String(userId));

          // Find the follow relationship ID for unfollowing
          const followRelation = isFollowingTab 
            ? item 
            : following.find((f) => String(f.following) === String(userId));

          // Navigate to user profile using userId (route can handle both username and ID)
          const handleCardClick = () => {
            if (userId) {
              router.push(`/main/user/${userId}`);
            }
          };

          return (
            <div
              key={item.id}
              onClick={handleCardClick}
              className="bg-[#06133FBF] backdrop-blur-[17.5px] border border-white/10 rounded-xl hover:border-white/20 transition-all duration-300 p-6 flex flex-col cursor-pointer"
            >
              {/* Top Row: Avatar + Name on left, Button on right */}
              <div className="flex items-center justify-between gap-3 mb-3">
                {/* Left side: Avatar and Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                    {userAvatar ? (
                      <Image
                        src={userAvatar.startsWith("http") ? userAvatar : `${getApiBaseUrl()}${userAvatar.startsWith("/") ? userAvatar.slice(1) : userAvatar}`}
                        alt={userName || "User"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79] flex items-center justify-center">
                        <IoPersonOutline className="text-white" size={24} />
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <h3 className="text-white font-bold text-lg truncate">
                    {userName || "Unknown User"}
                  </h3>
                </div>
                
                {/* Right side: Follow Button */}
                {userId && String(userId) !== String(currentUser?.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click when clicking follow button
                      if (isFollowing) {
                        // Unfollow: use the follow relation ID
                        if (followRelation?.id) {
                          handleUnfollow(followRelation.id);
                        }
                      } else {
                        // Follow: use the user ID
                        handleFollow(userId);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 cursor-pointer ${
                      isFollowing
                        ? "bg-gray-600 hover:bg-gray-700 text-white"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    }`}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>

              {/* About/Description - below, starting from left */}
              <div className="flex-1">
                <p className="text-white/70 text-sm line-clamp-2">
                  {userAbout || "No description available."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
      <div className="p-4 page-container sm:p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-12">
          <PageHeader
            icon={<FiUsers className="w-8 h-8 text-white" />}
            title="Friends"
            description="Connect with friends, see who's following you, and discover new people to follow."
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("suggestions")}
            className={`px-6 py-3 rounded-t-lg font-medium transition-all duration-300 ${
              activeTab === "suggestions"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            Suggestions ({suggestions.length})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`px-6 py-3 rounded-t-lg font-medium transition-all duration-300 ${
              activeTab === "following"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            Following ({following.length})
          </button>
          <button
            onClick={() => setActiveTab("followers")}
            className={`px-6 py-3 rounded-t-lg font-medium transition-all duration-300 ${
              activeTab === "followers"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            Followers ({followers.length})
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === "suggestions" && renderSuggestionList(suggestions)}
          {activeTab === "following" && renderUserList(following, true)}
          {activeTab === "followers" && renderUserList(followers, false)}
          
          {/* Show More Button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleShowMore}
                disabled={isLoadingMore}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? "Loading..." : "Show More"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;

