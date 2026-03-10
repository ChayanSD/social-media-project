"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateSubcategoryMutation,
  useUpdateSubcategoryMutation,
  useDeleteSubcategoryMutation,
  useApproveCategoryMutation,
  useApproveSubcategoryMutation,
  Category,
  Subcategory,
} from "@/store/categoryApi";
import { toast } from "sonner";
import CategoryModal from "@/components/admin/CategoryModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { Tooltip } from "@/components/admin/Tooltip";
import { TableFilters } from "@/components/admin/TableFilters";
import { Trash2, Edit, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";

export default function InterestCategories() {
  const { data: categoriesResponse, isLoading, isError } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [createSubcategory] = useCreateSubcategoryMutation();
  const [updateSubcategory] = useUpdateSubcategoryMutation();
  const [deleteSubcategory] = useDeleteSubcategoryMutation();
  const [approveCategory] = useApproveCategoryMutation();
  const [approveSubcategory] = useApproveSubcategoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"category" | "subcategory">("category");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{
    subcategory: Subcategory;
    categoryName: string;
  } | null>(null);
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "category" | "subcategory";
    id: number;
    name: string;
    categoryName?: string;
    isReject?: boolean;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Auto-expand categories with pending subcategories
  useEffect(() => {
    if (categoriesResponse?.data) {
      const pendingCategoryIds = categoriesResponse.data
        .filter(cat => cat.subcategories.some(sub => !sub.is_approved))
        .map(cat => cat.id);

      if (pendingCategoryIds.length > 0) {
        setExpandedCategories(prev => {
          const next = new Set(prev);
          pendingCategoryIds.forEach(id => next.add(id));
          return next;
        });
      }
    }
  }, [categoriesResponse]);

  /*
### 4. Admin Interest Categories Enhancements
- **Hierarchical Sorting**: Category groups are sorted by the latest update time, bringing active Proposals to the top.
- **Collapsible Design**: Restored the hierarchical 1.1 SL format with collapse/expand toggles.
- **Visual Nesting**: Improved the parent-child relationship with:
    - **Vertical Connector Lines**: Visual lines connecting interests to their parent category.
    - **Distinct Row Styling**: Shaded backgrounds and left indicators for interest rows to show they are "inside" a category.
    - **Emphasis**: Bold categories and clear "└" symbols for interests.
- **Auto-expansion**: Categories with pending interest requests are expanded by default.
- **Status Filter**: Integrated a status filter for focused moderation.
*/

  const categories = useMemo(() => categoriesResponse?.data || [], [categoriesResponse?.data]);

  // Transform categories and subcategories into flat table data with grouping and sorting
  const tableData = useMemo(() => {
    // 1. Process categories and their subcategories
    const processedGroups = categories.map((cat) => {
      const filteredSubs =
        statusFilter === "all"
          ? cat.subcategories
          : cat.subcategories.filter(
            (sub) => sub.is_approved === (statusFilter === "active")
          );

      const categoryMatches =
        statusFilter === "all" ||
        cat.is_approved === (statusFilter === "active");

      // Find the latest update time for this entire group (category + its filtered subcategories)
      const groupTimes = [
        new Date(cat.updated_at || cat.created_at || 0).getTime(),
        ...filteredSubs.map((s) =>
          new Date(s.updated_at || s.created_at || 0).getTime()
        ),
      ];
      const latestUpdateTime = Math.max(...groupTimes);

      return {
        category: cat,
        filteredSubs,
        categoryMatches,
        latestUpdateTime,
      };
    });

    // 2. Filter groups: show group if category matches OR any subcategory matches
    const visibleGroups = processedGroups.filter(
      (group) => group.categoryMatches || group.filteredSubs.length > 0
    );

    // 3. Sort groups by the latest update time (newest first)
    visibleGroups.sort((a, b) => b.latestUpdateTime - a.latestUpdateTime);

    // 4. Flatten for table display
    const data: any[] = [];
    visibleGroups.forEach((group, groupIdx) => {
      const index = groupIdx + 1;

      // Add category row
      data.push({
        id: `category-${group.category.id}`,
        type: "category",
        categoryId: group.category.id,
        categoryName: group.category.name,
        name: group.category.name,
        subcategoryCount: group.category.subcategories.length,
        isApproved: group.category.is_approved,
        updatedAt: group.category.updated_at || group.category.created_at || "",
        isExpanded: expandedCategories.has(group.category.id),
        hasSubcategories: group.category.subcategories.length > 0,
        index,
      });

      // Add subcategory rows if expanded
      if (expandedCategories.has(group.category.id)) {
        group.filteredSubs.forEach((subcategory, subIdx) => {
          data.push({
            id: `subcategory-${subcategory.id}`,
            type: "subcategory",
            categoryId: group.category.id,
            categoryName: group.category.name,
            name: subcategory.name,
            subcategory,
            isApproved: subcategory.is_approved,
            updatedAt: subcategory.updated_at || subcategory.created_at || "",
            index,
            subIndex: subIdx + 1,
          });
        });
      }
    });

    return data;
  }, [categories, statusFilter, expandedCategories]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // Define table columns
  const columns: Column<typeof tableData[0]>[] = [
    {
      header: "SL",
      accessor: (row) => (
        <span className={row.type === "subcategory" ? "text-white/40 text-sm pl-8" : ""}>
          {row.type === "subcategory" ? `${row.index}.${row.subIndex}` : `${row.index}.`}
        </span>
      ),
    },
    {
      header: "Category & Interests",
      accessor: (row) => (
        <div className="flex items-center h-full">
          {row.type === "category" ? (
            <div className="flex items-center gap-2 py-1">
              <div className="flex items-center justify-center w-6 h-6">
                {row.hasSubcategories ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(row.categoryId);
                    }}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors"
                  >
                    {row.isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-white/60" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-white/5" />
                )}
              </div>
              <span className="font-bold text-white text-base tracking-tight">{row.name}</span>
            </div>
          ) : (
            <div className="flex items-center pl-3">
              <div className="relative h-10 w-6 flex items-center justify-center">
                {/* Vertical line through interest rows */}
                <div className="absolute left-[3px] top-[-50%] bottom-[50%] w-[1px] bg-white/10"></div>
                {/* Horizontal line to the interest name */}
                <div className="absolute left-[3px] top-[50%] w-3 h-[1px] bg-white/10"></div>
              </div>
              <span className="text-white/70 font-normal ml-3">{row.name}</span>
            </div>
          )}
        </div>
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
        return <span className="text-white/40 text-sm">Subcategory</span>;
      },
    },
    {
      header: "Status",
      accessor: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${row.isApproved
            ? "bg-green-500/20 text-green-400"
            : "bg-yellow-500/20 text-yellow-400"
            }`}
        >
          {row.isApproved ? "Active" : "Pending"}
        </span>
      ),
    },
    {
      header: "Updated At",
      accessor: (row) => (
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(row.updatedAt)}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center justify-center space-x-2">
          {/* Approve Button */}
          {!row.isApproved && (
            <Tooltip position="left" text="Approve Proposal">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    if (row.type === "category") {
                      await approveCategory(row.categoryId).unwrap();
                      toast.success("Category approved!");
                    } else if (row.subcategory) {
                      await approveSubcategory(row.subcategory.id).unwrap();
                      toast.success("Subcategory approved!");
                    }
                  } catch (error: any) {
                    toast.error("Failed to approve", {
                      description: error?.data?.message || "Something went wrong",
                    });
                  }
                }}
                className="p-2 cursor-pointer text-green-500 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {/* Reject Button */}
          {!row.isApproved && (
            <Tooltip position="left" text="Reject & Delete Proposal">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (row.type === "category") {
                    handleDeleteClick("category", row.categoryId, row.name, undefined, true);
                  } else if (row.subcategory) {
                    handleDeleteClick("subcategory", row.subcategory.id, row.name, row.categoryName, true);
                  }
                }}
                className="p-2 cursor-pointer text-red-500 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {/* Edit Button */}
          <Tooltip position="left" text={row.type === "category" ? "Edit Category" : "Edit Subcategory"}>
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
              className="p-2 cursor-pointer text-white/50 hover:text-blue-400 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              <Edit className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Delete Button */}
          <Tooltip position="left" text={row.type === "category" ? "Delete Category" : "Delete Subcategory"}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (row.type === "category") {
                  handleDeleteClick("category", row.categoryId, row.name);
                } else if (row.subcategory) {
                  handleDeleteClick("subcategory", row.subcategory.id, row.name, row.categoryName);
                }
              }}
              className="p-2 cursor-pointer text-white/50 hover:text-red-500 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip>
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

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setModalType("category");
    setIsModalOpen(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory, categoryName: string) => {
    setEditingSubcategory({ subcategory, categoryName });
    setSelectedCategoryForSubcategory(categoryName);
    setModalType("subcategory");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (
    type: "category" | "subcategory",
    id: number,
    name: string,
    categoryName?: string,
    isReject?: boolean
  ) => {
    setItemToDelete({ type, id, name, categoryName, isReject });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "category") {
        await deleteCategory(itemToDelete.id).unwrap();
        toast.success(itemToDelete.isReject ? "Category rejected and deleted!" : "Category deleted successfully!");
      } else {
        await deleteSubcategory(itemToDelete.id).unwrap();
        toast.success(itemToDelete.isReject ? "Subcategory rejected and deleted!" : "Subcategory deleted successfully!");
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
          await updateSubcategory({
            id: editingSubcategory.subcategory.id,
            name: data.name,
            category_name: data.categoryName || editingSubcategory.categoryName,
          }).unwrap();
          toast.success("Subcategory updated successfully!");
        } else {
          if (!data.categoryName) {
            toast.error("Please select a category");
            return;
          }
          await createSubcategory({
            category_name: data.categoryName,
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
        description="Manage interest categories and subcategories for user preferences"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load categories. Please try again later"
        emptyMessage="No categories found"
        filters={
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <TableFilters
              filters={[
                {
                  type: "select",
                  key: "status",
                  // label: "Status",
                  options: [
                    { value: "all", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "pending", label: "Pending" },
                  ],
                  value: statusFilter,
                  onChange: setStatusFilter,
                },
              ]}
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreateCategory}
                className="bg-[#6B83FA] px-4 py-1 cursor-pointer rounded-lg hover:bg-[#5a70e8] transition text-base font-medium whitespace-nowrap"
              >
                + Create Category
              </button>
              <button
                onClick={handleCreateSubcategory}
                className="bg-white/10 border border-white/20 px-4 py-1.5 cursor-pointer rounded-lg hover:bg-white/20 transition text-base font-medium whitespace-nowrap"
              >
                + Create Subcategory
              </button>
            </div>
          </div>
        }
        rowClassName={(row) =>
          row.type === "subcategory"
            ? "bg-white/[0.02] border-l-2 border-white/5"
            : "bg-white/[0.04] font-semibold border-b border-white/5"
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
        title={itemToDelete?.isReject ? `Reject ${itemToDelete?.type === "category" ? "Category" : "Subcategory"}?` : `Delete ${itemToDelete?.type === "category" ? "Category" : "Subcategory"}?`}
        description={itemToDelete?.isReject
          ? `Are you sure you want to reject and permanently delete "${itemToDelete?.name}"?`
          : `Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.${itemToDelete?.type === "category"
            ? " All subcategories under this category will also be deleted."
            : ""
          }`}
        confirmLabel={itemToDelete?.isReject ? "Reject" : "Delete"}
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

