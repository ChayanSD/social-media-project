"use client";

import React, { useState, useMemo } from 'react';
import { 
  FiTag, 
  FiTrash2,
  FiSearch,
  FiChevronDown, 
  FiChevronRight
} from 'react-icons/fi';
import PageHeader from '../../Shared/PageHeader/PageHeader';
import {
  useGetCategoriesQuery,
} from '@/store/categoryApi';
import { 
  useGetCurrentUserProfileQuery,
  useUpdateUserProfileMutation 
} from '@/store/authApi';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';

const ManageCategories = () => {
  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const { data: profileResponse, isLoading: isProfileLoading } = useGetCurrentUserProfileQuery();
  const [updateUserProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
  
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subcategoryToRemove, setSubcategoryToRemove] = useState<{ id: number; name: string; categoryName: string } | null>(null);

  const categories = categoriesResponse?.data || [];
  const profile = profileResponse?.data;
  
  // Get user's current interests (subcategory IDs)
  const userSubcategoryIds = useMemo(() => {
    if (!profile) return new Set<number>();
    // Check for subcategories in profile - could be in different formats
    const subcategories = (profile as { 
      subcategories?: Array<{ id: number } | number>;
      interests?: Array<{ id: number } | number>;
      subcategory_ids?: number[];
    })?.subcategories || 
    (profile as { 
      subcategories?: Array<{ id: number } | number>;
      interests?: Array<{ id: number } | number>;
      subcategory_ids?: number[];
    })?.interests ||
    (profile as { 
      subcategories?: Array<{ id: number } | number>;
      interests?: Array<{ id: number } | number>;
      subcategory_ids?: number[];
    })?.subcategory_ids || [];
    
    return new Set(
      subcategories.map((sub: { id: number } | number) => 
        typeof sub === 'number' ? sub : sub.id
      )
    );
  }, [profile]);

  // Filter categories to only show those with joined subcategories
  const joinedCategories = useMemo(() => {
    return categories
      .map(category => ({
        ...category,
        subcategories: category.subcategories.filter(sub => userSubcategoryIds.has(sub.id))
      }))
      .filter(category => category.subcategories.length > 0);
  }, [categories, userSubcategoryIds]);

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredCategories = joinedCategories.filter((category) => {
    const matchesSearch = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.subcategories.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleRemoveClick = (subcategory: { id: number; name: string }, categoryName: string) => {
    setSubcategoryToRemove({ id: subcategory.id, name: subcategory.name, categoryName });
    setDeleteDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!subcategoryToRemove) return;

    const currentIds = Array.from(userSubcategoryIds);
    const newIds = currentIds.filter(id => id !== subcategoryToRemove.id);

    try {
      await updateUserProfile({
        subcategory_ids: newIds,
      }).unwrap();
      
      toast.success('Interest removed successfully!');
      setDeleteDialogOpen(false);
      setSubcategoryToRemove(null);
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error || 
                          (error as { data?: { error?: string; message?: string } })?.data?.message || 
                          'Failed to remove interest';
      toast.error('Failed to remove interest', { description: errorMessage });
    }
  };

  const handleRemoveCancel = () => {
    setDeleteDialogOpen(false);
    setSubcategoryToRemove(null);
  };

  const isLoading = isCategoriesLoading || isProfileLoading;

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

  return (
    <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
      <div className="page-container">
        {/* Header Section */}
        <PageHeader
          icon={<FiTag className="w-8 h-8 text-white" />}
          title="Manage Categories"
          description="View and manage your joined categories and interests. Remove any interest you no longer want."
        />

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your joined categories or interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-white/40"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 col-span-full">
              <p className="text-white/60 text-lg mb-2">
                {joinedCategories.length === 0 
                  ? "You haven't joined any categories yet" 
                  : "No matching categories found"}
              </p>
              {joinedCategories.length === 0 && (
                <p className="text-white/40 text-sm">
                  Go to Join Categories to add interests to your profile
                </p>
              )}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white/5 h-full rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
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
                <div >
                <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                  <p className="text-white/40 text-sm">
                    ({category.subcategories.length} {category.subcategories.length === 1 ? 'interest' : 'interests'})
                  </p>
                  </div>
                </div>

                {/* Subcategories */}
                {expandedCategories.has(category.id) && (
                  <div className="ml-8 mt-4 space-y-2">
                    {category.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center justify-between bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all"
                      >
                        <span className="text-white/80">{subcategory.name}</span>
                        <button
                          onClick={() => handleRemoveClick(subcategory, category.name)}
                          disabled={isUpdating}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove interest"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Remove Interest?"
        description={`Are you sure you want to remove "${subcategoryToRemove?.name}" from your interests? This will update your profile preferences.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleRemoveConfirm}
        onCancel={handleRemoveCancel}
      />
    </div>
  );
};

export default ManageCategories;

