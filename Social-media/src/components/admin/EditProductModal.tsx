"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { 
  MarketplaceItem, 
  useUpdateProductMutation,
  useGetMarketplaceCategoriesQuery,
  MarketplaceCategory 
} from "@/store/marketplaceApi";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils";
import CustomDialog from "@/components/ui/CustomDialog";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: (MarketplaceItem & {
    status?: string;
    name?: string;
    user_name?: string;
    location?: string;
    description?: string;
  }) | null;
  onSuccess?: () => void;
}

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: EditProductModalProps) {
  const [updateProduct, { isLoading }] = useUpdateProductMutation();
  const { data: categoriesResponse } = useGetMarketplaceCategoriesQuery();
  
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [subCategory, setSubCategory] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all subcategories from all categories - memoized to prevent unnecessary re-renders
  const allSubcategories = useMemo(() => {
    const categories = categoriesResponse?.data || categoriesResponse?.results?.data || [];
    return categories.flatMap((cat: MarketplaceCategory) => 
      cat.subcategories.map((sub) => ({
        ...sub,
        categoryId: cat.id,
        categoryName: cat.name,
      }))
    );
  }, [categoriesResponse]);

  // Initialize form with product data - only when modal opens or product changes
  useEffect(() => {
    if (product && isOpen) {
      setName((product.name || product.title || "") as string);
      setStatus((product.status as "draft" | "published") || "published");
      setDescription((product.description as string) || "");
      setLocation((product.location as string) || "");
      setLink((product.link as string) || "");
      
      // Find subcategory ID from product data
      const subcategoryName = product.subcategory_name || product.sub_category_name;
      if (subcategoryName && allSubcategories.length > 0) {
        const foundSub = allSubcategories.find(
          (sub) => sub.name === subcategoryName
        );
        if (foundSub) {
          setSubCategory(foundSub.id);
        }
      }

      // Set image preview and store original image URL
      if (product.image) {
        const imageUrl = product.image.startsWith("http")
          ? product.image
          : `${getApiBaseUrl()}${product.image.startsWith("/") ? product.image.slice(1) : product.image}`;
        setImagePreview(imageUrl);
        setOriginalImageUrl(imageUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, isOpen, allSubcategories.length]); // Only re-initialize when product ID or modal state changes

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !product.id) {
      toast.error("Service ID is missing");
      return;
    }

    if (!name.trim()) {
      toast.error("Service name is required");
      return;
    }

    if (!link.trim()) {
      toast.error("Platform link is required");
      return;
    }

    if (!subCategory) {
      toast.error("Subcategory is required");
      return;
    }

    try {
      // If no new image is uploaded, fetch and convert the existing image to File
      let imageToSend: File;
      
      if (imageFile) {
        // Use the new uploaded image
        imageToSend = imageFile;
      } else if (originalImageUrl) {
        // Fetch the existing image and convert to File
        try {
          const response = await fetch(originalImageUrl);
          const blob = await response.blob();
          const fileName = originalImageUrl.split('/').pop() || `product-image-${product.id}.jpg`;
          imageToSend = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
        } catch {
          toast.error("Failed to load existing image. Please upload a new image.");
          return;
        }
      } else {
        toast.error("Service image is required");
        return;
      }

      const updateData: {
        id: number | string;
        name: string;
        status: "draft" | "published";
        sub_category: number;
        description?: string;
        location?: string;
        link: string;
        image: File;
      } = {
        id: product.id,
        name: name.trim(),
        status,
        sub_category: subCategory,
        link: link.trim(),
        image: imageToSend,
      };

      if (description.trim()) {
        updateData.description = description.trim();
      }

      if (location.trim()) {
        updateData.location = location.trim();
      }

      if (link.trim()) {
        updateData.link = link.trim();
      }

      await updateProduct(updateData).unwrap();
      toast.success("Service updated successfully!");
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to update service";
      toast.error("Failed to update service", { description: errorMessage });
    }
  };

  const handleClose = () => {
    setName("");
    setStatus("published");
    setDescription("");
    setLocation("");
    setLink("");
    setSubCategory(null);
    setImageFile(null);
    setImagePreview(null);
    setOriginalImageUrl(null);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title="Edit Service"
      maxWidth="4xl"
      maxHeight="80vh"
      contentClassName="overflow-y-auto custom-scroll"
    >
      <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Service Image - Full Width */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Service Image
              </label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={imagePreview}
                      alt="Product preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm cursor-pointer"
                >
                  {imagePreview ? "Change Image" : "Upload Image"}
                </button>
              </div>
            </div>

            {/* Two Column Grid for Main Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Service Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter service name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B83FA] text-white placeholder-white/40"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B83FA] text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Subcategory <span className="text-red-400">*</span>
                </label>
                <select
                  value={subCategory || ""}
                  onChange={(e) => setSubCategory(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B83FA] text-white"
                  required
                >
                  <option value="">Select subcategory</option>
                  {allSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.categoryName} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B83FA] text-white placeholder-white/40"
                />
              </div>

              {/* Platform Link */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Platform Link <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com/platform"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B83FA] text-white placeholder-white/40"
                  required
                />
              </div>
            </div>

            {/* Description - Full Width */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Description
              </label>
              <textarea
                value={description || ""}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter service description"
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B83FA] text-white placeholder-white/40 resize-y min-h-[120px] leading-relaxed"
              />
            </div>

            {/* BUTTONS - Full Width */}
            <div className="flex gap-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition cursor-pointer disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-[#6B83FA] hover:bg-[#5a70e8] text-white font-medium rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Service"}
              </button>
            </div>
          </div>
        </form>
    </CustomDialog>
  );
}

