import { baseApi } from "./baseApi";

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
  success: boolean;
  message: string;
  data: Category[];
}

export interface CreateCategoryRequest {
  name: string;
}

export interface CreateCategoryResponse {
  success: boolean;
  message: string;
  data?: Category;
  [key: string]: unknown;
}

export interface UpdateCategoryRequest {
  id: number;
  name: string;
}

export interface CreateSubcategoryRequest {
  category_name: string;
  name: string;
}

export interface CreateSubcategoryResponse {
  success: boolean;
  message: string;
  data?: Subcategory;
  [key: string]: unknown;
}

export interface UpdateSubcategoryRequest {
  id: number;
  name: string;
  category_name?: string;
}

export const categoryApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCategories: builder.query<CategoriesResponse, void>({
      query: () => ({
        url: "/api/categories/",
        method: "GET",
      }),
      providesTags: ["Categories"],
    }),
    createCategory: builder.mutation<CreateCategoryResponse, CreateCategoryRequest>({
      query: (data) => ({
        url: "/api/categories/",
        method: "POST",
        body: { name: data.name },
      }),
      invalidatesTags: ["Categories"],
    }),
    updateCategory: builder.mutation<CreateCategoryResponse, UpdateCategoryRequest>({
      query: (data) => ({
        url: `/api/categories/${data.id}/`,
        method: "PUT",
        body: { name: data.name },
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/api/categories/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories"],
    }),
    createSubcategory: builder.mutation<CreateSubcategoryResponse, CreateSubcategoryRequest>({
      query: (data) => ({
        url: "/api/subcategories/",
        method: "POST",
        body: {
          category_name: data.category_name,
          name: data.name,
        },
      }),
      invalidatesTags: ["Categories"],
    }),
    updateSubcategory: builder.mutation<CreateSubcategoryResponse, UpdateSubcategoryRequest>({
      query: (data) => ({
        url: `/api/subcategories/${data.id}/`,
        method: "PUT",
        body: {
          name: data.name,
          ...(data.category_name && { category_name: data.category_name }),
        },
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteSubcategory: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/api/subcategories/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateSubcategoryMutation,
  useUpdateSubcategoryMutation,
  useDeleteSubcategoryMutation,
} = categoryApi;

