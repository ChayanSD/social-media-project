"use client";

import React, { useState, useMemo } from 'react';
import {
  FiPlus,
  FiCheck,
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
import ErrorState from '../../Shared/ErrorState';
import ProposeCategoryModal from './ProposeCategoryModal';
import ProposeSubcategoryModal from './ProposeSubcategoryModal';

const JoinCategories = () => {
  const { data: categoriesResponse, isLoading, isError, refetch: refetchCategories } = useGetCategoriesQuery();
  const { data: profileResponse } = useGetCurrentUserProfileQuery();
  const [updateUserProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const [isProposeCategoryOpen, setIsProposeCategoryOpen] = useState(false);
  const [isProposeSubcategoryOpen, setIsProposeSubcategoryOpen] = useState(false);
  const [selectedCategoryForPropose, setSelectedCategoryForPropose] = useState<string | null>(null);

  const allCategories = categoriesResponse?.data || [];
  const categories = useMemo(() => {
    return allCategories
      .filter(cat => cat.is_approved === true)
      .map(cat => ({
        ...cat,
        subcategories: cat.subcategories.filter(sub => sub.is_approved === true)
      }));
  }, [allCategories]);
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

  const isSubcategoryJoined = (subcategoryId: number) => {
    return userSubcategoryIds.has(subcategoryId);
  };

  const handleToggleSubcategory = async (subcategoryId: number) => {
    if (isSubcategoryJoined(subcategoryId)) {
      toast.info('This interest is already in your profile. To remove it, please go to the "Manage Categories" page.');
      return;
    }

    const currentIds = Array.from(userSubcategoryIds);
    const newIds = [...currentIds, subcategoryId];

    try {
      await updateUserProfile({
        subcategory_ids: newIds,
      }).unwrap();

      toast.success('Interest added successfully!');
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        'Failed to update interests';
      toast.error('Failed to update interests', { description: errorMessage });
    }
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
      <div className="max-w-[1220px] mx-auto px-4 py-8 pb-[calc(100vh-500px)] text-white">
        <ErrorState
          message="Failed to load categories. Please try again later."
          onRetry={() => refetchCategories()}
        />

      </div>
    );
  }

  return (
    <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
      <div className="page-container">
        {/* Header Section */}
        <PageHeader
          icon={<FiPlus className="w-8 h-8 text-white" />}
          title="Join Categories"
          description="Explore and join categories that interest you. Select subcategories to personalize your feed."
        />

        {/* Search Bar and Propose Button */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search categories or subcategories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-white/40"
            />
          </div>
          <button
            onClick={() => setIsProposeCategoryOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/20 whitespace-nowrap"
          >
            <FiPlus className="w-5 h-5" />
            Propose New Category
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 col-span-full">
              <p className="text-white/60 text-lg">No categories found</p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white/5 h-full rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all flex flex-col"
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
                  <div>
                    <h3 className="text-xl font-semibold text-white">{category.name}</h3>

                    <p className="text-white/40 text-base ">
                      ({category.subcategories.length} subcategories)
                    </p>
                  </div>
                </div>

                {/* Subcategories */}
                {expandedCategories.has(category.id) && (
                  <div className="ml-8 mt-4">
                    {category.subcategories.length === 0 ? (
                      <p className="text-white/40 text-base">No subcategories</p>
                    ) : (
                      <div className="flex flex-wrap gap-3 mb-4">
                        {category.subcategories
                          .map((subcategory) => {
                            const isJoined = isSubcategoryJoined(subcategory.id);
                            return (
                              <button
                                key={subcategory.id}
                                onClick={() => handleToggleSubcategory(subcategory.id)}
                                disabled={isUpdating}
                                className={`px-4 py-2 rounded-full text-base border transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isJoined
                                  ? "border-teal-400 bg-teal-400/20 text-teal-400"
                                  : "border-white/30 text-white hover:border-white/50 hover:bg-white/10"
                                  }`}
                              >
                                {isJoined ? (
                                  <>
                                    <FiCheck className="w-4 h-4" />
                                    {subcategory.name}
                                  </>
                                ) : (
                                  <>
                                    <FiPlus className="w-4 h-4" />
                                    {subcategory.name}
                                  </>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* Propose Subcategory Button at bottom of card */}
                <div className="mt-auto pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategoryForPropose(category.name);
                      setIsProposeSubcategoryOpen(true);
                    }}
                    className="w-full py-2.5 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all border border-white/5 hover:border-white/20"
                  >
                    <FiPlus className="w-4 h-4" />
                    Propose Interest
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ProposeCategoryModal
        open={isProposeCategoryOpen}
        onOpenChange={setIsProposeCategoryOpen}
      />

      {selectedCategoryForPropose && (
        <ProposeSubcategoryModal
          open={isProposeSubcategoryOpen}
          onOpenChange={setIsProposeSubcategoryOpen}
          categoryName={selectedCategoryForPropose}
        />
      )}
    </div>
  );
};

export default JoinCategories;

