import { baseApi } from "./baseApi";

export interface SendOtpRequest {
  email: string;
}

export interface SendOtpResponse {
  message?: string;
  success?: boolean;
  // Add other response fields as needed based on your API
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  message?: string;
  success?: boolean;
  // Add other response fields as needed based on your API
}

export interface SetCredentialsRequest {
  email: string;
  username: string;
  password: string;
}

export interface SetCredentialsResponse {
  message?: string;
  success?: boolean;
  token?: string;
  tokens?: {
    access: string;
    refresh: string;
  };
  user?: {
    id: number;
    email: string;
    username: string;
    role: string;
  };
  // Add other response fields as needed based on your API
}

export interface LoginRequest {
  email_or_username: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  success?: boolean;
  token?: string;
  tokens?: {
    access: string;
    refresh: string;
  };
  user?: {
    id?: string | number;
    email?: string;
    username?: string;
    role?: string;
    [key: string]: unknown;
  };
  // Add other response fields as needed based on your API
}

export interface UserProfile {
  id?: string | number;
  email?: string;
  username?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  avatar?: string;
  display_name?: string | null;
  about?: string | null;
  social_link?: string | null;
  cover_photo?: string | null;
  [key: string]: unknown;
}

export interface UserProfileResponse {
  data: UserProfile;
  message?: string;
}

export interface UpdateUserProfileRequest {
  display_name?: string;
  about?: string;
  social_link?: string;
  avatar?: File | null;
  cover_photo?: File | null;
  subcategory_ids?: number[];
}

export interface Subcategory {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

export interface CategoriesResponse {
  data: Category[];
}

export interface User {
  id: string | number;
  email?: string;
  username?: string;
  display_name?: string | null;
  avatar?: string | null;
  profile_image?: string | null;
  role?: string;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
  [key: string]: unknown;
}

export interface GetUsersResponse {
  data?: User[];
  results?: {
    data?: User[];
  };
  users?: User[];
  [key: string]: unknown;
}

export interface SendPasswordResetOtpRequest {
  email: string;
}

export interface SendPasswordResetOtpResponse {
  message?: string;
  success?: boolean;
  error?: string;
}

export interface VerifyPasswordResetOtpRequest {
  email: string;
  code: string;
}

export interface VerifyPasswordResetOtpResponse {
  message?: string;
  success?: boolean;
  error?: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  message?: string;
  success?: boolean;
  error?: string;
}

export interface ContactRequest {
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  subject?: string;
  message?: string;
  created_at?: string;
  is_read?: boolean;
  read_at?: string | null;
  read_by?: number | null;
  read_by_name?: string | null;
}

export interface GetContactsResponse {
  data?: ContactResponse[];
  results?: {
    data?: ContactResponse[];
  };
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendOtp: builder.mutation<SendOtpResponse, SendOtpRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("email", data.email);
        
