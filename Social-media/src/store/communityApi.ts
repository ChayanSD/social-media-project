import { baseApi } from "./baseApi";

export interface CreateCommunityRequest {
  name: string;
  description: string;
  profile_image?: File;
  cover_image?: File;
  visibility: "public" | "restricted" | "private";
  // Optional post fields for initial community post
  title?: string;
  content?: string;
  post_type?: "text" | "media" | "link";
  tags?: string[];
}

export interface UpdateCommunityRequest {
  title: string;
  description?: string;
  profile_image?: File;
  cover_image?: File;
  visibility?: "public" | "restricted" | "private";
}

export interface CreateCommunityResponse {
  id?: number | string;
  name?: string;
  description?: string;
  message?: string;
  success?: boolean;
  [key: string]: unknown;
}

export interface CommunityItem {
  id: number | string;
  name?: string;
  title?: string;
  description?: string;
  profile_image?: string | null;
  cover_image?: string | null;
  icon?: string;
  banner?: string;
  visibility?: "public" | "restricted" | "private";
  members_count?: number;
  posts_count?: number;
  created_at?: string;
  created_by?: number;
  created_by_username?: string;
  updated_at?: string;
  is_member?: boolean;
  user_role?: string;
  can_post?: boolean;
  can_manage?: boolean;
  can_view?: boolean;
  user_has_pending_request?: boolean;
  user_has_pending_invitation?: boolean;
  [key: string]: unknown;
}

export interface GetMyCommunitiesResponse {
  data?: CommunityItem[];
  results?: {
    data?: CommunityItem[];
  };
  communities?: CommunityItem[];
  [key: string]: unknown;
}

export interface PopularCommunitiesResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: {
    success?: boolean;
    message?: string;
    data?: CommunityItem[];
  };
  [key: string]: unknown;
}

export interface JoinLeaveCommunityResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface JoinRequestItem {
  id: number | string;
  user: number | string;
  username?: string;
  user_avatar?: string;
  user_display_name?: string;
  community: number | string;
  community_name?: string;
  community_title?: string;
  status?: 'pending' | 'approved' | 'rejected';
  message?: string;
  created_at?: string;
  reviewed_by?: number | string | null;
  reviewed_by_username?: string | null;
  reviewed_at?: string | null;
  [key: string]: unknown;
}

export interface JoinRequestsResponse {
  data?: JoinRequestItem[];
  results?: JoinRequestItem[];
  [key: string]: unknown;
}

export interface CommunityMemberItem {
  id: number | string;
  user: number | string;
  username?: string;
  user_avatar?: string;
  user_display_name?: string;
  community: number | string;
  community_name?: string;
  role?: 'member' | 'moderator' | 'admin';
  is_approved?: boolean;
  joined_at?: string;
  [key: string]: unknown;
}

export interface CommunityMembersResponse {
  data?: CommunityMemberItem[];
  results?: {
    data?: CommunityMemberItem[];
  };
  [key: string]: unknown;
}

export interface CommunityInvitationItem {
  id: number | string;
  community: number | string;
  community_name?: string;
  community_title?: string;
  inviter: number | string;
  inviter_username?: string;
  invitee: number | string;
  invitee_username?: string;
  status?: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  created_at?: string;
  responded_at?: string | null;
  [key: string]: unknown;
}

export interface CommunityInvitationsResponse {
  data?: CommunityInvitationItem[];
  results?: CommunityInvitationItem[];
  [key: string]: unknown;
}

export interface InviteUserRequest {
  community: string;
  user_id: number | string;
  message?: string;
}

