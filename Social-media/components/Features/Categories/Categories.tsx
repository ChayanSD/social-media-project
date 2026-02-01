"use client";
import React, { useState } from 'react';
import { 
  FiTag, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiChevronDown, 
  FiChevronRight,
  FiSearch
} from 'react-icons/fi';
import PageHeader from '../../Shared/PageHeader/PageHeader';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateSubcategoryMutation,
  useUpdateSubcategoryMutation,
  useDeleteSubcategoryMutation,
  Category,
  Subcategory
} from '@/store/categoryApi';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import ErrorState from '../../Shared/ErrorState';

const Categories = () => {
  const { data: categoriesResponse, isLoading, isError, refetch } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [createSubcategory, { isLoading: isCreatingSubcategory }] = useCreateSubcategoryMutation();
  const [updateSubcategory, { isLoading: isUpdatingSubcategory }] = useUpdateSubcategoryMutation();
  const [deleteSubcategory] = useDeleteSubcategoryMutation();

  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{ subcategory: Subcategory; categoryName: string } | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<string>('');
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'subcategory'; id: number; name: string; categoryName?: string } | null>(null);

  const categories = categoriesResponse?.data || [];

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.subcategories.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await createCategory({ name: categoryName.trim() }).unwrap();
      toast.success('Category created successfully!');
      setCategoryName('');
      setShowCategoryForm(false);
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'Failed to create category';
      toast.error('Failed to create category', { description: errorMessage });
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await updateCategory({ id: editingCategory.id, name: categoryName.trim() }).unwrap();
      toast.success('Category updated successfully!');
      setEditingCategory(null);
      setCategoryName('');
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'Failed to update category';
      toast.error('Failed to update category', { description: errorMessage });
    }
  };

  const handleDeleteClick = (type: 'category' | 'subcategory', id: number, name: string, categoryName?: string) => {
    setItemToDelete({ type, id, name, categoryName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'category') {
        await deleteCategory(itemToDelete.id).unwrap();
        toast.success('Category deleted successfully!');
      } else {
        await deleteSubcategory(itemToDelete.id).unwrap();
        toast.success('Subcategory deleted successfully!');
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'Failed to delete';
      toast.error('Failed to delete', { description: errorMessage });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcategoryName.trim() || !selectedCategoryForSubcategory) {
      toast.error('Subcategory name and category are required');
      return;
    }

    try {
      await createSubcategory({ 
        category_name: selectedCategoryForSubcategory, 
        name: subcategoryName.trim() 
      }).unwrap();
      toast.success('Subcategory created successfully!');
      setSubcategoryName('');
      setSelectedCategoryForSubcategory('');
      setShowSubcategoryForm(false);
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'Failed to create subcategory';
      toast.error('Failed to create subcategory', { description: errorMessage });
    }
  };

  const handleUpdateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory || !subcategoryName.trim()) {
      toast.error('Subcategory name is required');
      return;
    }

    try {
      await updateSubcategory({ 
        id: editingSubcategory.subcategory.id, 
        name: subcategoryName.trim(),
        category_name: editingSubcategory.categoryName
      }).unwrap();
      toast.success('Subcategory updated successfully!');
      setEditingSubcategory(null);
      setSubcategoryName('');
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'Failed to update subcategory';
      toast.error('Failed to update subcategory', { description: errorMessage });
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowCategoryForm(true);
  };

  const startEditSubcategory = (subcategory: Subcategory, categoryName: string) => {
    setEditingSubcategory({ subcategory, categoryName });
    setSubcategoryName(subcategory.name);
    setSelectedCategoryForSubcategory(categoryName);
    setShowSubcategoryForm(true);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditingSubcategory(null);
    setCategoryName('');
    setSubcategoryName('');
    setSelectedCategoryForSubcategory('');
    setShowCategoryForm(false);
    setShowSubcategoryForm(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
        <div className="bg-[#06133FBF] backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6 md:p-10">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-20 bg-white/10 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
        <div className="bg-[#06133FBF] backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6 md:p-10">
            <ErrorState
              message="Failed to load categories. Please try again later."
              onRetry={() => refetch()}
            />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
      <div className="bg-[#06133FBF] backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6 md:p-10">
        {/* Header Section */}
        <PageHeader
          icon={<FiTag className="w-8 h-8 text-white" />}
          title="Categories Management"
          description="Manage categories and subcategories to organize content and help users find what they're looking for."
        />

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search categories or subcategories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-white/40"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => {
              cancelEdit();
              setShowCategoryForm(!showCategoryForm);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg"
          >
            <FiPlus className="w-5 h-5" />
            {showCategoryForm ? 'Cancel' : 'Add Category'}
          </button>
          <button
            onClick={() => {
              cancelEdit();
              setShowSubcategoryForm(!showSubcategoryForm);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/10 transition-all"
          >
            <FiPlus className="w-5 h-5" />
            {showSubcategoryForm ? 'Cancel' : 'Add Subcategory'}
          </button>
        </div>

        {/* Category Form */}
        {showCategoryForm && (
          <div className="mb-8 bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Category Name</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-white/40"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreatingCategory || isUpdatingCategory}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCategory ? (isUpdatingCategory ? 'Updating...' : 'Update') : (isCreatingCategory ? 'Creating...' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subcategory Form */}
        {showSubcategoryForm && (
          <div className="mb-8 bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              {editingSubcategory ? 'Edit Subcategory' : 'Create New Subcategory'}
            </h3>
            <form onSubmit={editingSubcategory ? handleUpdateSubcategory : handleCreateSubcategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
                <select
                  value={selectedCategoryForSubcategory}
                  onChange={(e) => setSelectedCategoryForSubcategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white"
                  required
                  disabled={!!editingSubcategory}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option className="cursor-pointer" key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Subcategory Name</label>
                <input
                  type="text"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  placeholder="Enter subcategory name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-white/40"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreatingSubcategory || isUpdatingSubcategory}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingSubcategory ? (isUpdatingSubcategory ? 'Updating...' : 'Update') : (isCreatingSubcategory ? 'Creating...' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">No categories found</p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      {expandedCategories.has(category.id) ? (
                        <FiChevronDown className="w-5 h-5" />
                      ) : (
                        <FiChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                    <span className="text-white/40 text-sm">
                      ({category.subcategories.length} subcategories)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditCategory(category)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="Edit category"
                    >
                      <FiEdit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick('category', category.id, category.name)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      title="Delete category"
                    >
                      <FiTrash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {expandedCategories.has(category.id) && (
                  <div className="ml-8 mt-4 space-y-2">
                    {category.subcategories.length === 0 ? (
                      <p className="text-white/40 text-sm">No subcategories</p>
                    ) : (
                      category.subcategories.map((subcategory) => (
                        <div
                          key={subcategory.id}
                          className="flex items-center justify-between bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all"
                        >
                          <span className="text-white/80">{subcategory.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditSubcategory(subcategory, category.name)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                              title="Edit subcategory"
                            >
                              <FiEdit2 className="w-4 h-4 text-white" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick('subcategory', subcategory.id, subcategory.name, category.name)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                              title="Delete subcategory"
                            >
                              <FiTrash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={`Delete ${itemToDelete?.type === 'category' ? 'Category' : 'Subcategory'}`}
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.${
          itemToDelete?.type === 'category' 
            ? ' All subcategories under this category will also be deleted.' 
            : ''
        }`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default Categories;

