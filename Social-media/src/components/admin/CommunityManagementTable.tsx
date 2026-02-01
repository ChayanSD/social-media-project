"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useGetCommunitiesQuery, useDeleteCommunityMutation } from "@/store/authApi";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { TableFilters } from "@/components/admin/TableFilters";
import { DateFilter, DateRangePreset, DateRange } from "@/components/admin/DateFilter";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { getApiBaseUrl } from "@/lib/utils";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { CommunityItem } from "@/store/communityApi";

export default function CommunityManagementTable() {
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { data, isLoading, isError, refetch } = useGetCommunitiesQuery({
    visibility: visibilityFilter === "all" ? undefined : visibilityFilter,
    start_date: dateRange?.start_date,
    end_date: dateRange?.end_date,
    search: searchQuery.trim() || undefined,
  });
  const [deleteCommunity] = useDeleteCommunityMutation();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityItem | null>(null);

  const communities = useMemo(() => {
    if (!data) return [];
    return (data.data as CommunityItem[]) ?? [];
  }, [data]);

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

  const getImageUrl = (image: string | undefined | null) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    const baseUrl = getApiBaseUrl();
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = image.startsWith("/") ? image.slice(1) : image;
    return `${cleanBase}/${cleanPath}`;
  };

  const handleDeleteCommunity = async () => {
    if (!selectedCommunity?.id) return;
    try {
      const result = await deleteCommunity({ communityId: selectedCommunity.id }).unwrap();
      if (result.success) {
        toast.success(result.message || "Community deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedCommunity(null);
        refetch();
      }
    } catch (error: unknown) {
      const errorMessage = 
        (error as { data?: { error?: string } })?.data?.error ||
        (error as { message?: string })?.message ||
        "Failed to delete community";
      toast.error(errorMessage);
    }
  };

  type CommunityRow = CommunityItem;

  const columns: Column<CommunityRow>[] = [
    {
      header: "SL",
      accessor: (_row, index) => <span>{index + 1}.</span>,
    },
    {
      header: "Profile Image",
      accessor: (row) => {
        const imageUrl = getImageUrl(row.profile_image);
        return (
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-slate-800 flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={row.title || row.name || "Community"}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                {(row.title || row.name || "C").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Name",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.name || "N/A"}>
          {row.name || "N/A"}
        </div>
      ),
    },
    {
      header: "Title",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.title || "N/A"}>
          {row.title || "N/A"}
        </div>
      ),
    },
    {
      header: "Description",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.description || "N/A"}>
          {row.description || "N/A"}
        </div>
      ),
    },
    {
      header: "Visibility",
      accessor: (row) => {
        const visibility = row.visibility || "public";
        const getVisibilityStyles = (vis: string) => {
          switch (vis.toLowerCase()) {
            case "private":
              return "bg-red-500/20 text-red-300";
            case "restricted":
              return "bg-orange-500/20 text-orange-300";
            case "public":
              return "bg-green-500/20 text-green-300";
            default:
              return "bg-blue-500/20 text-blue-300";
          }
        };
        return (
          <span className={`capitalize px-3 py-1 rounded-full text-xs font-medium ${getVisibilityStyles(visibility)}`}>
            {visibility}
          </span>
        );
      },
    },
    {
      header: "Members",
      accessor: (row) => <span>{row.members_count ?? 0}</span>,
    },
    {
      header: "Posts",
      accessor: (row) => <span>{row.posts_count ?? 0}</span>,
    },
    {
      header: "Created By",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.created_by_username || "N/A"}>
          {row.created_by_username || "N/A"}
        </div>
      ),
    },
    {
      header: "Created At",
      accessor: (row) => <span>{formatDate(row.created_at)}</span>,
    },
    {
      header: "Actions",
      accessor: (row) => {
        return (
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCommunity(row);
                setDeleteDialogOpen(true);
              }}
              className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="Delete Community"
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
        );
      },
    },
  ];

  const visibilityFilterOptions = [
    { value: "all", label: "All" },
    { value: "public", label: "Public" },
    { value: "restricted", label: "Restricted" },
    { value: "private", label: "Private" },
  ];

  return (
    <>
      <CustomTable
        title="All Communities"
        description="Manage and view all communities in the platform"
        isLoading={isLoading}
        filters={
          <>
            <TableFilters
              filters={[
                {
                  type: "select",
                  key: "visibility",
                  label: "Visibility",
                  options: visibilityFilterOptions,
                  value: visibilityFilter,
                  onChange: (value) => {
                    setVisibilityFilter(value);
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
              placeholder="Search by name, title, or creator..."
              label="Search"
            />
          </>
        }
        columns={columns}
        data={communities}
        emptyMessage="No communities found"
        isError={isError}
        errorMessage="Failed to load communities. Please try again later"
      />
      
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Community?"
        description={`Are you sure you want to delete the community "${selectedCommunity?.title || selectedCommunity?.name}"? This action cannot be undone and will delete all associated data.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteCommunity}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedCommunity(null);
        }}
      />
    </>
  );
}

