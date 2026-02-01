"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useGetProductsQuery, useDeleteProductMutation, MarketplaceItem } from "@/store/marketplaceApi";
import { getApiBaseUrl } from "@/lib/utils";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { TableFilters } from "@/components/admin/TableFilters";
import { DateFilter, DateRangePreset, DateRange } from "@/components/admin/DateFilter";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import ProductDetailsModal from "@/components/admin/ProductDetailsModal";
import EditProductModal from "@/components/admin/EditProductModal";

export default function AllProductsTable() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { data, isLoading, isError, refetch } = useGetProductsQuery({
    start_date: dateRange?.start_date,
    end_date: dateRange?.end_date,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery.trim() || undefined,
  });
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: number | string;
    name: string;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{
    status?: string;
    name?: string;
    user_name?: string;
    location?: string;
  } & MarketplaceItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<{
    status?: string;
    name?: string;
    user_name?: string;
    location?: string;
  } & MarketplaceItem | null>(null);

  // Extract products from different possible response structures
  const products = useMemo(() => {
    const allProducts = data?.data || data?.results?.data || data?.items || data?.products || [];
    return Array.isArray(allProducts) ? allProducts : [];
  }, [data]);

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
      const day = date.getDate();
      const month = date.toLocaleDateString("en-GB", { month: "short" });
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch {
      return "N/A";
    }
  };

  // Define table columns - matching actual API response structure
  type ProductRow = MarketplaceItem & {
    status?: string;
    name?: string;
    user_name?: string;
    location?: string;
  };

  const columns: Column<ProductRow>[] = [
    {
      header: "SL",
      accessor: (row, index) => <span>{index + 1}.</span>,
    },
    {
      header: "Image",
      accessor: (row) => (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
          <Image
            src={getImageUrl(row.image || row.images?.[0])}
            alt={(row.name || row.title || "Service") as string}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ),
    },
    {
      header: "Service Name",
      accessor: (row) => {
        const productName = (row.name || row.title || "N/A") as string;
        return (
          <div className="max-w-xs truncate" title={productName}>
            {productName}
          </div>
        );
      },
    },
    {
      header: "Platform Link",
      accessor: (row) => (
        <span className="max-w-xs truncate" title={row.link}>
          {row.link ? (
            <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              {row.link.length > 30 ? `${row.link.substring(0, 30)}...` : row.link}
            </a>
          ) : (
            "N/A"
          )}
        </span>
      ),
    },
    {
      header: "Category",
      accessor: (row) => (
        <span>
          {row.category_name || row.subcategory_name || row.sub_category_name || "N/A"}
        </span>
      ),
    },
    {
      header: "Location",
      accessor: (row) => (
        <span className="max-w-xs truncate" title={row.location}>
          {row.location || "N/A"}
        </span>
      ),
    },
    {
      header: "Seller",
      accessor: (row) => {
        const sellerName = (row.user_name || row.seller?.username || row.seller?.display_name || "N/A") as string;
        return <span>{sellerName}</span>;
      },
    },
    {
      header: "Date",
      accessor: (row) => <span>{formatDate(row.created_at)}</span>,
    },
    {
      header: "Status",
      accessor: (row) => {
        const status = (row.status || "N/A") as string;
        let badgeClass = "";
        switch (status) {
          case "published":
            badgeClass = "bg-green-500/20 text-green-300";
            break;
          case "draft":
            badgeClass = "bg-yellow-500/20 text-yellow-300";
            break;
          case "sold":
            badgeClass = "bg-blue-500/20 text-blue-300";
            break;
          case "unpublished":
            badgeClass = "bg-red-500/20 text-red-300";
            break;
          default:
            badgeClass = "bg-gray-500/20 text-gray-300";
            break;
        }
        return (
          <div className="flex items-center justify-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${badgeClass}`}
            >
              {status}
            </span>
          </div>
        );
      },
      className: "text-center",
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProductToEdit(row);
              setIsEditModalOpen(true);
            }}
            className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition"
            title="Edit service"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M21.7 7.3l-5-5c-.4-.4-1-.4-1.4 0l-12 12c-.1.1-.2.3-.2.4l-1 6c-.1.5.4 1 .9.9l6-1c.1 0 .3-.1.4-.2l12-12c.4-.4.4-1 0-1.4zM7.6 19.2l-3.5.6.6-3.5L14 6l2.9 2.9-9.3 9.3z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const productName = (row.name || row.title || "Service") as string;
              handleDeleteClick(row.id, productName);
            }}
            className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition"
            title="Delete service"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      ),
      className: "text-center",
    },
  ];

  const handleDeleteClick = (id: number | string, name: string) => {
    setProductToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete.id).unwrap();
      toast.success("Service deleted successfully!");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to delete";
      toast.error("Failed to delete", { description: errorMessage });
    }
  };

  const handleRowClick = (product: ProductRow) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  const handleProductUpdated = () => {
    // Refetch products after update
    refetch();
  };

  return (
    <>
      <div>
        <CustomTable
          title="All Services"
          description="View and manage all services in the marketplace"
          columns={columns}
          data={products}
          isLoading={isLoading}
          filters={
            <>
              <TableFilters
                filters={[
                  {
                    type: "select",
                    key: "status",
                    label: "Status",
                    options: [
                      { label: "All", value: "all" },
                      { label: "Published", value: "published" },
                      { label: "Draft", value: "draft" },
                      
                    ],
                    value: statusFilter,
                    onChange: (value) => {
                      setStatusFilter(value);
                    },
                  },
                ]}
              />
              <DateFilter
                value={datePreset}
                dateRange={dateRange}
                onChange={(preset, range) => {
                  setDatePreset(preset);
                  setDateRange(range);
                }}
                label="Date"
              />
              <SearchFilter
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name or description..."
                label="Search"
              />
            </>
          }
          emptyMessage="No services found"
          isError={isError}
          errorMessage="Failed to load services. Please try again later"
          onRowClick={handleRowClick}
        />
      </div>

      {/* SERVICE DETAILS MODAL */}
      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      {/* EDIT SERVICE MODAL */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setProductToEdit(null);
        }}
        product={productToEdit}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setProductToEdit(null);
          handleProductUpdated();
        }}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Service?"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
      />
    </>
  );
}

