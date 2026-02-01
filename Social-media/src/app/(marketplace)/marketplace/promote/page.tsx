"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { FaUpload } from "react-icons/fa";
import { useGetMarketplaceCategoriesQuery, useCreateProductMutation, useGetMarketplaceItemsQuery, usePatchProductStatusMutation, useDeleteProductMutation, MarketplaceItem } from "@/store/marketplaceApi";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import { getUsernameFromToken, getStoredAccessToken } from "@/lib/auth";
import { toast } from "sonner";
import ProductCard from "../../../../../components/Cards/ProductCard";
import EditProductModal from "@/components/admin/EditProductModal";
import ProductDetailsModal from "@/components/admin/ProductDetailsModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import SubscriptionUsageCard from "@/components/marketplace/SubscriptionUsageCard";
import SubscriptionPlansModal from "@/components/marketplace/SubscriptionPlansModal";
import { useGetSubscriptionUsageQuery } from "@/store/paymentApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceFormData {
  name: string;
  sub_category: number;
  description?: string;
  location?: string;
  link: string;
  image: File | null;
}

const inputClass =
  "w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 text-sm sm:text-base";

const selectClass = `${inputClass} cursor-pointer`;

export default function PromoteServicePage() {
  const { register, handleSubmit, watch, reset, setValue } = useForm<ServiceFormData>({
    defaultValues: {
      name: "",
      sub_category: 0,
      description: "",
      location: "",
      link: "",
      image: null,
    },
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<MarketplaceItem & {
    status?: string;
    name?: string;
    user_name?: string;
    location?: string;
    description?: string;
  } | null>(null);
  const [serviceToView, setServiceToView] = useState<MarketplaceItem & {
    status?: string;
    name?: string;
    user_name?: string;
    location?: string;
    description?: string;
    link?: string;
  } | null>(null);

  const { data: categoriesResponse } = useGetMarketplaceCategoriesQuery();
  const { data: itemsResponse, refetch: refetchItems } = useGetMarketplaceItemsQuery();
  const { data: userProfile } = useGetCurrentUserProfileQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [patchProductStatus] = usePatchProductStatusMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{
    id: number | string;
    name: string;
  } | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const { data: usageData, refetch: refetchUsage } = useGetSubscriptionUsageQuery();

  const categories = categoriesResponse?.data || categoriesResponse?.results?.data || [];
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
  const availableSubcategories = selectedCategory?.subcategories || [];

  // Get current user's username
  const currentUsername = useMemo(() => {
    const token = getStoredAccessToken();
    if (token) {
      return getUsernameFromToken(token) || userProfile?.data?.username || null;
    }
    return userProfile?.data?.username || null;
  }, [userProfile]);

  // Get all items and filter for user's draft items
  const draftItems = useMemo(() => {
    if (!itemsResponse || !currentUsername) return [];
    const allItems = (
      itemsResponse.data ??
      itemsResponse.results?.data ??
      itemsResponse.items ??
      []
    );
    // Filter for current user's draft items
    return allItems.filter((item) => {
      const status = (item as MarketplaceItem & { status?: string }).status;
      const ownerUsername = (item.user_name as string | undefined) || (item.seller?.username as string | undefined);
      return status === "draft" && ownerUsername === currentUsername;
    });
  }, [itemsResponse, currentUsername]);

  useEffect(() => {
    if (selectedSubcategoryId) {
      setValue("sub_category", selectedSubcategoryId);
    }
  }, [selectedSubcategoryId, setValue]);

  const onSubmit = async (data: ServiceFormData) => {
    if (!data.image) {
      toast.error("Please upload an image");
      return;
    }

    if (!selectedSubcategoryId) {
      toast.error("Please select a subcategory");
      return;
    }

    try {
      await createProduct({
        name: data.name,
        image: data.image,
        status: "published",
        sub_category: selectedSubcategoryId,
        description: data.description,
        location: data.location,
        link: data.link,
      }).unwrap();

      toast.success("Service created successfully!");
      reset();
      setImagePreviews([]);
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
      refetchItems();
    } catch (error) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to create service";
      toast.error(errorMessage);
    }
  };

  const handleDraft = async () => {
    const data = watch();
    if (!data.image) {
      toast.error("Please upload an image");
      return;
    }

    if (!selectedSubcategoryId) {
      toast.error("Please select a subcategory");
      return;
    }

    try {
      await createProduct({
        name: data.name,
        image: data.image,
        status: "draft",
        sub_category: selectedSubcategoryId,
        description: data.description,
        location: data.location,
        link: data.link,
      }).unwrap();

      toast.success("Draft saved successfully!");
      reset();
      setImagePreviews([]);
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
      refetchItems();
    } catch (error) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to save draft";
      toast.error(errorMessage);
    }
  };

  const handlePublishDraft = async (item: MarketplaceItem) => {
    try {
      await patchProductStatus({
        id: item.id,
        status: "published",
      }).unwrap();
      toast.success("Service published successfully!");
      refetchItems();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to publish service";
      toast.error("Failed to publish service", { description: errorMessage });
    }
  };

  const handleEditClick = (item: MarketplaceItem) => {
    setServiceToEdit(item as MarketplaceItem & {
      status?: string;
      name?: string;
      user_name?: string;
      location?: string;
      description?: string;
    });
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (item: MarketplaceItem) => {
    setServiceToView(item as MarketplaceItem & {
      status?: string;
      name?: string;
      user_name?: string;
      location?: string;
      description?: string;
      link?: string;
    });
    setIsDetailsModalOpen(true);
  };

  const handleServiceUpdated = () => {
    refetchItems();
  };

  const handleDeleteClick = (item: MarketplaceItem) => {
    const serviceName = (item.name || item.title || "Service") as string;
    setServiceToDelete({ id: item.id, name: serviceName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteProduct(serviceToDelete.id).unwrap();
      toast.success("Service deleted successfully!");
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      refetchItems();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to delete";
      toast.error("Failed to delete service", { description: errorMessage });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      toast.error("Selected image is greater than 3MB");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreviews([previewUrl]);
    setValue("image", file);
  };

  const handleCategoryChange = (value: string) => {
    const categoryId = parseInt(value);
    setSelectedCategoryId(categoryId || null);
    setSelectedSubcategoryId(null);
    setValue("sub_category", 0);
  };

  const handleSubcategoryChange = (value: string) => {
    const subcategoryId = parseInt(value);
    setSelectedSubcategoryId(subcategoryId || null);
  };


  const watchFields = watch();
  const previewImage = imagePreviews[0] || null;

  // Check for payment success/cancel in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast.success("Payment successful! Your subscription has been activated.");
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast.error("Payment was canceled.");
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="text-white flex flex-col gap-6">
      {/* Subscription Usage Card */}
      <SubscriptionUsageCard
        onUpgrade={() => {
          // Only show modal if user has no remaining posts
          if (!usageData?.data?.can_post) {
            setIsSubscriptionModalOpen(true);
          }
        }}
      />

      {/* Form Section */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-6">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/3 backdrop-blur-[17px] rounded-2xl p-4 md:p-6 border border-white/20 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Promote Your Service
          </h2>

          <p className="text-sm mb-4 text-gray-300">Required</p>

          {/* Image Upload */}
          <div className="flex flex-wrap gap-4 mb-2">
            {imagePreviews[0] ? (
              <div className="w-40 h-32 rounded-md overflow-hidden border border-white/20 relative">
                <Image
                  src={imagePreviews[0]}
                  alt="preview"
                  width={160}
                  height={128}
                  className="object-cover w-full h-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreviews([]);
                    setValue("image", null);
                  }}
                  className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 text-xs"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 bg-black/30 border border-gray-400/40 rounded-md cursor-pointer hover:bg-black/40 transition">
                <FaUpload className="text-2xl text-gray-300 mb-2" />
                <span className="text-sm text-gray-300">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <input
              {...register("name", { required: true })}
              placeholder="Service Title"
              className={inputClass}
            />

            {/* Category Dropdown */}
            <Select
              value={selectedCategoryId?.toString() || ""}
              onValueChange={handleCategoryChange}
              required
            >
              <SelectTrigger className={selectClass}>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20 text-white">
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id.toString()}
                    className="focus:bg-purple-500/20 focus:text-white cursor-pointer"
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subcategory Dropdown */}
            <Select
              value={selectedSubcategoryId?.toString() || ""}
              onValueChange={handleSubcategoryChange}
              disabled={!selectedCategoryId || availableSubcategories.length === 0}
              required
            >
              <SelectTrigger className={selectClass} disabled={!selectedCategoryId || availableSubcategories.length === 0}>
                <SelectValue placeholder="Select Subcategory" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20 text-white">
                {availableSubcategories.map((subcategory) => (
                  <SelectItem
                    key={subcategory.id}
                    value={subcategory.id.toString()}
                    className="focus:bg-purple-500/20 focus:text-white cursor-pointer"
                  >
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <textarea
              {...register("description")}
              placeholder="Service Description"
              rows={4}
              className={inputClass}
            />
            <input
              {...register("location")}
              placeholder="Location (Optional)"
              className={inputClass}
            />
            <input
              {...register("link", { required: true })}
              type="url"
              placeholder="Platform Link (URL to your service platform) *"
              className={inputClass}
            />

            {/* Buttons */}
            <div className="flex justify-between mt-2">
              <button
                type="button"
                onClick={handleDraft}
                disabled={isCreating}
                className="w-32 bg-gray-400 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-black py-2 rounded-full font-semibold duration-300 transition-all cursor-pointer"
              >
                {isCreating ? "Saving..." : "Draft"}
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="w-32 bg-[#007406]  hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-full font-semibold duration-300 transition-all cursor-pointer"
              >
                {isCreating ? "Publishing..." : "Publish"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side - Preview */}
        <div className="w-full lg:w-2/3 backdrop-blur-[17px] rounded-2xl p-4 md:p-6 border border-white/20 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center">Preview</h2>

          {/* Preview Image */}
          <div className="w-full h-[500px] mb-6 rounded-lg overflow-hidden bg-black/30 border border-white/20">
            {previewImage ? (
              <Image
                src={previewImage}
                alt="Service preview"
                width={600}
                height={600}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>No image uploaded</span>
              </div>
            )}
          </div>

          {/* Preview Details */}
          <div className="space-y-3">
            <div className="flex justify-between mx-20 items-start">
              <h3 className="text-xl font-semibold">
                {watchFields.name || "Service Title"}
              </h3>
            </div>

            {selectedCategoryId && (
              <p className="text-sm text-gray-300">
                <span className="font-medium">Category:</span> {selectedCategory?.name}
              </p>
            )}

            {selectedSubcategoryId && (
              <p className="text-sm text-gray-300">
                <span className="font-medium">Subcategory:</span> {availableSubcategories.find(s => s.id === selectedSubcategoryId)?.name}
              </p>
            )}

            {watchFields.description && (
              <p className="text-sm text-gray-300">
                <span className="font-medium">Description:</span> {watchFields.description}
              </p>
            )}

            {watchFields.location && (
              <p className="text-sm text-gray-300">
                <span className="font-medium">Location:</span> {watchFields.location}
              </p>
            )}

            {watchFields.link && (
              <p className="text-sm text-gray-300">
                <span className="font-medium">Platform Link:</span> <a href={watchFields.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{watchFields.link}</a>
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Draft Items Section */}
      {draftItems.length > 0 && (
        <div className="w-full backdrop-blur-[17px] rounded-2xl p-4 md:p-6 border border-white/20 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">My Drafts</h2>
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            {draftItems.map((item) => (
              <div key={item.id} className="relative">
                <ProductCard
                  id={item.id}
                  title={(item.title || (item as { name?: string }).name) as string | undefined}
                  image={item.image || item.images?.[0]}
                  description={item.description}
                  location={item.location}
                  link={item.link}
                  seller={item.seller}
                  user_name={(item as { user_name?: string }).user_name}
                  isOwner={true}
                  onEdit={() => handleEditClick(item)}
                  onDelete={() => handleDeleteClick(item)}
                  onViewDetails={() => handleViewDetails(item)}
                />
                <div className="absolute top-2 left-2 flex gap-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePublishDraft(item);
                    }}
                    className="cursor-pointer flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all duration-300"
                  >
                    Publish
                  </button>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Edit Service Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setServiceToEdit(null);
        }}
        product={serviceToEdit}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setServiceToEdit(null);
          handleServiceUpdated();
        }}
      />

      {/* Service Details Modal */}
      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setServiceToView(null);
        }}
        product={serviceToView}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Service?"
        description={`Are you sure you want to delete "${serviceToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setServiceToDelete(null);
        }}
      />

      {/* Subscription Plans Modal */}
      <SubscriptionPlansModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onPaymentSuccess={async () => {
          // Refetch subscription usage and items after payment
          await Promise.all([refetchUsage(), refetchItems()]);
        }}
      />
    </div>
  );
}

