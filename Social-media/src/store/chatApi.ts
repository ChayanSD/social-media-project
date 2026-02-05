import { baseApi } from "./baseApi";

export interface ChatRoom {
  id: number | string;
  name?: string;
  participants?: ChatUser[];
  admins?: ChatUser[];
  last_message?: ChatMessage;
  unread_count?: number;
  other_participant?: ChatUser;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ChatUser {
  id: number | string;
  username?: string;
  email?: string;
  display_name?: string;
  avatar?: string;
  is_online?: boolean;
  last_seen?: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: number | string;
  room?: number | string;
  room_id?: number | string;
  sender?: ChatUser;
  sender_id?: number | string;
  sender_username?: string;
  receiver?: ChatUser;
  receiver_id?: number | string;
  content?: string;
  created_at?: string;
  is_read?: boolean;
  reactions?: Record<string, number>;
  user_reaction?: string | null;
  [key: string]: unknown;
}

export interface MessageRequest {
  id: number | string;
  sender?: ChatUser;
  sender_id?: number | string;
  sender_username?: string;
  receiver?: ChatUser;
  receiver_id?: number | string;
  content?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface GetMessageRequestsResponse {
  success?: boolean;
  data?: MessageRequest[];
  [key: string]: unknown;
}

export interface AcceptMessageRequestResponse {
  success?: boolean;
  message?: string;
  data?: {
    request?: MessageRequest;
    message?: ChatMessage;
  };
  [key: string]: unknown;
}

export interface RejectMessageRequestResponse {
  success?: boolean;
  message?: string;
  data?: MessageRequest;
  [key: string]: unknown;
}

export interface GetChatRoomsResponse {
  data?: ChatRoom[];
  results?: ChatRoom[];
  rooms?: ChatRoom[];
  [key: string]: unknown;
}

export interface CreateChatRoomRequest {
  participant_id?: number | string;
  name?: string;
  member_ids?: (number | string)[];
  [key: string]: unknown;
}

export interface CreateChatRoomResponse {
  success?: boolean;
  message?: string;
  data?: ChatRoom;
  room?: ChatRoom;
  id?: number | string;
  [key: string]: unknown;
}

export interface GetMessagesResponse {
  data?: ChatMessage[];
  results?: {
    data?: ChatMessage[];
  };
  messages?: ChatMessage[];
  [key: string]: unknown;
}

export interface SendMessageRequest {
  content: string;
  room?: number | string;
  receiver_id?: number | string;
}

export interface SendMessageResponse {
  success?: boolean;
  message?: string;
  data?: ChatMessage;
  [key: string]: unknown;
}

export interface GetChatUsersResponse {
  data?: ChatUser[];
  results?: {
    data?: ChatUser[];
  };
  users?: ChatUser[];
  [key: string]: unknown;
}

export interface ConversationItem {
  user?: ChatUser;
  last_message?: ChatMessage;
  unread_count?: number;
  last_message_time?: string;
  i_blocked_them?: boolean;
  they_blocked_me?: boolean;
  pending_request?: MessageRequest;
  has_pending_request?: boolean;
  is_request_receiver?: boolean;
}

export interface GetConversationsListResponse {
  data?: ConversationItem[];
  results?: {
    data?: ConversationItem[];
  };
  conversations?: ConversationItem[];
  [key: string]: unknown;
}

export interface AdminConversation {
  id: string;
  type: 'direct' | 'room';
  room_id?: number | string;
  name?: string;
  is_group?: boolean;
  user1?: ChatUser;
  user2?: ChatUser;
  participants?: ChatUser[];
  admins?: ChatUser[];
  last_message?: ChatMessage;
  message_count?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface SearchChatUsersResponse {
  data?: ChatUser[];
  results?: {
    data?: ChatUser[];
  };
  users?: ChatUser[];
  [key: string]: unknown;
}

export interface BlockedUser {
  id: number | string;
  blocked_user?: ChatUser;
  blocked_user_id?: number | string;
  created_at?: string;
}

export interface BlockUserResponse {
  success?: boolean;
  message?: string;
  data?: BlockedUser;
  error?: string;
}

export interface BlockedUsersListResponse {
  success?: boolean;
  data?: BlockedUser[];
}

export interface UserReport {
  id: number | string;
  reporter?: ChatUser;
  reported_user?: ChatUser;
  reported_user_id?: number | string;
  reason?: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_account' | 'other';
  description?: string;
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at?: string;
}

export interface ReportUserRequest {
  reported_user: number | string;
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_account' | 'other';
  description?: string;
}

export interface ReportUserResponse {
  success?: boolean;
  message?: string;
  data?: UserReport;
  error?: string | Record<string, unknown>;
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChatRooms: builder.query<GetChatRoomsResponse, void>({
      query: () => ({
        url: "/api/chat/rooms/",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
            ...(result.data || result.results || result.rooms || []).map(
              (room: ChatRoom) => ({ type: "ChatRooms" as const, id: room.id })
            ),
            { type: "ChatRooms", id: "LIST" },
          ]
          : [{ type: "ChatRooms", id: "LIST" }],
    }),
    createChatRoom: builder.mutation<CreateChatRoomResponse, CreateChatRoomRequest>({
      query: (data) => ({
        url: "/api/chat/rooms/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ChatRooms"],
    }),
    getRoomMessages: builder.query<GetMessagesResponse, number | string>({
      query: (roomId) => ({
        url: `/api/chat/rooms/${roomId}/messages/`,
        method: "GET",
      }),
      providesTags: (result, error, roomId) => [{ type: "Messages", id: roomId }],
    }),
    sendMessage: builder.mutation<SendMessageResponse, SendMessageRequest>({
      query: (data) => ({
        url: `/api/chat/rooms/${data.room}/send_message/`,
        method: "POST",
        body: { content: data.content },
      }),
      async onQueryStarted({ room }, { dispatch, queryFulfilled }) {
        if (!room) return;

        try {
          await queryFulfilled;
          // Invalidate to refetch with the new message
          dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: room }]));
          dispatch(chatApi.util.invalidateTags(["ChatRooms"]));
        } catch {
          // Error handling
        }
      },
    }),
    updateChatRoom: builder.mutation<CreateChatRoomResponse, { id: number | string; name: string }>({
      query: ({ id, name }) => ({
        url: `/api/chat/rooms/${id}/`,
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: ["ChatRooms"],
    }),
    deleteChatRoom: builder.mutation<{ success: boolean }, number | string>({
      query: (id) => ({
        url: `/api/chat/rooms/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ChatRooms"],
    }),
    getChatUsers: builder.query<GetChatUsersResponse, void>({
      query: () => ({
        url: "/api/chat/users/",
        method: "GET",
      }),
      providesTags: ["ChatUsers"],
    }),
    searchChatUsers: builder.query<SearchChatUsersResponse, string>({
      query: (query) => ({
        url: `/api/chat/users/search/?q=${encodeURIComponent(query)}`,
        method: "GET",
      }),
      providesTags: ["ChatUsers"],
    }),
    // Direct messaging endpoints
    sendDirectMessage: builder.mutation<SendMessageResponse, { receiver_id: number | string; content: string }>({
      query: (data) => ({
        url: "/api/chat/messages/send/",
        method: "POST",
        body: {
          receiver_id: data.receiver_id,
          content: data.content,
        },
      }),
      async onQueryStarted({ receiver_id }, { dispatch, queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          // Check if it's a message request (is_request flag)
          if (result.data.data && typeof result.data.data === 'object' && 'is_request' in result.data.data && result.data.data.is_request) {
            // Invalidate message requests to show the new request
            dispatch(chatApi.util.invalidateTags(["MessageRequests"]));
          } else {
            // Invalidate conversation messages to refetch
            dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: receiver_id }]));
            // Invalidate conversations list so the new conversation appears
            dispatch(chatApi.util.invalidateTags(["Conversations"]));
          }
          // Also invalidate chat users to refresh the list
          dispatch(chatApi.util.invalidateTags(["ChatUsers"]));
        } catch (error: unknown) {
          // Check if error is about message request
          const errorData = error && typeof error === 'object' && 'data' in error
            ? error.data as { error?: string; message?: string; request_id?: number | string }
            : null;

          if (errorData?.error?.includes('message request') || errorData?.request_id) {
            // Invalidate message requests to refresh the list
            dispatch(chatApi.util.invalidateTags(["MessageRequests"]));
          }
        }
      },
    }),
    getConversation: builder.query<GetMessagesResponse, number | string>({
      query: (userId) => ({
        url: `/api/chat/messages/conversation/?user_id=${userId}`,
        method: "GET",
      }),
      providesTags: (result, error, userId) => [{ type: "Messages", id: userId }],
    }),
    getConversationsList: builder.query<GetConversationsListResponse, void>({
      query: () => ({
        url: "/api/chat/messages/conversations/",
        method: "GET",
      }),
      providesTags: ["Conversations"],
    }),
    makeRoomAdmin: builder.mutation<CreateChatRoomResponse, { roomId: number | string; user_id: number | string }>({
      query: ({ roomId, user_id }) => ({
        url: `/api/chat/rooms/${roomId}/make_admin/`,
        method: "POST",
        body: { user_id },
      }),
      invalidatesTags: (result, error, { roomId }) => [
        { type: "ChatRooms", id: roomId },
        { type: "ChatRooms", id: "LIST" },
      ],
    }),
    removeRoomMember: builder.mutation<CreateChatRoomResponse, { roomId: number | string; user_id: number | string }>({
      query: ({ roomId, user_id }) => ({
        url: `/api/chat/rooms/${roomId}/remove_member/`,
        method: "POST",
        body: { user_id },
      }),
      invalidatesTags: (result, error, { roomId }) => [
        { type: "ChatRooms", id: roomId },
        { type: "ChatRooms", id: "LIST" },
      ],
    }),
    addRoomMembers: builder.mutation<CreateChatRoomResponse, { roomId: number | string; member_ids: (number | string)[] }>({
      query: ({ roomId, member_ids }) => ({
        url: `/api/chat/rooms/${roomId}/add_members/`,
        method: "POST",
        body: { member_ids },
      }),
      invalidatesTags: ["ChatRooms"],
    }),
    // Block and Report endpoints
    blockUser: builder.mutation<BlockUserResponse, { user_id: number | string }>({
      query: (data) => ({
        url: "/api/chat/block/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { user_id }) => [
        "ChatUsers",
        "Conversations",
        "ChatRooms",
        "BlockedUsers",
        { type: "Messages", id: user_id }, // Invalidate conversation to update block status
      ],
    }),
    unblockUser: builder.mutation<{ success?: boolean; message?: string; error?: string }, { user_id: number | string }>({
      query: (data) => ({
        url: "/api/chat/unblock/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { user_id }) => [
        "ChatUsers",
        "Conversations",
        "ChatRooms",
        "BlockedUsers",
        { type: "Messages", id: user_id }, // Invalidate conversation to update block status
      ],
    }),
    getBlockedUsers: builder.query<BlockedUsersListResponse, void>({
      query: () => ({
        url: "/api/chat/blocked-users/",
        method: "GET",
      }),
      providesTags: ["BlockedUsers"],
    }),
    reportUser: builder.mutation<ReportUserResponse, ReportUserRequest>({
      query: (data) => ({
        url: "/api/chat/report/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["UserReports"],
    }),
    // Message edit and delete endpoints
    updateDirectMessage: builder.mutation<SendMessageResponse, { message_id: number | string; content: string }>({
      query: (data) => ({
        url: "/api/chat/messages/update/",
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted({ message_id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate all message queries to refetch
          dispatch(chatApi.util.invalidateTags(["Messages"]));
          dispatch(chatApi.util.invalidateTags(["Conversations"]));
        } catch {
          // Error handling
        }
      },
    }),
    deleteDirectMessage: builder.mutation<{ success?: boolean; message?: string; error?: string }, { message_id: number | string }>({
      query: ({ message_id }) => ({
        url: `/api/chat/messages/delete/?message_id=${message_id}`,
        method: "DELETE",
      }),
      async onQueryStarted({ message_id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate all message queries to refetch
          dispatch(chatApi.util.invalidateTags(["Messages"]));
          dispatch(chatApi.util.invalidateTags(["Conversations"]));
        } catch {
          // Error handling
        }
      },
    }),
    updateRoomMessage: builder.mutation<SendMessageResponse, { roomId: number | string; message_id: number | string; content: string }>({
      query: ({ roomId, message_id, content }) => ({
        url: `/api/chat/rooms/${roomId}/update_message/`,
        method: "PATCH",
        body: { message_id, content },
      }),
      async onQueryStarted({ roomId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: roomId }]));
          dispatch(chatApi.util.invalidateTags(["ChatRooms"]));
        } catch {
          // Error handling
        }
      },
    }),
    deleteRoomMessage: builder.mutation<{ success?: boolean; message?: string; error?: string }, { roomId: number | string; message_id: number | string }>({
      query: ({ roomId, message_id }) => ({
        url: `/api/chat/rooms/${roomId}/delete_message/?message_id=${message_id}`,
        method: "DELETE",
      }),
      async onQueryStarted({ roomId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: roomId }]));
          dispatch(chatApi.util.invalidateTags(["ChatRooms"]));
        } catch {
          // Error handling
        }
      },
    }),
    // Admin endpoints
    getAdminAllConversations: builder.query<
      {
        count?: number;
        next?: string | null;
        previous?: string | null;
        results?: { success?: boolean; data?: AdminConversation[] };
        data?: AdminConversation[];
      },
      { page?: number; limit?: number; type?: string; search?: string }
    >({
      query: ({ page = 1, limit = 10, type, search }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (type && type !== 'all') {
          params.append('type', type);
        }
        if (search) {
          params.append('search', search);
        }
        return {
          url: `/api/chat/admin/conversations/?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Conversations"],
    }),
    getAdminConversationMessages: builder.query<
      GetMessagesResponse,
      { type: 'direct' | 'room'; user1_id?: number | string; user2_id?: number | string; room_id?: number | string }
    >({
      query: ({ type, user1_id, user2_id, room_id }) => {
        const params = new URLSearchParams();
        params.append('type', type);
        if (type === 'direct' && user1_id && user2_id) {
          params.append('user1_id', user1_id.toString());
          params.append('user2_id', user2_id.toString());
        } else if (type === 'room' && room_id) {
          params.append('room_id', room_id.toString());
        }
        return {
          url: `/api/chat/admin/conversation/messages/?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result, error, arg) => [{ type: "Messages", id: arg.type === 'direct' ? `${arg.user1_id}_${arg.user2_id}` : arg.room_id }],
    }),
    deleteAdminConversation: builder.mutation<
      { success?: boolean; message?: string; error?: string; deleted_count?: number },
      { type: 'direct' | 'room'; user1_id?: number | string; user2_id?: number | string; room_id?: number | string }
    >({
      query: ({ type, user1_id, user2_id, room_id }) => {
        const params = new URLSearchParams();
        params.append('type', type);
        if (type === 'direct' && user1_id && user2_id) {
          params.append('user1_id', user1_id.toString());
          params.append('user2_id', user2_id.toString());
        } else if (type === 'room' && room_id) {
          params.append('room_id', room_id.toString());
        }
        return {
          url: `/api/chat/admin/conversation/delete/?${params.toString()}`,
          method: "DELETE",
        };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate conversations list to refresh
          dispatch(chatApi.util.invalidateTags(["Conversations"]));
          dispatch(chatApi.util.invalidateTags(["ChatRooms"]));
          dispatch(chatApi.util.invalidateTags(["Messages"]));
        } catch {
          // Error handling
        }
      },
    }),
    // Message request endpoints
    getMessageRequests: builder.query<GetMessageRequestsResponse, void>({
      query: () => ({
        url: "/api/chat/message-requests/",
        method: "GET",
      }),
      providesTags: ["MessageRequests"],
    }),
    acceptMessageRequest: builder.mutation<AcceptMessageRequestResponse, { request_id: number | string }>({
      query: (data) => ({
        url: "/api/chat/message-requests/accept/",
        method: "POST",
        body: data,
      }),
      async onQueryStarted({ request_id }, { dispatch, queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          // Invalidate message requests to remove the accepted one
          dispatch(chatApi.util.invalidateTags(["MessageRequests"]));
          // Invalidate conversations to show the new conversation
          dispatch(chatApi.util.invalidateTags(["Conversations"]));
          // If there's a message in the response, invalidate that conversation
          if (result.data.data?.message?.receiver_id) {
            dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: result.data.data.message.receiver_id }]));
          }
        } catch {
          // Error handling
        }
      },
    }),
    rejectMessageRequest: builder.mutation<RejectMessageRequestResponse, { request_id: number | string }>({
      query: (data) => ({
        url: "/api/chat/message-requests/reject/",
        method: "POST",
        body: data,
      }),
      async onQueryStarted({ request_id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate message requests to remove the rejected one
          dispatch(chatApi.util.invalidateTags(["MessageRequests"]));
        } catch {
          // Error handling
        }
      },
    }),
    cancelMessageRequest: builder.mutation<{ success?: boolean; message?: string }, { request_id: number | string }>({
      query: (data) => ({
        url: `/api/chat/message-requests/cancel/?request_id=${data.request_id}`,
        method: "DELETE",
      }),
      async onQueryStarted({ request_id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate message requests and conversations to refresh the list
          dispatch(chatApi.util.invalidateTags(["MessageRequests"]));
          dispatch(chatApi.util.invalidateTags(["Conversations"]));
        } catch {
          // Error handling
        }
      },
    }),
    toggleReaction: builder.mutation<{ success: boolean; data: { action: 'added' | 'updated' | 'removed'; reaction_type: string | null } }, { message_id: number | string; reaction_type: string }>({
      query: (data) => ({
        url: "/api/chat/reactions/toggle/",
        method: "POST",
        body: data,
      }),
      async onQueryStarted({ message_id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate messages to refetch reactions
          dispatch(chatApi.util.invalidateTags(["Messages"]));
        } catch {
          // Error handling
        }
      },
    }),
  }),
});

export const {
  useGetChatRoomsQuery,
  useCreateChatRoomMutation,
  useGetRoomMessagesQuery,
  useSendMessageMutation,
  useGetChatUsersQuery,
  useSearchChatUsersQuery,
  useSendDirectMessageMutation,
  useGetConversationQuery,
  useGetConversationsListQuery,
  useGetMessageRequestsQuery,
  useAcceptMessageRequestMutation,
  useRejectMessageRequestMutation,
  useCancelMessageRequestMutation,
  useUpdateChatRoomMutation,
  useDeleteChatRoomMutation,
  useMakeRoomAdminMutation,
  useRemoveRoomMemberMutation,
  useAddRoomMembersMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetBlockedUsersQuery,
  useReportUserMutation,
  useUpdateDirectMessageMutation,
  useDeleteDirectMessageMutation,
  useUpdateRoomMessageMutation,
  useDeleteRoomMessageMutation,
  useGetAdminAllConversationsQuery,
  useGetAdminConversationMessagesQuery,
  useDeleteAdminConversationMutation,
  useToggleReactionMutation,
} = chatApi;
