import { baseApi } from "./baseApi";

export interface NotificationItem {
  id: number | string;
  sender?: number | string;
  sender_name?: string;
  notification_type?: string;
  post?: number | string;
  post_title?: string;
  comment?: number | string;
  community?: number | string;
  community_name?: string;
  community_title?: string;
  created_at?: string;
  is_read?: boolean;
  [key: string]: unknown;
}

export interface MarkNotificationReadRequest {
  is_read: boolean;
}

export interface GetNotificationsResponse {
  data?: NotificationItem[];
  results?: {
    data?: NotificationItem[];
  };
  notifications?: NotificationItem[];
  count?: number;
  next?: string | null;
  previous?: string | null;
  [key: string]: unknown;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<GetNotificationsResponse, { page?: number }>({
      query: ({ page = 1 }) => ({
        url: `/api/notifications/?page=${page}`,
        method: "GET",
      }),
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        const currentData = currentCache?.data ?? currentCache?.results?.data ?? currentCache?.notifications ?? [];
        const newData = newItems?.data ?? newItems?.results?.data ?? newItems?.notifications ?? [];

        // Merge arrays and remove duplicates
        const merged = [...currentData];
        const existingIds = new Set(merged.map(n => n.id));
        newData.forEach(item => {
          if (!existingIds.has(item.id)) {
            merged.push(item);
          }
        });

        return {
          ...newItems,
          data: merged,
          results: newItems.results ? { ...newItems.results, data: merged } : undefined,
          notifications: merged,
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
      providesTags: ['Notifications'],
    }),
    markNotificationAsRead: builder.mutation<
      NotificationItem,
      { notificationId: number | string }
    >({
      query: ({ notificationId }) => ({
        url: `/api/notifications/${notificationId}/`,
        method: "PATCH",
        body: { is_read: true },
      }),
      async onQueryStarted({ notificationId }, { dispatch, queryFulfilled }) {
        // Optimistically update the notification in cache
        const patchResult = dispatch(
          notificationApi.util.updateQueryData(
            "getNotifications",
            { page: 1 },
            (draft) => {
              const updateNotification = (
                notifications: NotificationItem[] | undefined
              ) => {
                if (!notifications) return;
                const notification = notifications.find(
                  (n) => n.id === notificationId
                );
                if (notification) {
                  notification.is_read = true;
                }
              };

              if (draft.data) updateNotification(draft.data);
              if (draft.notifications) updateNotification(draft.notifications);
              if (draft.results?.data)
                updateNotification(draft.results.data);
            }
          )
        );

        try {
          await queryFulfilled;
          // Invalidate unread count to update the badge
          dispatch(notificationApi.util.invalidateTags(["Notifications"]));
        } catch {
          patchResult.undo();
        }
      },
    }),
    markAllNotificationsAsRead: builder.mutation<
      { success: boolean; message: string; data: { status: string; marked_read: number } },
      void
    >({
      query: () => ({
        url: "/api/notifications/mark_all_read/",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        // Optimistically update all notifications in cache
        const patchResult = dispatch(
          notificationApi.util.updateQueryData(
            "getNotifications",
            { page: 1 },
            (draft) => {
              const markAllRead = (
                notifications: NotificationItem[] | undefined
              ) => {
                if (!notifications) return;
                notifications.forEach((notification) => {
                  notification.is_read = true;
                });
              };

              if (draft.data) markAllRead(draft.data);
              if (draft.notifications) markAllRead(draft.notifications);
              if (draft.results?.data) markAllRead(draft.results.data);
            }
          )
        );

        try {
          await queryFulfilled;
          // Invalidate unread count to update the badge
          dispatch(notificationApi.util.invalidateTags(["Notifications"]));
        } catch {
          patchResult.undo();
        }
      },
    }),
    getUnreadNotificationCount: builder.query<
      { success: boolean; message: string; data: { unread_count: number } },
      void
    >({
      query: () => ({
        url: "/api/notifications/unread_count/",
        method: "GET",
      }),
      providesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} = notificationApi;


