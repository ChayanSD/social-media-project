import { baseApi } from "./baseApi";

export interface MarketplaceSubcategory {
  id: number;
  name: string;
}

export interface MarketplaceCategory {
  id: number;
  name: string;
  subcategories: MarketplaceSubcategory[];
}

export interface GetMarketplaceCategoriesResponse {
  success?: boolean;
  message?: string;
  data?: MarketplaceCategory[];
  results?: {
    data?: MarketplaceCategory[];
  };
  [key: string]: unknown;
}

export interface MarketplaceItem {
  id: number | string;
  title?: string;
  description?: string;
  image?: string;
  images?: string[];
  category?: string;
  category_name?: string;
  subcategory?: string;
  subcategory_name?: string;
  sub_category_name?: string;
  seller?: {
    id?: number | string;
    username?: string;
    display_name?: string;
    avatar?: string;
  };
  created_at?: string;
  updated_at?: string;
  location?: string;
  link?: string;
  status?: "draft" | "published" | "sold" | "unpublished";
  [key: string]: unknown;
}

export interface GetMarketplaceItemsResponse {
  data?: MarketplaceItem[];
  results?: {
    data?: MarketplaceItem[];
  };
  items?: MarketplaceItem[];
  count?: number;
  next?: string | null;
  previous?: string | null;
  [key: string]: unknown;
}

export interface GetProductsResponse {
  data?: MarketplaceItem[];
  results?: {
    data?: MarketplaceItem[];
  };
  items?: MarketplaceItem[];
  products?: MarketplaceItem[];
  [key: string]: unknown;
}

export interface CreateProductRequest {
  name: string;
  image: File;
  status: "draft" | "published";
  sub_category: number;
  description?: string;
  location?: string;
  link: string;
}

export interface UpdateProductRequest {
  id: number | string;
  name?: string;
  image?: File;
  status?: "draft" | "published";
  sub_category?: number;
  description?: string;
  location?: string;
  link?: string;
}

export interface CreateProductResponse {
  id?: number | string;
  message?: string;
  success?: boolean;
  [key: string]: unknown;
}

export interface CreateMarketplaceCategoryRequest {
  name: string;
}

export interface CreateMarketplaceCategoryResponse {
  success: boolean;
  message: string;
  data?: MarketplaceCategory;
  [key: string]: unknown;
}

export interface UpdateMarketplaceCategoryRequest {
  id: number;
  name: string;
}

export interface CreateMarketplaceSubcategoryRequest {
  category: number;
  name: string;
}

export interface CreateMarketplaceSubcategoryResponse {
  success: boolean;
  message: string;
  data?: MarketplaceSubcategory;
  [key: string]: unknown;
}

export interface UpdateMarketplaceSubcategoryRequest {
  id: number;
  name: string;
  category?: number;
}

