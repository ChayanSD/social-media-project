"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { FaHome } from "react-icons/fa";
import { useGetMarketplaceCategoriesQuery } from "@/store/marketplaceApi";

interface MarketplaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MarketplaceSidebar({
  isOpen,
  onClose,
}: MarketplaceSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: categoriesResponse, isLoading, isError } = useGetMarketplaceCategoriesQuery();
  const categories = categoriesResponse?.data || categoriesResponse?.results?.data || [];

  // Convert to camelCase format (e.g., "Home & Garden" -> "homeAndGarden")
  const toCamelCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const isCategoryExpanded = (categoryName: string) => {
    return expandedCategories.has(categoryName);
  };

  const handleCategoryClick = (categoryName: string) => {
    toggleCategory(categoryName);
    const categoryParam = toCamelCase(categoryName);
    router.push(`/marketplace/buy?category=${categoryParam}`);
    onClose();
  };

  const generateSubcategoryHref = (categoryName: string, subcategory: string) => {
    const categoryParam = toCamelCase(categoryName);
    const subcategoryParam = toCamelCase(subcategory);
    return `/marketplace/buy?category=${categoryParam}&subcategory=${subcategoryParam}`;
  };

  const currentCategory = searchParams.get("category");
  const currentSubcategory = searchParams.get("subcategory");

  return (
    <>
      <aside
        className={`fixed lg:static top-0 left-0 w-64 h-full bg-black/70 lg:bg-transparent transform transition-transform duration-300 ease-in-out z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center justify-between p-6 pb-7 border-b border-white/10">
          <h1 className="text-xl font-semibold">Virtual Store</h1>
          <button
            className="lg:hidden text-white"
            onClick={onClose}
          >
            <FiX size={24} />
          </button>
        </div>

        <nav className="p-4 h-[calc(100vh-120px)] flex flex-col justify-between py-10">
          <ul className="space-y-1 flex-1 overflow-y-auto pr-2">
            {isLoading ? (
              <li className="px-3 py-2">
                <div className="animate-pulse space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-10 bg-white/10 rounded-md" />
                  ))}
                </div>
              </li>
            ) : isError ? (
              <li className="px-3 py-2">
                <p className="text-red-400 text-sm">Failed to load categories</p>
              </li>
            ) : categories.length === 0 ? (
              <li className="px-3 py-2">
                <p className="text-gray-400 text-sm">No categories available</p>
              </li>
            ) : (
              categories.map((category) => {
                const isExpanded = isCategoryExpanded(category.name);
                const categoryParam = toCamelCase(category.name);
                const isCategoryActive = currentCategory === categoryParam;
                return (
                  <li key={category.id}>
                    <button
                      onClick={() => handleCategoryClick(category.name)}
                      className={`w-full flex cursor-pointer items-center justify-between px-3 py-2 rounded-md text-base transition-all duration-150 text-left ${
                        isCategoryActive
                          ? "bg-[#fc859d3a] text-white"
                          : "hover:bg-white/10 text-gray-100"
                      }`}
                    >
                      <span className="font-medium">{category.name}</span>
                      {category.subcategories.length > 0 && (
                        <span
                          className={`inline-block w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-300 transition-transform duration-300 ${
                            isExpanded ? "" : "-rotate-90"
                          }`}
                        />
                      )}
                    </button>
                    {category.subcategories.length > 0 && (
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <ul className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                          {category.subcategories.map((subcategory) => {
                            const href = generateSubcategoryHref(category.name, subcategory.name);
                            const subcategoryParam = toCamelCase(subcategory.name);
                            const isActive =
                              currentCategory === categoryParam &&
                              currentSubcategory === subcategoryParam;
                            return (
                              <li key={subcategory.id}>
                                <Link
                                  href={href}
                                  onClick={onClose}
                                  className={`block px-3 py-1.5 rounded-md text-sm transition-all duration-150 ${
                                    isActive
                                      ? "bg-[#fc859d3a] text-white"
                                      : "hover:bg-white/10 text-gray-300"
                                  }`}
                                >
                                  {subcategory.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-100 hover:text-white hover:bg-white/10 rounded-lg p-2 px-4 my-4"
          >
            <FaHome size={24} /> Home
          </Link>
        </nav>
      </aside>
    </>
  );
}

