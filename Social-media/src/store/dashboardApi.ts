import { baseApi } from "./baseApi";
import { PostItem } from "./postApi";

export interface DashboardAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    // Basic counts
    total_users: number;
    total_posts: number;
    total_communities: number;
    total_products: number;
    total_comments: number;
    total_likes: number;
    total_shares: number;
    total_engagement: number;

    // Post status breakdown
    post_status: {
      approved: number;
      rejected: number;
      pending: number;
      draft: number;
    };

    // Post type breakdown
    post_types: {
      text: number;
      media: number;
      link: number;
    };

    // Engagement averages
    engagement_averages: {
      avg_likes_per_post: number;
      avg_comments_per_post: number;
      avg_shares_per_post: number;
    };

    // Recent activity (7 days)
    recent_activity_7d: {
      new_users: number;
      new_posts: number;
      new_comments: number;
      new_likes: number;
      new_shares: number;
      new_communities: number;
      new_products: number;
    };

    // Recent activity (30 days)
    recent_activity_30d: {
      new_users: number;
      new_posts: number;
      new_comments: number;
      new_likes: number;
      new_shares: number;
    };

    // User activity
    user_activity: {
      active_users_7d: number;
      active_users_30d: number;
      verified_users: number;
      unverified_users: number;
    };

    // Community analytics
    community_analytics: {
      public: number;
      restricted: number;
      private: number;
      top_communities: Array<{
        id: number;
        name: string;
        title: string;
        members_count: number;
        posts_count: number;
        visibility: string;
      }>;
    };

    // Marketplace analytics
    marketplace_analytics: {
      published: number;
      draft: number;
      sold: number;
      unpublished: number;
      services_with_links?: number;
      top_categories?: Array<{
        category: string;
        count: number;
      }>;
    };

    // Activity timeline (30 days)
    activity_timeline: Array<{
      date: string;
      posts: number;
      users: number;
      likes: number;
      comments: number;
      shares: number;
    }>;

    // Engagement timeline (30 days)
    engagement_timeline: Array<{
      date: string;
      likes: number;
      comments: number;
      shares: number;
      total: number;
    }>;

    // User growth (90 days)
    user_growth: Array<{
      date: string;
      cumulative: number;
      new: number;
    }>;

    // Post growth (90 days)
    post_growth: Array<{
      date: string;
      cumulative: number;
      new: number;
    }>;

    // Top posts
    top_posts: {
      most_liked: PostItem[];
      most_commented: PostItem[];
      most_shared: PostItem[];
      most_engagement: PostItem[];
    };
  };
}

export interface PostAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    post_analytics: Array<{
      date: string;
      new: number;
    }>;
    date_range: {
      start_date: string;
      end_date: string;
      days: number;
    };
  };
}

export interface UserAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    user_analytics: Array<{
      date: string;
      new: number;
    }>;
    date_range: {
      start_date: string;
      end_date: string;
      days: number;
    };
  };
}

export interface ServiceAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    service_analytics: Array<{
      date: string;
      new: number;
    }>;
    date_range: {
      start_date: string;
      end_date: string;
      days: number;
    };
  };
}

export interface SubscriptionAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    subscription_analytics: Array<{
      date: string;
      new: number;
    }>;
    date_range: {
      start_date: string;
      end_date: string;
      days: number;
    };
  };
}

export interface Payment {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    avatar: string | null;
  };
  subscription: {
    id: number;
    plan: {
      id: number;
      name: string;
      display_name: string;
    };
  } | null;
  payment_type: 'subscription' | 'one_time';
  amount: string;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    avatar: string | null;
  };
  plan: {
    id: number;
    name: string;
    display_name: string;
    price: string;
    posts_per_month: number;
  } | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  posts_used_this_month: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface AdminPaymentsResponse {
  success: boolean;
  message: string;
  data: {
    payments: Payment[];
    pagination: {
      page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
    summary: {
      total_revenue: number;
      total_payments: number;
    };
  };
}

export interface AdminSubscriptionsResponse {
  success: boolean;
  message: string;
  data: {
    subscriptions: UserSubscription[];
    pagination: {
      page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
    summary: {
      total_subscriptions: number;
      active_subscriptions: number;
      monthly_recurring_revenue: number;
    };
  };
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAnalytics: builder.query<DashboardAnalyticsResponse, void>({
      query: () => ({
        url: "/auth/admin/dashboard-analytics/",
        method: "GET",
      }),
    }),
    getPostAnalytics: builder.query<PostAnalyticsResponse, { start_date?: string; end_date?: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        return {
          url: `/auth/admin/post-analytics/?${searchParams.toString()}`,
          method: "GET",
        };
      },
    }),
    getUserAnalytics: builder.query<UserAnalyticsResponse, { start_date?: string; end_date?: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        return {
          url: `/auth/admin/user-analytics/?${searchParams.toString()}`,
          method: "GET",
        };
      },
    }),
    getServiceAnalytics: builder.query<ServiceAnalyticsResponse, { start_date?: string; end_date?: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        return {
          url: `/auth/admin/service-analytics/?${searchParams.toString()}`,
          method: "GET",
        };
      },
    }),
    getSubscriptionAnalytics: builder.query<SubscriptionAnalyticsResponse, { start_date?: string; end_date?: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        return {
          url: `/auth/admin/subscription-analytics/?${searchParams.toString()}`,
          method: "GET",
        };
      },
    }),
    getAdminPayments: builder.query<AdminPaymentsResponse, { page?: number; page_size?: number; status?: string; payment_type?: string; user_id?: number }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.status) searchParams.append('status', params.status);
        if (params.payment_type) searchParams.append('payment_type', params.payment_type);
        if (params.user_id) searchParams.append('user_id', params.user_id.toString());
        return {
          url: `/auth/admin/payments/?${searchParams.toString()}`,
          method: "GET",
        };
      },
    }),
    getAdminSubscriptions: builder.query<AdminSubscriptionsResponse, { page?: number; page_size?: number; status?: string; plan_id?: number; user_id?: number }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.status) searchParams.append('status', params.status);
        if (params.plan_id) searchParams.append('plan_id', params.plan_id.toString());
        if (params.user_id) searchParams.append('user_id', params.user_id.toString());
        return {
          url: `/auth/admin/subscriptions/?${searchParams.toString()}`,
          method: "GET",
        };
      },
    }),
    cancelAdminSubscription: builder.mutation<{ success: boolean; message: string; data: any }, { subscription_id: number }>({
      query: (body) => ({
        url: `/auth/admin/subscriptions/`,
        method: "DELETE",
        body,
      }),
    }),
    uncancelAdminSubscription: builder.mutation<{ success: boolean; message: string; data: any }, { subscription_id: number; plan_id: number }>({
      query: (body) => ({
        url: `/auth/admin/subscriptions/`,
        method: "PATCH",
        body,
      }),
    }),
    deleteAdminSubscription: builder.mutation<{ success: boolean; message: string; data: any }, { subscription_id: number; permanent_delete: boolean }>({
      query: (body) => ({
        url: `/auth/admin/subscriptions/`,
        method: "DELETE",
        body,
      }),
    }),
  }),
});

export const {
  useGetDashboardAnalyticsQuery,
  useGetPostAnalyticsQuery,
  useGetUserAnalyticsQuery,
  useGetServiceAnalyticsQuery,
  useGetSubscriptionAnalyticsQuery,
  useGetAdminPaymentsQuery,
  useGetAdminSubscriptionsQuery,
  useCancelAdminSubscriptionMutation,
  useUncancelAdminSubscriptionMutation,
  useDeleteAdminSubscriptionMutation
} = dashboardApi;
