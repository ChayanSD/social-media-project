"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useGetUsersQuery, User, useAdminBlockUserMutation, useAdminUnblockUserMutation, useAdminDeleteUserMutation } from "@/store/authApi";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { TableFilters } from "@/components/admin/TableFilters";
import { DateFilter, DateRangePreset, DateRange } from "@/components/admin/DateFilter";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { getApiBaseUrl } from "@/lib/utils";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Ban, UserCheck, User as UserIcon } from "lucide-react";

export default function UserManagementTable() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data, isLoading, isError } = useGetUsersQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    start_date: dateRange?.start_date,
    end_date: dateRange?.end_date,
    search: searchQuery.trim() || undefined,
  });
  const [blockUser] = useAdminBlockUserMutation();
  const [unblockUser] = useAdminUnblockUserMutation();
  const [deleteUser] = useAdminDeleteUserMutation();

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const users = useMemo(() => {
    if (!data) return [];
    return (
      data.data ??
      data.results?.data ??
      data.users ??
      []
    );
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


  const getAvatarUrl = (avatar?: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith("http")) return avatar;
    const baseUrl = getApiBaseUrl();
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = avatar.startsWith("/") ? avatar.slice(1) : avatar;
    return `${cleanBase}/${cleanPath}`;
  };

  const handleBlockUser = async () => {
    if (!selectedUser?.id) return;
    try {
      const result = await blockUser({ userId: selectedUser.id }).unwrap();
      if (result.success) {
        toast.success(result.message || "User blocked successfully");
        setBlockDialogOpen(false);
        setSelectedUser(null);
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { message?: string })?.message ||
        "Failed to block user";
      toast.error(errorMessage);
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedUser?.id) return;
    try {
      const result = await unblockUser({ userId: selectedUser.id }).unwrap();
      if (result.success) {
        toast.success(result.message || "User unblocked successfully");
        setUnblockDialogOpen(false);
        setSelectedUser(null);
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { message?: string })?.message ||
        "Failed to unblock user";
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?.id) return;
    try {
      const result = await deleteUser({ userId: selectedUser.id }).unwrap();
      if (result.success) {
        toast.success(result.message || "User deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { message?: string })?.message ||
        "Failed to delete user";
      toast.error(errorMessage);
    }
  };

  type UserRow = User;

  const columns: Column<UserRow>[] = [
    {
      header: "SL",
      accessor: (_row, index) => <span>{index + 1}.</span>,
    },
    {
      header: "Avatar",
      accessor: (row) => {
        const avatarUrl = getAvatarUrl((row as { avatar?: string | null }).avatar);
        return (
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 bg-slate-800 flex items-center justify-center">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={row.display_name || row.username || "User"}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <UserIcon className="w-5 h-5 text-white/40" />
            )}
          </div>
        );
      },
    },
    {
      header: "Username",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.username || "N/A"}>
          {row.username || "N/A"}
        </div>
      ),
    },
    {
      header: "Display Name",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.display_name || row.username || "N/A"}>
          {row.display_name || row.username || "N/A"}
        </div>
      ),
    },
    {
      header: "Email",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.email || "N/A"}>
          {row.email || "N/A"}
        </div>
      ),
    },
    {
      header: "Role",
      accessor: (row) => (
        <span className="capitalize">{row.role || "User"}</span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => {
        const isActive = row.is_active !== false; // Default to true if not specified
        return (
          <div className="flex items-center justify-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${isActive
                ? "bg-green-500/20 text-green-300"
                : "bg-red-500/20 text-red-300"
                }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
      className: "text-center",
    },
    {
      header: "Date Joined",
      accessor: (row) => <span>{formatDate((row as { date_joined?: string }).date_joined)}</span>,
    },
    {
      header: "Posts",
      accessor: (row) => <span>{(row as { posts_count?: number }).posts_count ?? 0}</span>,
    },
    {
      header: "Interests",
      accessor: (row) => {
        const interests = (row as { interests?: Record<string, Array<{ id: number; name: string }>> }).interests;

        if (!interests || Object.keys(interests).length === 0) {
          return <span className="text-white/60">No interests</span>;
        }

        // Color palette for different categories
        const categoryColors = [
          { bg: "bg-blue-500/20", text: "text-blue-300" },
          { bg: "bg-purple-500/20", text: "text-purple-300" },
          { bg: "bg-yellow-500/20", text: "text-yellow-300" },
          { bg: "bg-pink-500/20", text: "text-pink-300" },
          { bg: "bg-red-500/20", text: "text-red-300" },
          { bg: "bg-indigo-500/20", text: "text-indigo-300" },
          { bg: "bg-orange-500/20", text: "text-orange-300" },
          { bg: "bg-teal-500/20", text: "text-teal-300" },
          { bg: "bg-cyan-500/20", text: "text-cyan-300" },
          { bg: "bg-green-500/20", text: "text-green-300" },
        ];

        // Create array of interests with their category and color
        const interestsWithCategory: Array<{
          id: number;
          name: string;
          category: string;
          colorIndex: number;
        }> = [];

        const categoryNames = Object.keys(interests);
        categoryNames.forEach((categoryName, categoryIdx) => {
          const categoryInterests = interests[categoryName];
          const colorIndex = categoryIdx % categoryColors.length;
          categoryInterests.forEach((interest) => {
            interestsWithCategory.push({
              ...interest,
              category: categoryName,
              colorIndex,
            });
          });
        });

        if (interestsWithCategory.length === 0) {
          return <span className="text-white/60">No interests</span>;
        }

        return (
          <div className="max-w-xs">
            <div className="grid grid-cols-3 gap-1">
              {interestsWithCategory.map((interest, idx) => {
                const color = categoryColors[interest.colorIndex];
                return (
                  <span
                    key={interest.id || idx}
                    className={`px-2 py-0.5 ${color.bg} ${color.text} rounded text-xs truncate`}
                    title={`${interest.category}: ${interest.name}`}
                  >
                    {interest.name}
                  </span>
                );
              })}
            </div>
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessor: (row) => {
        const isActive = row.is_active !== false;
        const isAdmin = row.role === 'admin';

        return (
          <div className="flex items-center justify-center space-x-3">
            {isActive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser(row);
                  setBlockDialogOpen(true);
                }}
                disabled={isAdmin}
                className={`p-2 rounded-lg bg-white/10 hover:bg-white/20 transition ${isAdmin
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
                  }`}
                title={isAdmin ? "Cannot block admin users" : "Block User"}
              >
                <Ban className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser(row);
                  setUnblockDialogOpen(true);
                }}
                className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition"
                title="Unblock User"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(row);
                setDeleteDialogOpen(true);
              }}
              disabled={isAdmin}
              className={`p-2 rounded-lg bg-white/10 hover:bg-white/20 transition ${isAdmin
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
                }`}
              title={isAdmin ? "Cannot delete admin users" : "Delete User"}
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
      className: "text-center",
    },
  ];

  const statusFilterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <div>
      <CustomTable
        title="All Users"
        description="Manage and view all registered users in the system"
        isLoading={isLoading}
        filters={
          <>

            <TableFilters
              filters={[
                {
                  type: "select",
                  key: "status",
                  label: "Status",
                  options: statusFilterOptions,
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
              placeholder="Search by name or email..."
              label="Search"
            />
          </>
        }
        columns={columns}
        data={users}
        emptyMessage="No users found"
        isError={isError}
        errorMessage="Failed to load users. Please try again later"
      />

      {/* Block User Confirmation Dialog */}
      <ConfirmDialog
        open={blockDialogOpen}
        title="Block User"
        description={`Are you sure you want to block ${selectedUser?.username || "this user"}? They will not be able to access the platform.`}
        confirmLabel="Block User"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleBlockUser}
        onCancel={() => {
          setBlockDialogOpen(false);
          setSelectedUser(null);
        }}
      />

      {/* Unblock User Confirmation Dialog */}
      <ConfirmDialog
        open={unblockDialogOpen}
        title="Unblock User"
        description={`Are you sure you want to unblock ${selectedUser?.username || "this user"}? They will be able to access the platform again.`}
        confirmLabel="Unblock User"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleUnblockUser}
        onCancel={() => {
          setUnblockDialogOpen(false);
          setSelectedUser(null);
        }}
      />

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to permanently delete ${selectedUser?.username || "this user"}? This action cannot be undone and will delete all associated data.`}
        confirmLabel="Delete User"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteUser}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}