export const communityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCommunity: builder.mutation<CreateCommunityResponse, CreateCommunityRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("visibility", data.visibility);

        // Map to post fields expected by the API
        const title = data.title ?? data.name;
        const content = data.content ?? data.description;
        const postType = data.post_type ?? "text";

        formData.append("title", title);
        formData.append("content", content);
        formData.append("post_type", postType);

        if (Array.isArray(data.tags)) {
          data.tags.forEach((tag) => formData.append("tags", tag));
        }

        if (data.profile_image) {
          formData.append("profile_image", data.profile_image);
          console.log("Added profile_image to FormData:", data.profile_image.name, data.profile_image.size);
        }
        if (data.cover_image) {
          formData.append("cover_image", data.cover_image);
          console.log("Added cover_image to FormData:", data.cover_image.name, data.cover_image.size);
        }

        // Log FormData contents for debugging
        console.log("FormData entries:");
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}:`, value.name, value.size, value.type);
          } else {
            console.log(`${key}:`, value);
          }
        }

        return {
          url: "/api/communities/",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Communities"],
    }),
    getMyCommunities: builder.query<GetMyCommunitiesResponse, void>({
      query: () => ({
        url: "/api/communities/my_communities/",
        method: "GET",
      }),
      providesTags: ["Communities"],
    }),
    updateCommunity: builder.mutation<CreateCommunityResponse, { communityName: string; data: UpdateCommunityRequest }>({
      query: ({ communityName, data }) => {
        const formData = new FormData();
        formData.append("title", data.title);
        
        if (data.description !== undefined) {
          formData.append("description", data.description);
        }
        if (data.visibility !== undefined) {
          formData.append("visibility", data.visibility);
        }
        if (data.profile_image) {
          formData.append("profile_image", data.profile_image);
          console.log("Added profile_image to FormData:", data.profile_image.name, data.profile_image.size);
        }
        if (data.cover_image) {
          formData.append("cover_image", data.cover_image);
          console.log("Added cover_image to FormData:", data.cover_image.name, data.cover_image.size);
        }

        // Log FormData contents for debugging
        console.log("FormData entries:");
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}:`, value.name, value.size, value.type);
          } else {
            console.log(`${key}:`, value);
          }
        }

        return {
          url: `/api/communities/${communityName}/`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["Communities"],
    }),
    getPopularCommunities: builder.query<PopularCommunitiesResponse, void>({
      query: () => ({
        url: "/api/communities/popular/",
        method: "GET",
      }),
      providesTags: ["Communities"],
    }),
    joinCommunity: builder.mutation<JoinLeaveCommunityResponse, string>({
      query: (communityName) => ({
        url: `/api/communities/${communityName}/join/`,
        method: "POST",
      }),
      invalidatesTags: ["Communities"],
    }),
    leaveCommunity: builder.mutation<JoinLeaveCommunityResponse, string>({
      query: (communityName) => ({
        url: `/api/communities/${communityName}/leave/`,
        method: "POST",
      }),
      invalidatesTags: ["Communities"],
    }),
    deleteCommunity: builder.mutation<{ success?: boolean; message?: string; [key: string]: unknown }, string>({
      query: (communityName) => ({
        url: `/api/communities/${communityName}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Communities"],
    }),
    cancelJoinRequest: builder.mutation<JoinLeaveCommunityResponse, string>({
      query: (communityName) => ({
        url: `/api/join-requests/cancel/`,
        method: "POST",
        body: { community: communityName },
      }),
      invalidatesTags: ["Communities", "JoinRequests"],
    }),
    getJoinRequests: builder.query<JoinRequestsResponse, string>({
      query: (communityName) => ({
        url: `/api/join-requests/?community=${encodeURIComponent(communityName)}`,
        method: "GET",
      }),
      providesTags: (result, error, communityName) => [
        { type: "JoinRequests", id: communityName },
      ],
    }),
    approveJoinRequest: builder.mutation<JoinLeaveCommunityResponse, number | string>({
      query: (requestId) => ({
        url: `/api/join-requests/${requestId}/approve/`,
        method: "POST",
      }),
      invalidatesTags: () => [
        "Communities",
        "JoinRequests",
      ],
    }),
    rejectJoinRequest: builder.mutation<JoinLeaveCommunityResponse, number | string>({
      query: (requestId) => ({
        url: `/api/join-requests/${requestId}/reject/`,
        method: "POST",
      }),
      invalidatesTags: () => [
        "Communities",
        "JoinRequests",
      ],
    }),
    getCommunityMembers: builder.query<CommunityMembersResponse, string>({
      query: (communityName) => ({
        url: `/api/communities/${encodeURIComponent(communityName)}/members/`,
        method: "GET",
      }),
      providesTags: (result, error, communityName) => [
        { type: "CommunityMembers", id: communityName },
      ],
    }),
    getInvitations: builder.query<CommunityInvitationsResponse, void>({
      query: () => ({
        url: "/api/invitations/",
        method: "GET",
      }),
      providesTags: ["Invitations"],
    }),
    inviteUserToCommunity: builder.mutation<JoinLeaveCommunityResponse, InviteUserRequest>({
      query: (data) => ({
        url: "/api/communities/invite/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Communities", "Invitations"],
    }),
    acceptInvitation: builder.mutation<JoinLeaveCommunityResponse, number | string>({
      query: (invitationId) => ({
        url: `/api/invitations/${invitationId}/accept/`,
        method: "POST",
      }),
      invalidatesTags: () => [
        "Communities",
        "Invitations",
      ],
    }),
    rejectInvitation: builder.mutation<JoinLeaveCommunityResponse, number | string>({
      query: (invitationId) => ({
        url: `/api/invitations/${invitationId}/reject/`,
        method: "POST",
      }),
      invalidatesTags: () => [
        "Communities",
        "Invitations",
      ],
    }),
  }),
});

export const { 
  useCreateCommunityMutation, 
  useGetMyCommunitiesQuery, 
  useUpdateCommunityMutation,
  useGetPopularCommunitiesQuery,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
  useDeleteCommunityMutation,
  useCancelJoinRequestMutation,
  useGetJoinRequestsQuery,
  useApproveJoinRequestMutation,
  useRejectJoinRequestMutation,
  useGetCommunityMembersQuery,
  useGetInvitationsQuery,
  useInviteUserToCommunityMutation,
  useAcceptInvitationMutation,
  useRejectInvitationMutation,
} = communityApi;

