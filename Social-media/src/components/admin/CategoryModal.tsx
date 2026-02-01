"use client";

import React, { useState, useEffect } from "react";
import { Category, Subcategory } from "@/store/categoryApi";
import { MarketplaceCategory, MarketplaceSubcategory } from "@/store/marketplaceApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomDialog from "@/components/ui/CustomDialog";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; categoryName?: string }) => void;
  type: "category" | "subcategory";
  editingCategory?: Category | MarketplaceCategory | null;
  editingSubcategory?: { subcategory: Subcategory | MarketplaceSubcategory; categoryName: string } | null;
  categories: (Category | MarketplaceCategory)[];
  selectedCategoryForSubcategory?: string;
  onCategoryChange?: (categoryName: string) => void;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  editingCategory,
  editingSubcategory,
  categories,
  selectedCategoryForSubcategory = "",
  onCategoryChange,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(selectedCategoryForSubcategory);

  useEffect(() => {
    if (isOpen) {
      if (type === "category" && editingCategory) {
        setName(editingCategory.name);
      } else if (type === "subcategory" && editingSubcategory) {
        setName(editingSubcategory.subcategory.name);
        setSelectedCategory(editingSubcategory.categoryName);
      } else {
        setName("");
        setSelectedCategory(selectedCategoryForSubcategory);
      }
    }
  }, [
    isOpen,
    type,
    editingCategory,
    editingSubcategory,
    selectedCategoryForSubcategory,
  ]);

  useEffect(() => {
    if (onCategoryChange) {
      onCategoryChange(selectedCategory);
    }
  }, [selectedCategory, onCategoryChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    if (type === "subcategory" && !selectedCategory) {
      return;
    }
    onSubmit({
      name: name.trim(),
      categoryName: type === "subcategory" ? selectedCategory : undefined,
    });
  };

  const handleClose = () => {
    setName("");
    setSelectedCategory("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title={
        editingCategory || editingSubcategory
          ? `Edit ${type === "category" ? "Category" : "Subcategory"}`
          : `Create ${type === "category" ? "Category" : "Subcategory"}`
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
          {type === "subcategory" && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={!!editingSubcategory}
                required
              >
                <SelectTrigger className="w-full h-12 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#6B83FA] text-white disabled:bg-white/5 disabled:cursor-not-allowed hover:bg-white/15 transition-colors cursor-pointer">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[#06133FBF] text-white backdrop-blur-md border border-white/20 shadow-lg">
                  {categories.length === 0 ? (
                    <SelectItem value="" disabled>
                      No categories available
                    </SelectItem>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name} className="cursor-pointer">
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {type === "category" ? "Category" : "Subcategory"} Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${type === "category" ? "category" : "subcategory"} name`}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B83FA] text-white placeholder-white/40 cursor-pointer"
              required
              autoFocus
            />
          </div>

        {/* BUTTONS */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-[#6B83FA] hover:bg-[#5a70e8] text-white font-medium rounded-xl transition cursor-pointer"
          >
            {editingCategory || editingSubcategory ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </CustomDialog>
  );
}