export const marketplaceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMarketplaceItems: builder.query<GetMarketplaceItemsResponse, { category?: string; subcategory?: string; page?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.category) {
          queryParams.append("sub_category__category__name", params.category);
        }
        if (params?.subcategory) {
          queryParams.append("sub_category__name", params.subcategory);
        }
        if (params?.page) {
          queryParams.append("page", params.page.toString());
        }
        const queryString = queryParams.toString();
        return {
          url: `/api/marketplace/items/${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["MarketplaceItems"],
      // Use serializeQueryArgs and merge for infinite scrolling if needed, 
      // but following Profile.tsx pattern (manual merging in component) for consistency.
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        // Exclude page from cache key so we can merge manually in components
        const { page, ...rest } = queryArgs || {};
        return { endpointName, ...rest };
      },
      merge: (currentCache, newItems) => {
        return newItems;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.page !== previousArg?.page;
      }
    }),
    createProduct: builder.mutation<CreateProductResponse, CreateProductRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("image", data.image);
        formData.append("status", data.status);
        formData.append("sub_category", data.sub_category.toString());
        formData.append("link", data.link);
        if (data.description) {
          formData.append("description", data.description);
        }
        if (data.location) {
          formData.append("location", data.location);
        }
        return {
          url: "/api/marketplace/items/",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["MarketplaceItems", "SubscriptionUsage"],
    }),
    getMarketplaceCategories: builder.query<GetMarketplaceCategoriesResponse, void>({
      query: () => ({
        url: "/api/marketplace/categories",
        method: "GET",
      }),
      providesTags: ["Categories"],
    }),
    createMarketplaceCategory: builder.mutation<CreateMarketplaceCategoryResponse, CreateMarketplaceCategoryRequest>({
      query: (data) => ({
        url: "/api/marketplace/categories/",
        method: "POST",
        body: { name: data.name },
      }),
      invalidatesTags: ["Categories"],
    }),
    updateMarketplaceCategory: builder.mutation<CreateMarketplaceCategoryResponse, UpdateMarketplaceCategoryRequest>({
      query: (data) => ({
        url: `/api/marketplace/categories/${data.id}/`,
        method: "PUT",
        body: { name: data.name },
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteMarketplaceCategory: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/api/marketplace/categories/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories"],
    }),
    createMarketplaceSubcategory: builder.mutation<CreateMarketplaceSubcategoryResponse, CreateMarketplaceSubcategoryRequest>({
      query: (data) => ({
        url: "/api/marketplace/subcategories/",
        method: "POST",
        body: {
          category: data.category,
          name: data.name,
        },
      }),
      invalidatesTags: ["Categories"],
    }),
    updateMarketplaceSubcategory: builder.mutation<CreateMarketplaceSubcategoryResponse, UpdateMarketplaceSubcategoryRequest>({
      query: (data) => ({
        url: `/api/marketplace/subcategories/${data.id}/`,
        method: "PUT",
        body: {
          name: data.name,
          ...(data.category && { category: data.category }),
        },
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteMarketplaceSubcategory: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/api/marketplace/subcategories/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["MarketplaceItems"],
    }),
    getProducts: builder.query<GetProductsResponse, { start_date?: string; end_date?: string; status?: string; search?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && typeof params === 'object') {
          if (params.start_date) searchParams.append('start_date', params.start_date);
          if (params.end_date) searchParams.append('end_date', params.end_date);
          if (params.status) searchParams.append('status', params.status);
          if (params.search) searchParams.append('search', params.search);
        }
        const queryString = searchParams.toString();
        return {
          url: `/api/marketplace/items/${queryString ? `?${queryString}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["MarketplaceItems"],
    }),
    deleteProduct: builder.mutation<{ success: boolean; message: string }, number | string>({
      query: (id) => ({
        url: `/api/marketplace/items/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["MarketplaceItems"],
    }),
    updateProduct: builder.mutation<CreateProductResponse, UpdateProductRequest>({
      query: (data) => {
        const formData = new FormData();
        // Always send required fields
        if (data.name !== undefined) formData.append("name", data.name);
        if (data.status !== undefined) formData.append("status", data.status);
        if (data.sub_category !== undefined) formData.append("sub_category", data.sub_category.toString());
        // Image is required - always send it (either new or existing)
        if (data.image instanceof File) {
          formData.append("image", data.image);
        }
        // Optional fields - only send if they have values
        if (data.description !== undefined && data.description) formData.append("description", data.description);
        if (data.location !== undefined && data.location) formData.append("location", data.location);
        if (data.link !== undefined && data.link) formData.append("link", data.link);
        return {
          url: `/api/marketplace/items/${data.id}/`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["MarketplaceItems"],
    }),
    patchProductStatus: builder.mutation<CreateProductResponse, { id: number | string; status: "draft" | "published" }>({
      query: (data) => {
        const formData = new FormData();
        formData.append("status", data.status);
        return {
          url: `/api/marketplace/items/${data.id}/`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["MarketplaceItems", "SubscriptionUsage"],
    }),
    // Payment/Subscription endpoints
    getSubscriptionPlans: builder.query<{ success: boolean; data: SubscriptionPlan[] }, void>({
      query: () => ({
        url: "/api/marketplace/subscription-plans/",
        method: "GET",
      }),
      providesTags: ["SubscriptionPlans"],
    }),
    getSubscriptionUsage: builder.query<{ success: boolean; data: SubscriptionUsage }, void>({
      query: () => ({
        url: "/api/marketplace/subscription/usage/",
        method: "GET",
      }),
      providesTags: ["SubscriptionUsage"],
    }),
    getSubscription: builder.query<{ success: boolean; data: UserSubscription }, void>({
      query: () => ({
        url: "/api/marketplace/subscription/",
        method: "GET",
      }),
      providesTags: ["UserSubscription"],
    }),
    createSubscriptionCheckout: builder.mutation<
      { success: boolean; data: { session_id: string; url: string } },
      { plan_id: number; success_url?: string; cancel_url?: string }
    >({
      query: (data) => ({
        url: "/api/marketplace/subscription/create_checkout_session/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["UserSubscription", "SubscriptionUsage"],
    }),
    createPostPaymentCheckout: builder.mutation<
      { success: boolean; data: { session_id: string; url: string } },
      { success_url?: string; cancel_url?: string }
    >({
      query: (data) => ({
        url: "/api/marketplace/subscription/create_post_payment/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SubscriptionUsage", "PostCredits"],
    }),
    cancelSubscription: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/api/marketplace/subscription/cancel_subscription/",
        method: "POST",
      }),
      invalidatesTags: ["UserSubscription", "SubscriptionUsage"],
    }),
    getPayments: builder.query<{ success: boolean; data: Payment[] }, void>({
      query: () => ({
        url: "/api/marketplace/payments/",
        method: "GET",
      }),
      providesTags: ["Payments"],
    }),
    getCredits: builder.query<{ success: boolean; data: PostCredit[] }, void>({
      query: () => ({
        url: "/api/marketplace/credits/",
        method: "GET",
      }),
      providesTags: ["PostCredits"],
    }),
  }),
});

