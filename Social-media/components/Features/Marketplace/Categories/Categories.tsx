"use client";

import React from 'react';
import { useGetMarketplaceCategoriesQuery } from '@/store/marketplaceApi';
import ErrorState from '../../../Shared/ErrorState';

const Categories = () => {
    const { data: categoriesResponse, isLoading, isError, refetch } = useGetMarketplaceCategoriesQuery();
    const categories = categoriesResponse?.data || categoriesResponse?.results?.data || [];

    if (isLoading) {
        return (
            <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-10 xl:gap-20 px-4'>
                {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                        <div className="h-7 bg-white/10 rounded mb-4 w-32" />
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-5 bg-white/10 rounded w-24" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="px-4 py-8 text-center">
                <ErrorState
                    message="Failed to load categories. Please try again later."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    if (!categories.length) {
        return (
            <div className="px-4 py-8 text-center">
                <p className="text-white/60 text-sm">
                    No categories available at the moment.
                </p>
            </div>
        );
    }

    return (
        <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-10 xl:gap-20 px-4'>
            {categories.map((category) => (
                <div key={category.id}>
                    <h1 className='xl:text-2xl md:text-xl text-lg font-bold mb-4 text-white'>{category.name}</h1>
                    <ul className='flex flex-col gap-2'>
                        {category.subcategories.map((subcategory) => (
                            <li key={subcategory.id} className='font-medium text-sm md:text-base text-white/80 hover:text-white transition-colors cursor-pointer'>
                                {subcategory.name}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default Categories;