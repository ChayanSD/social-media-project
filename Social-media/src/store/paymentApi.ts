// paymentApi.ts
import { baseApi } from "./baseApi";

export interface SubscriptionPlan {
  id: number;
  name: string;
  display_name: string;
  price: number;
  billing_cycle: "month" | "year";
  billing_interval_count: number;
  posts_per_month: number;
  features: string[];
  is_active: boolean;
  is_recommended?: boolean;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserSubscription {
  id: number;
  plan: SubscriptionPlan | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  current_period_start: string | null;
  current_period_end: string | null;
  posts_used_this_month: number;
  remaining_posts: number;
  cancel_at_period_end: boolean;
}

export interface SubscriptionUsage {
  has_subscription: boolean;
  plan_name: string; // Plan slug/name for matching
  plan_display_name?: string; // Plan display name for UI
  posts_used: number;
  posts_limit: number | null; // null means unlimited
  remaining_posts: number | null;
  can_post: boolean;
  has_credits: boolean;
  credit_count: number;
}

export interface Payment {
  id: number;
  payment_type: 'subscription';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  description: string;
  created_at: string;
}

export interface PostCredit {
  id: number;
  amount: number;
  used: number;
  remaining: number;
  expires_at: string | null;
  created_at: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  message: string;
  data: {
    session_id: string;
    url: string;
  };
}

export interface SubscriptionUsageResponse {
  success: boolean;
  message: string;
  data: SubscriptionUsage;
}

export interface SubscriptionPlansResponse {
  success: boolean;
  message: string;
  data: SubscriptionPlan[];
}

export interface UserSubscriptionResponse {
  success: boolean;
  message: string;
  data: UserSubscription;
}

export interface PaymentsResponse {
  success: boolean;
  message: string;
  data: Payment[];
}

export interface PostCreditsResponse {
  success: boolean;
  message: string;
  data: PostCredit[];
}

export const paymentApi = baseApi.injectEndpoints({ overrideExisting: true,
  endpoints: (builder) => ({
    // Get subscription plans
    getSubscriptionPlans: builder.query<SubscriptionPlansResponse, void>({
      query: () => ({
        url: "/api/marketplace/subscription-plans/",
        method: "GET",
      }),
      providesTags: ["SubscriptionPlans"],
    }),

    // Admin: Create subscription plan
    createSubscriptionPlan: builder.mutation<
      { success: boolean; message: string; data: SubscriptionPlan },
      Partial<SubscriptionPlan>
    >({
      query: (data) => ({
        url: "/api/marketplace/subscription-plans/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SubscriptionPlans"],
    }),

    // Admin: Update subscription plan
    updateSubscriptionPlan: builder.mutation<
      { success: boolean; message: string; data: SubscriptionPlan },
      { id: number; data: Partial<SubscriptionPlan> }
    >({
      query: ({ id, data }) => ({
        url: `/api/marketplace/subscription-plans/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SubscriptionPlans"],
    }),

    // Admin: Toggle subscription plan active status
    toggleSubscriptionPlanActive: builder.mutation<
      { success: boolean; message: string; data: SubscriptionPlan },
      number
    >({
      query: (id) => ({
        url: `/api/marketplace/subscription-plans/${id}/toggle_active/`,
        method: "POST",
      }),
      invalidatesTags: ["SubscriptionPlans"],
    }),

    // Admin: Delete subscription plan
    deleteSubscriptionPlan: builder.mutation<
      { success: boolean; message: string },
      number
    >({
      query: (id) => ({
        url: `/api/marketplace/subscription-plans/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["SubscriptionPlans"],
    }),

    // Get user subscription
    getUserSubscription: builder.query<UserSubscriptionResponse, void>({
      query: () => ({
        url: "/api/marketplace/subscription/",
        method: "GET",
      }),
      providesTags: ["UserSubscription"],
    }),

    // Get subscription usage
    getSubscriptionUsage: builder.query<SubscriptionUsageResponse, void>({
      query: () => ({
        url: "/api/marketplace/subscription/usage/",
        method: "GET",
      }),
      providesTags: ["SubscriptionUsage"],
    }),

    // Cancel subscription
    cancelSubscription: builder.mutation<{ success: boolean; message: string }, { immediate?: boolean } | void>({
      query: (data) => ({
        url: "/api/marketplace/subscription/cancel_subscription/",
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: ["UserSubscription", "SubscriptionUsage"],
    }),

    // Resume subscription
    resumeSubscription: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/api/marketplace/subscription/resume_subscription/",
        method: "POST",
      }),
      invalidatesTags: ["UserSubscription", "SubscriptionUsage"],
    }),

    // Get payment history
    getPayments: builder.query<PaymentsResponse, void>({
      query: () => ({
        url: "/api/marketplace/payments/",
        method: "GET",
      }),
      providesTags: ["Payments"],
    }),

    // Create subscription with payment method (embedded payment)
    createSubscriptionWithPaymentMethod: builder.mutation<
      { success: boolean; message: string; data: { subscription_id: string; client_secret: string | null; payment_status: string; requires_action: boolean } },
      { plan_id: number; payment_method_id: string }
    >({
      query: (data) => ({
        url: "/api/marketplace/subscription/create_subscription_with_payment_method/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["UserSubscription", "SubscriptionUsage"],
    }),

  }),
});

export const {
  useGetSubscriptionPlansQuery,
  useGetUserSubscriptionQuery,
  useGetSubscriptionUsageQuery,
  useCreateSubscriptionWithPaymentMethodMutation,
  useCancelSubscriptionMutation,
  useResumeSubscriptionMutation,
  useGetPaymentsQuery,
  // Admin mutations
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useToggleSubscriptionPlanActiveMutation,
} = paymentApi;
