import { getApiBaseUrl } from "@/lib/utils";
import { baseApi } from "./baseApi";

export interface CreatePostRequest {
  title: string;
  content?: string;
  tags?: string[];
  link?: string;
  media_files?: File[];
  post_type: "media" | "text" | "link";
  community?: number | string;
  status?: "draft" | "approved" | "pending" | "rejected";
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  tags?: string[];
  link?: string;
  media_files?: File[];
  post_type?: "media" | "text" | "link";
  community?: number | string;
  status?: "draft" | "approved" | "pending" | "rejected";
}

export interface CreatePostResponse {
  id?: number | string;
  message?: string;
  success?: boolean;
  [key: string]: unknown;
}

export interface PostAuthor {
  avatar?: string;
  name?: string;
  username?: string;
}

export interface PostItem {
  id: number | string;
  title?: string;
  content?: string;
  media?: string[];
  media_file?: string[];
  tags?: string[];
  created_at?: string;
  user_name?: string;
  username?: string;
  author?: PostAuthor;
  likes_count?: number;
  is_liked?: boolean;
  comments_count?: number;
  shared_from?: number | string | null;
  original_post?: PostItem | null;
  [key: string]: unknown;
}

export interface GetPostsResponse {
  data?: PostItem[];
  results?: PostItem[] | {
    data?: PostItem[];
  };
  posts?: PostItem[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

export interface CommentAuthor {
  id?: number | string;
  username?: string;
  avatar?: string;
  display_name?: string;
}

export interface CommentItem {
  id: number | string;
  content: string;
  created_at: string;
  author?: CommentAuthor;
  user?: CommentAuthor;
  username?: string;
  user_name?: string;
  avatar?: string;
  parent?: number | string | null;
  replies?: CommentItem[];
  post?: number | string;
  [key: string]: unknown;
}

export interface GetCommentsResponse {
  data?: CommentItem[];
  results?: CommentItem[];
  comments?: CommentItem[];
  [key: string]: unknown;
}

export interface CreateCommentRequest {
  post: number | string;
  content: string;
  parent?: number | string;
}

export interface CreateCommentResponse {
  id?: number | string;
  content?: string;
  created_at?: string;
  author?: CommentAuthor;
  user?: CommentAuthor;
  username?: string;
  user_name?: string;
  avatar?: string;
  parent?: number | string | null;
  post?: number | string;
  message?: string;
  success?: boolean;
}

export interface FollowItem {
  id?: number | string;
  following?: number | string;
  follower?: number | string;
  following_name?: string;
  follower_name?: string;
  follower_avatar?: string | null;
  follower_about?: string | null;
  following_avatar?: string | null;
  following_about?: string | null;
  user?: number | string;
  created_at?: string;
  [key: string]: unknown;
}

export interface GetFollowersResponse {
  data?: FollowItem[];
  results?: FollowItem[] | {
    data?: FollowItem[];
  };
  count?: number;
  next?: string | null;
  previous?: string | null;
  [key: string]: unknown;
}

export interface UserSuggestion {
  id?: number | string;
  username?: string;
  avatar?: string | null;
  about?: string | null;
  display_name?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
  follow_id?: number | string | null;
  [key: string]: unknown;
}

export interface GetSuggestionsResponse {
  data?: UserSuggestion[];
  results?: UserSuggestion[] | {
    data?: UserSuggestion[];
  };
  count?: number;
  next?: string | null;
  previous?: string | null;
  [key: string]: unknown;
}

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createPost: builder.mutation<CreatePostResponse, CreatePostRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("title", data.title);
        if (typeof data.content === "string") {
          formData.append("content", data.content);
        }
        if (typeof data.link === "string" && data.link.trim().length > 0) {
          formData.append("link", data.link);
        }
        if (Array.isArray(data.tags) && data.tags.length > 0) {
          formData.append("tags", JSON.stringify(data.tags));
        }
        if (Array.isArray(data.media_files)) {
          data.media_files.forEach((file) =>
            formData.append("media_files", file)
          );
        }
        if (data.community !== undefined) {
          formData.append("community", data.community.toString());
        }
        if (data.status) {
          formData.append("status", data.status);
        }
        console.log(formData);
        formData.append("post_type", data.post_type.toString());
        return {
          url: "/api/posts/",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Communities"],
    }),
    updatePost: builder.mutation<CreatePostResponse, { postId: number | string; data: UpdatePostRequest }>({
      query: ({ postId, data }) => {
        const formData = new FormData();
        if (data.title) {
          formData.append("title", data.title);
        }
        if (typeof data.content === "string") {
          formData.append("content", data.content);
        }
        if (typeof data.link === "string" && data.link.trim().length > 0) {
          formData.append("link", data.link);
        }
        if (Array.isArray(data.tags) && data.tags.length > 0) {
          formData.append("tags", JSON.stringify(data.tags));
        }
        if (Array.isArray(data.media_files)) {
          data.media_files.forEach((file) =>
            formData.append("media_files", file)
          );
        }
        if (data.community !== undefined) {
          formData.append("community", data.community.toString());
        }
        if (data.post_type) {
          formData.append("post_type", data.post_type.toString());
        }
        if (data.status) {
          formData.append("status", data.status);
        }
        return {
          url: `/api/posts/${postId}/`,
          method: "PATCH",
          body: formData,
        };
      },
      async onQueryStarted({ postId, data }, { dispatch, queryFulfilled }) {
        // Optimistically update post in cache
        const updatePostInCache = (draft: GetPostsResponse) => {
          const updatePost = (posts: PostItem[] | undefined) => {
            if (!posts) return;
            const post = posts.find((p) => p.id === postId);
            if (post) {
              if (data.title) post.title = data.title;
              if (data.content !== undefined) post.content = data.content;
              if (data.tags) post.tags = data.tags;
              if (data.link) post.link = data.link;
            }
          };
          if (draft.posts) updatePost(draft.posts);
          if (draft.data) updatePost(draft.data);
          if (draft.results) {
            if (Array.isArray(draft.results)) {
              updatePost(draft.results);
            } else if (draft.results.data) {
              updatePost(draft.results.data);
            }
          }
        };

        const patchResults = [
          dispatch(postApi.util.updateQueryData("getNewsFeed", undefined, updatePostInCache)),
          dispatch(postApi.util.updateQueryData("getMyPosts", undefined, updatePostInCache)),
        ];

        try {
          await queryFulfilled;
          // Invalidate Communities cache if post status might have changed
          dispatch(postApi.util.invalidateTags(["Communities"]));
        } catch {
          patchResults.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: ["Communities"],
    }),
    deletePost: builder.mutation<void, { postId: number | string }>({
      query: ({ postId }) => ({
        url: `/api/posts/${postId}/`,
        method: "DELETE",
      }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        // Optimistically remove post from cache
        const removePostFromCache = (draft: GetPostsResponse) => {
          const removePost = (posts: PostItem[] | undefined) => {
            if (!posts) return;
            const index = posts.findIndex((p) => p.id === postId);
            if (index !== -1) {
              posts.splice(index, 1);
            }
          };
          if (draft.posts) removePost(draft.posts);
          if (draft.data) removePost(draft.data);
          if (draft.results) {
            if (Array.isArray(draft.results)) {
              removePost(draft.results);
            } else if (draft.results.data) {
              removePost(draft.results.data);
            }
          }
        };

        const patchResults = [
          dispatch(postApi.util.updateQueryData("getNewsFeed", undefined, removePostFromCache)),
          dispatch(postApi.util.updateQueryData("getMyPosts", undefined, removePostFromCache)),
          dispatch(postApi.util.updateQueryData("getAllPosts", undefined, removePostFromCache)),
          dispatch(postApi.util.updateQueryData("getRejectedPosts", undefined, removePostFromCache)),
        ];

        try {
          await queryFulfilled;
          // Invalidate queries to refetch and ensure data is up to date
          dispatch(postApi.util.invalidateTags([{ type: 'UserProfile' }]));
          // Invalidate Communities cache to update posts_count
          dispatch(postApi.util.invalidateTags(["Communities"]));
          // Also directly refetch queries to ensure instant update
          dispatch(postApi.endpoints.getMyPosts.initiate(undefined, { forceRefetch: true }));
          dispatch(postApi.endpoints.getAllPosts.initiate(undefined, { forceRefetch: true }));
        } catch {
          patchResults.forEach((patch) => patch.undo());
        }
      },
    }),
    getMyPosts: builder.query<GetPostsResponse, { page?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && typeof params === 'object' && params.page) {
          searchParams.append('page', params.page.toString());
        }
        const queryString = searchParams.toString();
        return {
          url: `/api/posts/my_posts/${queryString ? `?${queryString}` : ''}`,
          method: "GET",
        };
      },
      providesTags: () => [{ type: 'UserProfile' }],
      // Merge pages for infinite scrolling
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        // For infinite scrolling, we handle merging in the component
        return newItems;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        // Only refetch if page number changes
        return currentArg?.page !== previousArg?.page;
      },
    }),
    getUserPosts: builder.query<GetPostsResponse, number | string>({
      query: (userId) => ({
        url: `/api/posts/user_posts/?user_id=${userId}`,
        method: "GET",
      }),
      providesTags: () => [{ type: 'UserProfile' }],
    }),
    getNewsFeed: builder.query<GetPostsResponse, { page?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && typeof params === 'object' && params.page) {
          searchParams.append('page', params.page.toString());
        }
        const queryString = searchParams.toString();
        return {
          url: `/api/posts/news_feed/${queryString ? `?${queryString}` : ''}`,
          method: "GET",
        };
      },
      // Merge pages for infinite scrolling
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        // For infinite scrolling, we handle merging in the component
        return newItems;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        // Only refetch if page number changes
        return currentArg?.page !== previousArg?.page;
      },
    }),
    getAllPosts: builder.query<GetPostsResponse, { page?: number; limit?: number; status?: string; start_date?: string; end_date?: string; search?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && typeof params === 'object') {
          if (params.page) searchParams.append('page', params.page.toString());
          if (params.limit) searchParams.append('limit', params.limit.toString());
          if (params.status) searchParams.append('status', params.status);
          if (params.start_date) searchParams.append('start_date', params.start_date);
          if (params.end_date) searchParams.append('end_date', params.end_date);
          if (params.search) searchParams.append('search', params.search);
        }
        const queryString = searchParams.toString();
        return {
          url: `/api/posts/${queryString ? `?${queryString}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["UserProfile"],
    }),
    getRejectedPosts: builder.query<GetPostsResponse, void>({
      query: () => ({
        url: "/api/posts/?status=rejected",
        method: "GET",
      }),
      providesTags: ["UserProfile"],
    }),
    getCommunityPosts: builder.query<GetPostsResponse, string>({
      query: (communityName) => ({
        url: `/api/posts/community_posts/?community=${communityName}`,
        method: "GET",
      }),
    }),
    getPostById: builder.query<{ success?: boolean; message?: string; data?: PostItem }, number | string>({
      query: (postId) => ({
        url: `/api/posts/${postId}/`,
        method: "GET",
      }),
      providesTags: (result, error, postId) => [{ type: 'UserProfile', id: postId }],
    }),
    approvePost: builder.mutation<{ success?: boolean; message?: string; data?: PostItem }, { postId: number | string }>({
      query: ({ postId }) => ({
        url: `/api/posts/${postId}/approve/`,
        method: "POST",
      }),
      invalidatesTags: () => [{ type: 'UserProfile' }],
    }),
    likePost: builder.mutation<
      { success: boolean; likes_count: number; is_liked: boolean; id?: number | string; like_id?: number | string; data?: { id?: number | string; like_id?: number | string } },
      { postId: number | string; isLiked: boolean }
    >({
      query: ({ postId }) => ({
        url: `/api/likes/`,
        method: "POST",
        body: { post: postId },
      }),
      invalidatesTags: () => [{ type: 'UserProfile' }],
      async onQueryStarted({ postId, isLiked }, { dispatch, queryFulfilled, getState }) {
        // Helper function to update post in query cache
        // Use the cached post's is_liked state (source of truth) to determine the action
        const updatePostInCache = (draft: GetPostsResponse) => {
          const updatePost = (posts: PostItem[] | undefined) => {
            if (!posts) return;
            const post = posts.find((p) => p.id === postId);
            if (post) {
              // Use the cached post's is_liked state to determine the action
              const wasLiked = post.is_liked || false;
              post.is_liked = !wasLiked;
              post.likes_count = Math.max(0, (post.likes_count || 0) + (wasLiked ? -1 : 1));
            }
          };
          if (draft.posts) updatePost(draft.posts);
          if (draft.data) updatePost(draft.data);
          if (draft.results) {
            if (Array.isArray(draft.results)) {
              updatePost(draft.results);
            } else if (draft.results.data) {
              updatePost(draft.results.data);
            }
          }
        };

        // Helper function to update single post in cache (for getPostById)
        const updateSinglePostInCache = (draft: { success?: boolean; message?: string; data?: PostItem }) => {
          if (draft.data && draft.data.id === postId) {
            const wasLiked = draft.data.is_liked || false;
            draft.data.is_liked = !wasLiked;
            draft.data.likes_count = Math.max(0, (draft.data.likes_count || 0) + (wasLiked ? -1 : 1));
          }
        };

        // Get all cached queries and update them
        // RTK Query stores queries in the cache with serialized keys
        const state = getState() as { api?: { queries?: Record<string, { endpointName?: string; originalArgs?: unknown; data?: unknown }> } };
        const cachedUserPostsQueries: Array<number | string> = [];
        const cachedMyPostsQueries: Array<{ page?: number } | void> = [];
        const cachedPostByIdQueries: Array<number | string> = [];

        // Find all cached queries
        if (state?.api?.queries) {
          Object.values(state.api.queries).forEach((queryState) => {
            if (queryState?.endpointName === 'getUserPosts' && queryState.originalArgs) {
              cachedUserPostsQueries.push(queryState.originalArgs as number | string);
            }
            // Find all cached getMyPosts queries (they can have different page numbers)
            if (queryState?.endpointName === 'getMyPosts') {
              // Only add if query has data (is actually cached)
              if (queryState.data !== undefined) {
                cachedMyPostsQueries.push(queryState.originalArgs as { page?: number } | void);
              }
            }
            // Find all cached getPostById queries
            if (queryState?.endpointName === 'getPostById' && queryState.originalArgs) {
              cachedPostByIdQueries.push(queryState.originalArgs as number | string);
            }
          });
        }

        // Optimistic updates
        // Note: getMyPosts uses serializeQueryArgs that returns just endpointName,
        // but we still need to update with specific arguments to ensure cache match
        const patchResults = [
          dispatch(postApi.util.updateQueryData("getNewsFeed", undefined, updatePostInCache)),
          // Update all cached getMyPosts queries with their specific arguments
          ...(cachedMyPostsQueries.length > 0
            ? cachedMyPostsQueries.map((args) =>
              dispatch(postApi.util.updateQueryData("getMyPosts", args, updatePostInCache))
            )
            : // Fallback: try updating with undefined if no cached queries found
            [dispatch(postApi.util.updateQueryData("getMyPosts", undefined, updatePostInCache))]),
          // Update all cached getUserPosts queries
          ...cachedUserPostsQueries.map((userId) =>
            dispatch(postApi.util.updateQueryData("getUserPosts", userId, updatePostInCache))
          ),
          // Update all cached getPostById queries (single post page)
          ...cachedPostByIdQueries.map((postIdArg) =>
            dispatch(postApi.util.updateQueryData("getPostById", postIdArg, updateSinglePostInCache))
          ),
        ];

        try {
          const result = await queryFulfilled;
          const responseData = result.data;

          // If unliking, delete the like using ID from response
          if (isLiked === false) {
            const likeId = responseData?.data?.id || responseData?.data?.like_id || responseData.id || responseData.like_id;

            if (likeId) {
              const { getStoredAccessToken } = await import("@/lib/auth");

              const baseUrl = getApiBaseUrl();
              await fetch(`${baseUrl}api/likes/${likeId}/`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${getStoredAccessToken() || ""}`,
                  "Content-Type": "application/json",
                },
              }).catch((error) => console.error("Failed to delete like:", error));
            }
          }
        } catch {
          patchResults.forEach((patch) => patch.undo());
        }
      },
    }),
    getComments: builder.query<GetCommentsResponse, number | string>({
      query: (postId) => ({
        url: `/api/comments/?post=${postId}`,
        method: "GET",
      }),
      providesTags: (result, error, postId) => [{ type: 'Comments' as const, id: postId }],
    }),
    createComment: builder.mutation<CreateCommentResponse, CreateCommentRequest>({
      query: (data) => ({
        url: "/api/comments/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { post }) => [{ type: 'Comments' as const, id: post }],
      async onQueryStarted({ post }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          // Update the post's comment count
          const updatePostCommentCount = (draft: GetPostsResponse) => {
            const updatePost = (posts: PostItem[] | undefined) => {
              if (!posts) return;
              const postItem = posts.find((p) => p.id === post);
              if (postItem) {
                postItem.comments_count = (postItem.comments_count || 0) + 1;
              }
            };
            if (draft.posts) updatePost(draft.posts);
            if (draft.data) updatePost(draft.data);
            if (draft.results) {
              if (Array.isArray(draft.results)) {
                updatePost(draft.results);
              } else if (draft.results.data) {
                updatePost(draft.results.data);
              }
            }
          };

          dispatch(postApi.util.updateQueryData("getNewsFeed", undefined, updatePostCommentCount));
          dispatch(postApi.util.updateQueryData("getMyPosts", undefined, updatePostCommentCount));

        } catch {
          // Error already handled
        }
      },
    }),
    updateComment: builder.mutation<CreateCommentResponse, { commentId: number | string; content: string; postId: number | string }>({
      query: ({ commentId, content }) => ({
        url: `/api/comments/${commentId}/`,
        method: "PATCH",
        body: { content },
      }),
      invalidatesTags: (result, error, { postId }) => [{ type: 'Comments' as const, id: postId }],
    }),
    deleteComment: builder.mutation<void, { commentId: number | string; postId: number | string }>({
      query: ({ commentId }) => ({
        url: `/api/comments/${commentId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { postId }) => [{ type: 'Comments' as const, id: postId }],
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          // Update the post's comment count
          const updatePostCommentCount = (draft: GetPostsResponse) => {
            const updatePost = (posts: PostItem[] | undefined) => {
              if (!posts) return;
              const postItem = posts.find((p) => p.id === postId);
              if (postItem && postItem.comments_count && postItem.comments_count > 0) {
                postItem.comments_count = postItem.comments_count - 1;
              }
            };
            if (draft.posts) updatePost(draft.posts);
            if (draft.data) updatePost(draft.data);
            if (draft.results) {
              if (Array.isArray(draft.results)) {
                updatePost(draft.results);
              } else if (draft.results.data) {
                updatePost(draft.results.data);
              }
            }
          };

          dispatch(postApi.util.updateQueryData("getNewsFeed", undefined, updatePostCommentCount));
          dispatch(postApi.util.updateQueryData("getMyPosts", undefined, updatePostCommentCount));

        } catch {
          // Error already handled
        }
      },
    }),
    followUser: builder.mutation<{ success?: boolean; message?: string; id?: number | string; following_id?: number | string;[key: string]: unknown }, { userId: number | string }>({
      query: ({ userId }) => ({
        url: `/api/follows/`,
        method: "POST",
        body: { following: userId },
      }),
      invalidatesTags: () => [{ type: 'Followers' }],
    }),
    unfollowUser: builder.mutation<{ success?: boolean; message?: string;[key: string]: unknown }, { followingId: number | string }>({
      query: ({ followingId }) => ({
        url: `/api/follows/${followingId}/`,
        method: "DELETE",
        body: { following: 0 },
      }),
      invalidatesTags: () => [{ type: 'Followers' }],
    }),
    getFollowing: builder.query<GetFollowersResponse, { limit?: number; page?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.append('following', 'true');
        if (params?.limit) {
          searchParams.append('limit', params.limit.toString());
        }
        if (params?.page) {
          searchParams.append('page', params.page.toString());
        }
        return {
          url: `/api/follows/?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: () => [{ type: 'Followers' }],
    }),
    getFollowers: builder.query<GetFollowersResponse, { limit?: number; page?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.append('followers', 'true');
        if (params?.limit) {
          searchParams.append('limit', params.limit.toString());
        }
        if (params?.page) {
          searchParams.append('page', params.page.toString());
        }
        return {
          url: `/api/follows/?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: () => [{ type: 'Followers' }],
    }),
    getSuggestions: builder.query<GetSuggestionsResponse, { limit?: number; page?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.limit) {
          searchParams.append('limit', params.limit.toString());
        }
        if (params?.page) {
          searchParams.append('page', params.page.toString());
        }
        const queryString = searchParams.toString();
        return {
          url: `/api/follows/suggestions/${queryString ? `?${queryString}` : ''}`,
          method: "GET",
        };
      },
      providesTags: () => [{ type: 'Followers' }],
    }),
    toggleFollow: builder.mutation<{ success?: boolean; message?: string; data?: { status?: string; following?: boolean } }, { userId: number | string }>({
      query: ({ userId }) => ({
        url: "/api/follows/toggle_follow/",
        method: "POST",
        body: { following_id: userId },
      }),
      invalidatesTags: () => [{ type: 'Followers' }, { type: 'UserProfile' }],
    }),
    getUserProfile: builder.query<{ success?: boolean; message?: string; data?: { user_id?: number | string; username?: string; followers_count?: number; following_count?: number; posts_count?: number; is_following?: boolean } }, number | string>({
      query: (userId) => ({
        url: `/api/follows/user_profile/?user_id=${userId}`,
        method: "GET",
      }),
      providesTags: () => [{ type: 'UserProfile' }, { type: 'Followers' }],
    }),
    reportPost: builder.mutation<{ success?: boolean; message?: string; data?: unknown }, { postId: number | string; reason: string; description?: string }>({
      query: ({ postId, reason, description }) => ({
        url: `/api/post-reports/`,
        method: "POST",
        body: { post: postId, reason, description },
      }),
    }),
    getPostReports: builder.query<{ data?: PostReportItem[]; results?: { data?: PostReportItem[] } }, void>({
      query: () => ({
        url: `/api/post-reports/`,
        method: "GET",
      }),
      providesTags: () => [{ type: 'PostReports' }],
    }),
    reviewReport: builder.mutation<{ success?: boolean; message?: string; data?: PostReportItem }, { reportId: number | string; status: 'reviewed' | 'resolved' | 'dismissed' }>({
      query: ({ reportId, status }) => ({
        url: `/api/post-reports/${reportId}/review/`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: () => [{ type: 'PostReports' }, { type: 'UnifiedReports' }],
    }),
    getUnifiedReports: builder.query<{
      data?: UnifiedReportItem[];
      results?: UnifiedReportItem[] | { data?: UnifiedReportItem[] };
      count?: number;
      success?: boolean;
      message?: string
    }, { status?: string; start_date?: string; end_date?: string; search?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && typeof params === 'object') {
          if (params.status) searchParams.append('status', params.status);
          if (params.start_date) searchParams.append('start_date', params.start_date);
          if (params.end_date) searchParams.append('end_date', params.end_date);
          if (params.search) searchParams.append('search', params.search);
        }
        const queryString = searchParams.toString();
        return {
          url: `/api/reports/all/${queryString ? `?${queryString}` : ''}`,
          method: "GET",
        };
      },
      providesTags: () => [{ type: 'UnifiedReports' }],
    }),
    reviewUnifiedReport: builder.mutation<{ success?: boolean; message?: string; data?: unknown }, { reportId: number | string; reportType: 'post' | 'user'; status: 'reviewed' | 'resolved' | 'dismissed' }>({
      query: ({ reportId, reportType, status }) => {
        if (reportType === 'post') {
          return {
            url: `/api/post-reports/${reportId}/review/`,
            method: "PATCH",
            body: { status },
          };
        } else {
          return {
            url: `/api/chat/reports/${reportId}/update/`,
            method: "PATCH",
            body: { status },
          };
        }
      },
      invalidatesTags: () => [{ type: 'PostReports' }, { type: 'UserReports' }, { type: 'UnifiedReports' }],
    }),
    deleteUnifiedReport: builder.mutation<{ success?: boolean; message?: string; error?: string }, { reportId: number | string; reportType: 'post' | 'user' }>({
      query: ({ reportId, reportType }) => {
        if (reportType === 'post') {
          return {
            url: `/api/post-reports/${reportId}/`,
            method: "DELETE",
          };
        } else {
          return {
            url: `/api/chat/reports/${reportId}/`,
            method: "DELETE",
          };
        }
      },
      invalidatesTags: () => [{ type: 'PostReports' }, { type: 'UserReports' }, { type: 'UnifiedReports' }],
    }),
    sharePost: builder.mutation<{ success?: boolean; message?: string; data?: PostItem }, { post: number | string }>({
      query: (data) => {
        const formData = new FormData();
        formData.append("post", data.post.toString());
        return {
          url: "/api/shares/",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: () => [{ type: 'UserProfile' }],
    }),
    blockUserGlobal: builder.mutation<{ success?: boolean; message?: string }, { userId: number | string }>({
      query: ({ userId }) => ({
        url: `/auth/admin/users/${userId}/block/`,
        method: "POST",
      }),
      invalidatesTags: ["UnifiedReports"],
    }),
    blockUserLocal: builder.mutation<{ success?: boolean; message?: string }, { blockerId: number | string; blockedId: number | string }>({
      query: ({ blockerId, blockedId }) => ({
        url: `/api/chat/admin/block-local/`,
        method: "POST",
        body: { blocker_id: blockerId, blocked_id: blockedId },
      }),
      invalidatesTags: ["UnifiedReports"],
    }),
    unblockUserGlobal: builder.mutation<{ success?: boolean; message?: string }, { userId: number | string }>({
      query: ({ userId }) => ({
        url: `/auth/admin/users/${userId}/unblock/`,
        method: "POST",
      }),
      invalidatesTags: ["UnifiedReports"],
    }),
    unblockUserLocal: builder.mutation<{ success?: boolean; message?: string }, { blockerId: number | string; blockedId: number | string }>({
      query: ({ blockerId, blockedId }) => ({
        url: `/api/chat/admin/unblock-local/`,
        method: "POST",
        body: { blocker_id: blockerId, blocked_id: blockedId },
      }),
      invalidatesTags: ["UnifiedReports"],
    }),
    getAdminChatHistory: builder.query<{ success?: boolean; data?: ChatMessage[]; count?: number }, { reporterId: number | string; reportedId: number | string }>({
      query: ({ reporterId, reportedId }) => ({
        url: `/api/chat/admin/history/?reporter_id=${reporterId}&reported_id=${reportedId}`,
        method: "GET",
      }),
    }),
    deletePostAsAdmin: builder.mutation<{ success?: boolean; message?: string }, { postId: number | string }>({
      query: ({ postId }) => ({
        url: `/api/posts/${postId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["UnifiedReports"],
    }),
  }),
});

export interface ChatMessage {
  id: number | string;
  sender?: {
    id: number | string;
    username: string;
    display_name?: string;
    avatar?: string;
  };
  receiver?: {
    id: number | string;
    username: string;
    display_name?: string;
    avatar?: string;
  };
  content?: string;
  created_at: string;
  is_read?: boolean;
}

export interface PostReportItem {
  id: number | string;
  reporter?: {
    id: number | string;
    username: string;
    display_name?: string;
    avatar?: string;
    email?: string;
    is_active?: boolean;
    is_blocked_locally?: boolean;
  };
  post?: number | string;
  post_id?: number | string;
  post_title?: string;
  post_author_details?: {
    id: number | string;
    username: string;
    display_name?: string;
    avatar?: string;
    email?: string;
    is_active?: boolean;
    is_blocked_locally?: boolean;
  };
  reason: string;
  description?: string;
  status: string;
  reviewed_by?: number | string;
  reviewed_by_details?: {
    id: number | string;
    username: string;
    display_name?: string;
    avatar?: string;
  };
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface UnifiedReportItem extends PostReportItem {
  report_type: 'post' | 'user';
  type_label: string;
  reported_user?: {
    id: number | string;
    username: string;
    display_name?: string;
    avatar?: string;
    email?: string;
    is_active?: boolean;
    is_blocked_locally?: boolean;
  };
  reported_user_id?: number | string;
  admin_notes?: string;
}

export const {
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetMyPostsQuery,
  useGetUserPostsQuery,
  useGetNewsFeedQuery,
  useGetAllPostsQuery,
  useToggleFollowMutation,
  useGetUserProfileQuery,
  useGetRejectedPostsQuery,
  useGetCommunityPostsQuery,
  useLikePostMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowingQuery,
  useGetFollowersQuery,
  useGetSuggestionsQuery,
  useReportPostMutation,
  useGetPostReportsQuery,
  useReviewReportMutation,
  useGetUnifiedReportsQuery,
  useReviewUnifiedReportMutation,
  useDeleteUnifiedReportMutation,
  useGetPostByIdQuery,
  useApprovePostMutation,
  useSharePostMutation,
  useBlockUserGlobalMutation,
  useBlockUserLocalMutation,
  useUnblockUserGlobalMutation,
  useUnblockUserLocalMutation,
  useGetAdminChatHistoryQuery,
  useDeletePostAsAdminMutation,
} = postApi;