// Payment/Subscription Types
export interface SubscriptionPlan {
  id: number;
  name: string;
  display_name: string;
  price: number;
  posts_per_month: number;
  features: string[];
  is_active: boolean;
  stripe_price_id: string | null;
}

export interface UserSubscription {
  id: number;
  plan: SubscriptionPlan | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start?: string;
  current_period_end?: string;
  posts_used_this_month: number;
  remaining_posts: number;
  cancel_at_period_end: boolean;
}

export interface SubscriptionUsage {
  has_subscription: boolean;
  plan_name: string;
  posts_used: number;
  posts_limit: number | null; // null means unlimited
  remaining_posts: number | null;
  can_post: boolean;
  has_credits: boolean;
  credit_count: number;
}

export interface Payment {
  id: number;
  payment_type: 'subscription' | 'one_time';
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

export const {
  useGetMarketplaceItemsQuery,
  useCreateProductMutation,
  useGetMarketplaceCategoriesQuery,
  useCreateMarketplaceCategoryMutation,
  useUpdateMarketplaceCategoryMutation,
  useDeleteMarketplaceCategoryMutation,
  useCreateMarketplaceSubcategoryMutation,
  useUpdateMarketplaceSubcategoryMutation,
  useDeleteMarketplaceSubcategoryMutation,
  useGetProductsQuery,
  useDeleteProductMutation,
  useUpdateProductMutation,
  usePatchProductStatusMutation,
  // Payment/Subscription hooks
  useGetSubscriptionPlansQuery,
  useGetSubscriptionUsageQuery,
  useGetSubscriptionQuery,
  useCreateSubscriptionCheckoutMutation,
  useCreatePostPaymentCheckoutMutation,
  useCancelSubscriptionMutation,
  useGetPaymentsQuery,
  useGetCreditsQuery,
} = marketplaceApi;

