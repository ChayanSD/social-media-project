"use client";

import React, { useState, useMemo } from "react";
import {
  useGetMarketplaceCategoriesQuery,
  useCreateMarketplaceCategoryMutation,
  useUpdateMarketplaceCategoryMutation,
  useDeleteMarketplaceCategoryMutation,
  useCreateMarketplaceSubcategoryMutation,
  useUpdateMarketplaceSubcategoryMutation,
  useDeleteMarketplaceSubcategoryMutation,
  MarketplaceCategory,
  MarketplaceSubcategory,
} from "@/store/marketplaceApi";
import { toast } from "sonner";
import CategoryModal from "@/components/admin/CategoryModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { CustomTable, Column } from "@/components/admin/CustomTable";

export default function MarketplaceCategories() {
  const { data: categoriesResponse, isLoading, isError } = useGetMarketplaceCategoriesQuery();
  const [createCategory] = useCreateMarketplaceCategoryMutation();
  const [updateCategory] = useUpdateMarketplaceCategoryMutation();
  const [deleteCategory] = useDeleteMarketplaceCategoryMutation();
  const [createSubcategory] = useCreateMarketplaceSubcategoryMutation();
  const [updateSubcategory] = useUpdateMarketplaceSubcategoryMutation();
  const [deleteSubcategory] = useDeleteMarketplaceSubcategoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"category" | "subcategory">("category");
  const [editingCategory, setEditingCategory] = useState<MarketplaceCategory | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{
    subcategory: MarketplaceSubcategory;
    categoryName: string;
  } | null>(null);
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "category" | "subcategory";
    id: number;
    name: string;
    categoryName?: string;
  } | null>(null);

  const categories = useMemo(() => {
    const data = categoriesResponse?.data || categoriesResponse?.results?.data || [];
    return Array.isArray(data) ? data : [];
  }, [categoriesResponse]);

  // Transform categories and subcategories into flat table data
  const tableData = useMemo(() => {
    const data: Array<{
      id: string;
      type: "category" | "subcategory";
      categoryId: number;
      categoryName: string;
      name: string;
      subcategoryCount?: number;
      subcategory?: MarketplaceSubcategory;
      index: number;
      subIndex?: number;
    }> = [];

    categories.forEach((category, categoryIndex) => {
      // Add category row
      data.push({
        id: `category-${category.id}`,
        type: "category",
        categoryId: category.id,
        categoryName: category.name,
        name: category.name,
        subcategoryCount: category.subcategories.length,
        index: categoryIndex + 1,
      });

      // Add subcategory rows
      category.subcategories.forEach((subcategory, subIndex) => {
        data.push({
          id: `subcategory-${subcategory.id}`,
          type: "subcategory",
          categoryId: category.id,
          categoryName: category.name,
          name: subcategory.name,
          subcategory,
          index: categoryIndex + 1,
          subIndex: subIndex + 1,
        });
      });
    });

    return data;
  }, [categories]);

  // Define table columns
  const columns: Column<typeof tableData[0]>[] = [
    {
      header: "SL",
      accessor: (row) => (
        <span className={row.type === "subcategory" ? "text-white/40 text-xs pl-8" : ""}>
          {row.type === "subcategory" ? `${row.index}.${row.subIndex}` : `${row.index}.`}
        </span>
      ),
    },
    {
      header: "Category Name",
      accessor: (row) => (
        <span className={row.type === "subcategory" ? "text-white/60 text-sm pl-4" : "font-medium"}>
          {row.type === "subcategory" ? `└ ${row.name}` : row.name}
        </span>
      ),
    },
    {
      header: "Subcategories",
      accessor: (row) => {
        if (row.type === "category") {
          return row.subcategoryCount && row.subcategoryCount > 0 ? (
            <span className="text-white/80">
              {row.subcategoryCount} {row.subcategoryCount === 1 ? "subcategory" : "subcategories"}
            </span>
          ) : (
            <span className="text-white/40">No subcategories</span>
          );
        }
        return <span className="text-white/40 text-xs">Subcategory</span>;
      },
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (row.type === "category") {
                const category = categories.find((c) => c.id === row.categoryId);
                if (category) handleEditCategory(category);
              } else if (row.subcategory) {
                handleEditSubcategory(row.subcategory, row.categoryName);
              }
            }}
            className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition"
            title={row.type === "category" ? "Edit category" : "Edit subcategory"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M21.7 7.3l-5-5c-.4-.4-1-.4-1.4 0l-12 12c-.1.1-.2.3-.2.4l-1 6c-.1.5.4 1 .9.9l6-1c.1 0 .3-.1.4-.2l12-12c.4-.4.4-1 0-1.4zM7.6 19.2l-3.5.6.6-3.5L14 6l2.9 2.9-9.3 9.3z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (row.type === "category") {
                handleDeleteClick("category", row.categoryId, row.name);
              } else if (row.subcategory) {
                handleDeleteClick("subcategory", row.subcategory.id, row.name, row.categoryName);
              }
            }}
            className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition"
            title={row.type === "category" ? "Delete category" : "Delete subcategory"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      ),
      className: "text-center",
    },
  ];

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setModalType("category");
    setIsModalOpen(true);
  };

  const handleCreateSubcategory = () => {
    setEditingSubcategory(null);
    setSelectedCategoryForSubcategory("");
    setModalType("subcategory");
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: MarketplaceCategory) => {
    setEditingCategory(category);
    setModalType("category");
    setIsModalOpen(true);
  };

  const handleEditSubcategory = (subcategory: MarketplaceSubcategory, categoryName: string) => {
    setEditingSubcategory({ subcategory, categoryName });
    setSelectedCategoryForSubcategory(categoryName);
    setModalType("subcategory");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (
    type: "category" | "subcategory",
    id: number,
    name: string,
    categoryName?: string
  ) => {
    setItemToDelete({ type, id, name, categoryName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "category") {
        await deleteCategory(itemToDelete.id).unwrap();
        toast.success("Category deleted successfully!");
      } else {
        await deleteSubcategory(itemToDelete.id).unwrap();
        toast.success("Subcategory deleted successfully!");
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to delete";
      toast.error("Failed to delete", { description: errorMessage });
    }
  };

  const handleModalSubmit = async (data: {
    name: string;
    categoryName?: string;
  }) => {
    try {
      if (modalType === "category") {
        if (editingCategory) {
          await updateCategory({
            id: editingCategory.id,
            name: data.name,
          }).unwrap();
          toast.success("Category updated successfully!");
        } else {
          await createCategory({ name: data.name }).unwrap();
          toast.success("Category created successfully!");
        }
      } else {
        if (editingSubcategory) {
          // Find category ID from category name
          const category = categories.find((c) => c.name === (data.categoryName || editingSubcategory.categoryName));
          if (!category) {
            toast.error("Category not found");
            return;
          }
          await updateSubcategory({
            id: editingSubcategory.subcategory.id,
            name: data.name,
            category: category.id,
          }).unwrap();
          toast.success("Subcategory updated successfully!");
        } else {
          if (!data.categoryName) {
            toast.error("Please select a category");
            return;
          }
          // Find category ID from category name
          const category = categories.find((c) => c.name === data.categoryName);
          if (!category) {
            toast.error("Category not found");
            return;
          }
          await createSubcategory({
            category: category.id,
            name: data.name,
          }).unwrap();
          toast.success("Subcategory created successfully!");
        }
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setEditingSubcategory(null);
      setSelectedCategoryForSubcategory("");
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to save";
      toast.error("Failed to save", { description: errorMessage });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setEditingSubcategory(null);
    setSelectedCategoryForSubcategory("");
  };

  return (
    <div className="space-y-10">
      {/* TABLE */}
      <CustomTable
          title="All Categories"
          description="Manage marketplace categories for product listings"
          columns={columns}
          data={tableData}
          isLoading={isLoading}
          isError={isError}
          errorMessage="Failed to load categories. Please try again later"
          emptyMessage="No categories found"
          filters={
            <div className="flex gap-3">
              <button
                onClick={handleCreateCategory}
                className="bg-[#6B83FA] px-4 py-2 cursor-pointer rounded-lg hover:bg-[#5a70e8] transition text-sm font-medium whitespace-nowrap"
              >
                + Create Category
              </button>
              <button
                onClick={handleCreateSubcategory}
                className="bg-white/10 border border-white/20 px-4 py-2 cursor-pointer rounded-lg hover:bg-white/20 transition text-sm font-medium whitespace-nowrap"
              >
                + Create Subcategory
              </button>
            </div>
          }
          rowClassName={(row) =>
            row.type === "subcategory" ? "bg-white/5 border-white/5" : ""
          }
        />

      {/* MODAL */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        type={modalType}
        editingCategory={editingCategory}
        editingSubcategory={editingSubcategory}
        categories={categories}
        selectedCategoryForSubcategory={selectedCategoryForSubcategory}
        onCategoryChange={setSelectedCategoryForSubcategory}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={`Delete ${itemToDelete?.type === "category" ? "Category" : "Subcategory"}?`}
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.${
          itemToDelete?.type === "category"
            ? " All subcategories under this category will also be deleted."
            : ""
        }`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
}

