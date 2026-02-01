"use client";
import Image from "next/image";
import { MarketplaceItem } from "@/store/marketplaceApi";
import { getApiBaseUrl } from "@/lib/utils";
import CustomDialog from "@/components/ui/CustomDialog";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: (MarketplaceItem & {
    status?: string;
    name?: string;
    user_name?: string;
    location?: string;
    description?: string;
    link?: string;
    category_name?: string;
    subcategory_name?: string;
    sub_category_name?: string;
  }) | null;
}

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product,
}: ProductDetailsModalProps) {
  if (!product) return null;

  const getImageUrl = (image: string | undefined) => {
    if (!image) return "/sheep.jpg";
    if (image.startsWith("http")) return image;
    const baseUrl = getApiBaseUrl();
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = image.startsWith("/") ? image.slice(1) : image;
    return `${cleanBase}/${cleanPath}`;
  };


  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const productName = (product.name || product.title || "N/A") as string;
  const sellerName = (product.user_name || product.seller?.username || product.seller?.display_name || "N/A") as string;
  const status = (product.status || "N/A") as string;

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Service Details"
      maxWidth="4xl"
      maxHeight="80vh"
      contentClassName="overflow-y-auto custom-scroll"
    >
      <div className="space-y-6">
          {/* Service Image */}
          <div className="relative w-full h-96 rounded-xl overflow-hidden border border-white/10">
            <Image
              src={getImageUrl(product.image || product.images?.[0])}
              alt={productName}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Service Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Service Name</h3>
                <p className="text-lg font-semibold text-white">{productName}</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Status</h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    status === "published"
                      ? "bg-green-500/20 text-green-300"
                      : "bg-gray-500/20 text-gray-300"
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Location</h3>
                <p className="text-lg font-medium text-white">{product.location || "N/A"}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Category</h3>
                <p className="text-lg font-medium text-white">
                  {product.category_name || "N/A"}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Subcategory</h3>
                <p className="text-lg font-medium text-white">
                  {product.subcategory_name || product.sub_category_name || "N/A"}
                </p>
              </div>

              

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-1">Seller</h3>
                <p className="text-lg font-medium text-white">{sellerName}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-2">Description</h3>
              <p className="text-white/80 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Platform Link */}
          {product.link && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-2">Platform Link</h3>
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
              >
                {product.link}
              </a>
              <div className="mt-3">
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Visit Platform
                </a>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">Service ID</h3>
              <p className="text-white/80">#{product.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">Created At</h3>
              <p className="text-white/80">{formatDate(product.created_at)}</p>
            </div>
            {product.updated_at && (
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-1">Last Updated</h3>
                <p className="text-white/80">{formatDate(product.updated_at)}</p>
              </div>
            )}
          </div>
        </div>
    </CustomDialog>
  );
}

