import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiBaseUrl } from "@/lib/utils";
import { getCsrfToken } from "@/lib/auth";

// Define your base API URL
const baseUrl = getApiBaseUrl().replace(/\/$/, "");

/**
 * All requests include credentials so the browser sends the
 * HttpOnly access_token / refresh_token cookies automatically.
 * No manual Authorization header is needed anymore.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
    headers.set("X-Requested-With", "XMLHttpRequest");
    return headers;
  },
});

const baseQueryWithReauth: typeof rawBaseQuery = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to get a new access cookie using the refresh cookie
    const refreshResult = await rawBaseQuery(
      {
        url: "/auth/token/refresh/",
        method: "POST",
      },
      api,
      extraOptions
    );

    if (!refreshResult.error) {
      // Backend set a new access_token cookie — retry original request
      result = await rawBaseQuery(args, api, extraOptions);
    }
    // If refresh also failed, user is fully logged out — nothing to clean up
    // (no localStorage entries). RTK Query cache reset happens on logout action.
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: [
    "UserProfile",
    "Comments",
    "Communities",
    "Categories",
    "Followers",
    "ChatRooms",
    "Messages",
    "MarketplaceItems",
    "Conversations",
    "ChatUsers",
    "BlockedUsers",
    "UserReports",
    "PostReports",
    "UnifiedReports",
    "JoinRequests",
    "CommunityMembers",
    "Invitations",
    "Contacts",
    "Notifications",
    "SubscriptionPlans",
    "UserSubscription",
    "SubscriptionUsage",
    "Payments",
    "PostCredits",
    "MessageRequests",
    "NewsFeed",
  ],
});