        return {
          url: "/auth/send-otp/",
          method: "POST",
          body: formData,
        };
      },
    }),
    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("code", data.code);
        
        return {
          url: "/auth/verify-otp/",
          method: "POST",
          body: formData,
        };
      },
    }),
    setCredentials: builder.mutation<SetCredentialsResponse, SetCredentialsRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("username", data.username);
        formData.append("password", data.password);
        
        return {
          url: "/auth/set-credentials/",
          method: "POST",
          body: formData,
        };
      },
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("email_or_username", data.email_or_username);
        formData.append("password", data.password);
        
        return {
          url: "/auth/login/",
          method: "POST",
          body: formData,
        };
      },
    }),
    getCurrentUserProfile: builder.query<UserProfileResponse, void>({
      query: () => ({
        url: "/auth/user-profiles/me/",
        method: "GET",
      }),
      providesTags: ["UserProfile"],
    }),
    getUserProfileById: builder.query<UserProfileResponse, number | string>({
      query: (userId) => ({
        url: `/auth/user-profiles/${userId}/`,
        method: "GET",
      }),
      providesTags: ["UserProfile"],
    }),
    updateUserProfile: builder.mutation<UserProfileResponse, UpdateUserProfileRequest>({
      query: (data) => {
        const hasFileUploads = Boolean(data.avatar || data.cover_photo);
        const payload: Record<string, unknown> = {};

        if (typeof data.display_name !== "undefined") {
          payload.display_name = data.display_name;
        }
        if (typeof data.about !== "undefined") {
          payload.about = data.about;
        }
        if (typeof data.social_link !== "undefined") {
          payload.social_link = data.social_link;
        }
        if (data.subcategory_ids && data.subcategory_ids.length > 0) {
          payload.subcategories = data.subcategory_ids;
        }

        if (!hasFileUploads) {
          return {
            url: "/auth/user-profiles/update_me/",
            method: "PATCH",
            body: payload,
          };
        }

        const formData = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item) => formData.append(key, item.toString()));
          } else if (typeof value !== "undefined") {
            formData.append(key, String(value));
          }
        });

        if (data.avatar) {
          formData.append("avatar", data.avatar);
        }
        if (data.cover_photo) {
          formData.append("cover_photo", data.cover_photo);
        }

        return {
          url: "/auth/user-profiles/update_me/",
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["UserProfile"],
    }),
    getCategories: builder.query<CategoriesResponse, void>({
      query: () => ({
        url: "/api/categories/",
        method: "GET",
      }),
    }),
    getUsers: builder.query<GetUsersResponse, { status?: string; start_date?: string; end_date?: string; search?: string } | void>({
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
          url: `/auth/admin/users/${queryString ? `?${queryString}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["UserProfile"],
    }),
    getPublicUsers: builder.query<GetUsersResponse, void>({
      query: () => ({
        url: "/auth/users/",
        method: "GET",
      }),
      providesTags: ["UserProfile"],
    }),
    sendPasswordResetOtp: builder.mutation<SendPasswordResetOtpResponse, SendPasswordResetOtpRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("email", data.email);
        
        return {
          url: "/auth/password-reset/send-otp/",
          method: "POST",
          body: formData,
        };
      },
    }),
    verifyPasswordResetOtp: builder.mutation<VerifyPasswordResetOtpResponse, VerifyPasswordResetOtpRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("code", data.code);
        
        return {
          url: "/auth/password-reset/verify-otp/",
          method: "POST",
          body: formData,
        };
      },
    }),
    resetPassword: builder.mutation<ResetPasswordResponse, ResetPasswordRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("code", data.code);
        formData.append("new_password", data.new_password);
        formData.append("confirm_password", data.confirm_password);
        
        return {
          url: "/auth/password-reset/reset/",
          method: "POST",
          body: formData,
        };
      },
    }),
    submitContact: builder.mutation<{ success?: boolean; message?: string; data?: ContactResponse }, ContactRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("first_name", data.first_name);
        formData.append("last_name", data.last_name);
        formData.append("email", data.email);
        formData.append("subject", data.subject);
        formData.append("message", data.message);
        
        return {
          url: "/auth/contacts/",
          method: "POST",
          body: formData,
        };
      },
    }),
    getContacts: builder.query<GetContactsResponse, void>({
      query: () => ({
        url: "/auth/contacts/",
        method: "GET",
      }),
      providesTags: () => [{ type: 'Contacts' }],
    }),
    markContactRead: builder.mutation<{ success?: boolean; message?: string; data?: ContactResponse }, { contactId: number | string }>({
      query: ({ contactId }) => ({
        url: `/auth/contacts/${contactId}/mark_read/`,
        method: "PATCH",
      }),
      invalidatesTags: () => [{ type: 'Contacts' }],
    }),
    deleteContact: builder.mutation<{ success?: boolean; message?: string; error?: string }, { contactId: number | string }>({
      query: ({ contactId }) => ({
        url: `/auth/contacts/${contactId}/`,
        method: "DELETE",
      }),
      invalidatesTags: () => [{ type: 'Contacts' }],
    }),
    blockUser: builder.mutation<{ success?: boolean; message?: string; error?: string }, { userId: number | string }>({
      query: ({ userId }) => ({
        url: `/auth/admin/users/${userId}/block/`,
        method: "POST",
      }),
      invalidatesTags: ["UserProfile"],
    }),
    unblockUser: builder.mutation<{ success?: boolean; message?: string; error?: string }, { userId: number | string }>({
      query: ({ userId }) => ({
        url: `/auth/admin/users/${userId}/unblock/`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserProfile"],
    }),
    deleteUser: builder.mutation<{ success?: boolean; message?: string; error?: string }, { userId: number | string }>({
      query: ({ userId }) => ({
        url: `/auth/admin/users/${userId}/delete/`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserProfile"],
    }),
    getCommunities: builder.query<{ success?: boolean; message?: string; data?: unknown[] }, { visibility?: string; start_date?: string; end_date?: string; search?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && typeof params === 'object') {
          if (params.visibility) searchParams.append('visibility', params.visibility);
          if (params.start_date) searchParams.append('start_date', params.start_date);
          if (params.end_date) searchParams.append('end_date', params.end_date);
          if (params.search) searchParams.append('search', params.search);
        }
        const queryString = searchParams.toString();
        return {
          url: `/auth/admin/communities/${queryString ? `?${queryString}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["UserProfile"],
    }),
    deleteCommunity: builder.mutation<{ success?: boolean; message?: string; error?: string }, { communityId: number | string }>({
      query: ({ communityId }) => ({
        url: `/auth/admin/communities/${communityId}/delete/`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserProfile"],
    }),
    getPublicStats: builder.query<{
      success: boolean;
      message?: string;
      data: {
        total_users: number;
        total_posts: number;
        total_communities: number;
      };
    }, void>({
      query: () => ({
        url: "/auth/public/stats/",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useSetCredentialsMutation,
  useLoginMutation,
  useSubmitContactMutation,
  useGetContactsQuery,
  useMarkContactReadMutation,
  useDeleteContactMutation,
  useUpdateUserProfileMutation,
  useGetCategoriesQuery,
  useGetUsersQuery,
  useGetPublicUsersQuery,
  useSendPasswordResetOtpMutation,
  useVerifyPasswordResetOtpMutation,
  useResetPasswordMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useDeleteUserMutation,
  useGetCommunitiesQuery,
  useDeleteCommunityMutation,
  useGetPublicStatsQuery,
} = authApi;

export const   useGetCurrentUserProfileQuery = (
  arg?: void,
  options?: Parameters<typeof authApi.endpoints.getCurrentUserProfile.useQuery>[1]
) => authApi.endpoints.getCurrentUserProfile.useQuery(arg, options);

export const useGetUserProfileByIdQuery = (
  userId: number | string,
  options?: Parameters<typeof authApi.endpoints.getUserProfileById.useQuery>[1]
) => authApi.endpoints.getUserProfileById.useQuery(userId, options);

