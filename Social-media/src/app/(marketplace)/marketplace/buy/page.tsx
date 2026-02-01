"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '../../../../../components/Cards/ProductCard';
import ProductDetailsModal from '@/components/admin/ProductDetailsModal';
import { useGetMarketplaceItemsQuery, useGetMarketplaceCategoriesQuery, MarketplaceItem } from '@/store/marketplaceApi';
import ErrorState from '../../../../../components/Shared/ErrorState';

const BuyPage = () => {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch categories for mapping names
    const { data: categoriesResponse } = useGetMarketplaceCategoriesQuery();

    // Get all categories to map names
    const categories = useMemo(() => {
        const data = categoriesResponse?.data || categoriesResponse?.results?.data || [];
        return Array.isArray(data) ? data : [];
    }, [categoriesResponse]);

    // Find category and subcategory names from the params
    const selectedCategoryName = useMemo(() => {
        if (!categoryParam) return null;
        const camelCaseCategory = categoryParam;
        // Find matching category by converting names to camelCase
        return categories.find((cat) => {
            const camelCase = cat.name
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .split(/\s+/)
                .map((word, index) => {
                    if (index === 0) return word.toLowerCase();
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join("");
            return camelCase === camelCaseCategory;
        })?.name || null;
    }, [categoryParam, categories]);

    const selectedSubcategoryName = useMemo(() => {
        if (!subcategoryParam || !selectedCategoryName) return null;
        const category = categories.find((cat) => cat.name === selectedCategoryName);
        if (!category) return null;

        const camelCaseSubcategory = subcategoryParam;
        return category.subcategories.find((sub) => {
            const camelCase = sub.name
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .split(/\s+/)
                .map((word, index) => {
                    if (index === 0) return word.toLowerCase();
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join("");
            return camelCase === camelCaseSubcategory;
        })?.name || null;
    }, [subcategoryParam, selectedCategoryName, categories]);

    // Fetch items with server-side filtering and pagination
    const { data: itemsResponse, isLoading, isError, refetch: refetchItems } = useGetMarketplaceItemsQuery({
        page: currentPage,
        category: selectedCategoryName || undefined,
        subcategory: selectedSubcategoryName || undefined
    });

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [categoryParam, subcategoryParam]);

    // Calculate items to display (only published)
    const items = useMemo(() => {
        if (!itemsResponse) return [];
        const rawItems = (
            itemsResponse.data ??
            itemsResponse.results?.data ??
            itemsResponse.items ??
            []
        );
        return rawItems.filter((item) => {
            const status = (item as MarketplaceItem & { status?: string }).status;
            return status === "published";
        });
    }, [itemsResponse]);

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [productToView, setProductToView] = useState<MarketplaceItem & {
        status?: string;
        name?: string;
        user_name?: string;
        location?: string;
        description?: string;
        link?: string;
    } | null>(null);

    const handleViewDetails = (item: MarketplaceItem) => {
        setProductToView(item as MarketplaceItem & {
            status?: string;
            name?: string;
            user_name?: string;
            location?: string;
            description?: string;
            link?: string;
        });
        setIsDetailsModalOpen(true);
    };

    if (isLoading && currentPage === 1) {
        return (
            <div>
                {(selectedCategoryName || selectedSubcategoryName) && (
                    <div className='mb-4 px-2 md:px-4 text-sm text-gray-300'>
                        {selectedCategoryName && <span>Category: <span className='font-semibold text-white'>{selectedCategoryName}</span></span>}
                        {selectedSubcategoryName && <span className='ml-4'>Subcategory: <span className='font-semibold text-white'>{selectedSubcategoryName}</span></span>}
                    </div>
                )}
                <div className='grid grid-cols-1 2xl:grid-cols-2 gap-6 px-2 md:px-4'>
                    {Array.from({ length: 20 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-2xl bg-white/5 border border-white/10 aspect-square max-h-[350px] w-full"
                        >
                            <div className="w-full h-full bg-white/10 rounded-2xl" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div>
                {(selectedCategoryName || selectedSubcategoryName) && (
                    <div className='mb-4 px-2 md:px-4 text-sm text-gray-300'>
                        {selectedCategoryName && <span>Category: <span className='font-semibold text-white'>{selectedCategoryName}</span></span>}
                        {selectedSubcategoryName && <span className='ml-4'>Subcategory: <span className='font-semibold text-white'>{selectedSubcategoryName}</span></span>}
                    </div>
                )}
                <ErrorState
                    message="Failed to load services. Please try again later."
                    onRetry={() => {
                        setCurrentPage(1);
                        refetchItems();
                    }}
                />
            </div>
        );
    }

    if (!items.length && !isLoading) {
        return (
            <div>
                {(selectedCategoryName || selectedSubcategoryName) && (
                    <div className='mb-4 px-2 md:px-4 text-sm text-gray-300'>
                        {selectedCategoryName && <span>Category: <span className='font-semibold text-white'>{selectedCategoryName}</span></span>}
                        {selectedSubcategoryName && <span className='ml-4'>Subcategory: <span className='font-semibold text-white'>{selectedSubcategoryName}</span></span>}
                    </div>
                )}
                <div className="px-2 md:px-4 py-8 text-center">
                    <p className="text-white/60 text-sm">
                        {selectedCategoryName || selectedSubcategoryName
                            ? "No services found for the selected filters."
                            : "No services available at the moment."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-12">
            {(selectedCategoryName || selectedSubcategoryName) && (
                <div className='mb-4 px-2 md:px-4 text-sm text-gray-300'>
                    {selectedCategoryName && <span>Category: <span className='font-semibold text-white'>{selectedCategoryName}</span></span>}
                    {selectedSubcategoryName && <span className='ml-4'>Subcategory: <span className='font-semibold text-white'>{selectedSubcategoryName}</span></span>}
                </div>
            )}
            <div className='grid grid-cols-1 2xl:grid-cols-2 gap-6 px-2 md:px-4'>
                {items.map((item, index) => (
                    <ProductCard
                        key={item.id}
                        id={item.id}
                        index={index}
                        title={(item.title || (item as { name?: string }).name) as string | undefined}
                        image={item.image || item.images?.[0]}
                        description={item.description}
                        location={item.location}
                        link={item.link}
                        seller={item.seller}
                        user_name={(item as { user_name?: string }).user_name}
                        onViewDetails={() => handleViewDetails(item)}
                    />
                ))}
            </div>

            {/* Pagination Controls */}
            {(itemsResponse?.next || itemsResponse?.previous) && (
                <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={!itemsResponse?.previous || isLoading}
                        className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                        Previous
                    </button>
                    <span className="text-white/60 text-sm">
                        Page {currentPage}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={!itemsResponse?.next || isLoading}
                        className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Service Details Modal */}
            <ProductDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setProductToView(null);
                }}
                product={productToView}
            />
        </div>
    );
};

export default BuyPage;