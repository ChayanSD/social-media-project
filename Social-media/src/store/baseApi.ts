import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthTokens,
} from "@/lib/auth";

// Define your base API URL
const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || "https://socialmedia.lumivancelabs.com/";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    const token = getStoredAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const extractTokens = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return { access: undefined, refresh: undefined };
  }
  const data = payload as Record<string, unknown>;
  const nestedTokens = data.tokens as Record<string, unknown> | undefined;

  const access =
    (data.access as string | undefined) ||
    (data.token as string | undefined) ||
    (nestedTokens?.access as string | undefined);

  const refresh =
    (data.refresh as string | undefined) ||
    (nestedTokens?.refresh as string | undefined);

  return { access, refresh };
};

const baseQueryWithReauth: typeof rawBaseQuery = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      clearStoredTokens();
      return result;
    }

    const formData = new FormData();
    formData.append("refresh", refreshToken);

    const refreshResult = await rawBaseQuery(
      {
        url: "/auth/token/refresh/",
        method: "POST",
        body: formData,
      },
      api,
      extraOptions
    );

    if (!refreshResult.error) {
      const refreshed = extractTokens(refreshResult.data);

      if (!refreshed.access) {
        clearStoredTokens();
        return result;
      }

      storeAuthTokens({
        accessToken: refreshed.access,
        refreshToken: refreshed.refresh,
      });

      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      clearStoredTokens();
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: ["UserProfile", "Comments", "Communities", "Categories", "Followers", "ChatRooms", "Messages", "MarketplaceItems", "Conversations", "ChatUsers", "BlockedUsers", "UserReports", "PostReports", "UnifiedReports", "JoinRequests", "CommunityMembers", "Invitations", "Contacts", "Notifications", "SubscriptionPlans", "UserSubscription", "SubscriptionUsage", "Payments", "PostCredits", "MessageRequests", "NewsFeed"],
});