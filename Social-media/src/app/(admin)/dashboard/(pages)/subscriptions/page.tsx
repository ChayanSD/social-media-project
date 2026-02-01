"use client";

import React, { useState, useMemo } from "react";
import {
    useGetAdminSubscriptionsQuery,
    useCancelAdminSubscriptionMutation,
    useUncancelAdminSubscriptionMutation,
    useDeleteAdminSubscriptionMutation,
    UserSubscription
} from "@/store/dashboardApi";
import { Users, User, DollarSign, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Ban, UserCheck, RotateCcw } from "lucide-react";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function SubscriptionsPage() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [uncancelDialogOpen, setUncancelDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);

    const { data, isLoading, isError, refetch } = useGetAdminSubscriptionsQuery({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
    });

    const subscriptions = data?.data?.subscriptions || [];
    const pagination = data?.data?.pagination;
    const summary = data?.data?.summary;

    const [cancelSubscription, { isLoading: isCanceling }] = useCancelAdminSubscriptionMutation();
    const [uncancelSubscription, { isLoading: isUncanceling }] = useUncancelAdminSubscriptionMutation();
    const [deleteSubscription, { isLoading: isDeleting }] = useDeleteAdminSubscriptionMutation();

    const handleCancelClick = (subscription: UserSubscription) => {
        setSelectedSubscription(subscription);
        setCancelDialogOpen(true);
    };

    const handleUncancelClick = (subscription: UserSubscription) => {
        setSelectedSubscription(subscription);
        setUncancelDialogOpen(true);
    };

    const handleDeleteClick = (subscription: UserSubscription) => {
        setSelectedSubscription(subscription);
        setDeleteDialogOpen(true);
    };

    const handleCancelConfirm = async () => {
        if (!selectedSubscription) return;

        try {
            const result = await cancelSubscription({ subscription_id: selectedSubscription.id }).unwrap();
            toast.success(result.message || "Subscription canceled successfully");
            setCancelDialogOpen(false);
            setSelectedSubscription(null);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to cancel subscription");
        }
    };

    const handleUncancelConfirm = async () => {
        if (!selectedSubscription || !selectedSubscription.plan) return;

        try {
            const result = await uncancelSubscription({
                subscription_id: selectedSubscription.id,
                plan_id: selectedSubscription.plan.id
            }).unwrap();
            toast.success(result.message || "Subscription restored successfully");
            setUncancelDialogOpen(false);
            setSelectedSubscription(null);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to restore subscription");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedSubscription) return;

        try {
            const result = await deleteSubscription({
                subscription_id: selectedSubscription.id,
                permanent_delete: true
            }).unwrap();
            toast.success(result.message || "Subscription deleted successfully");
            setDeleteDialogOpen(false);
            setSelectedSubscription(null);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete subscription");
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            active: "bg-green-500/20 text-green-400 border-green-500/30",
            canceled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
            past_due: "bg-red-500/20 text-red-400 border-red-500/30",
            trialing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            incomplete: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        };

        const icons = {
            active: <CheckCircle className="w-4 h-4" />,
            canceled: <XCircle className="w-4 h-4" />,
            past_due: <AlertCircle className="w-4 h-4" />,
            trialing: <Clock className="w-4 h-4" />,
            incomplete: <Clock className="w-4 h-4" />,
            completed: <CheckCircle className="w-4 h-4" />,
        };

        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.incomplete
                    }`}
            >
                {icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />}
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </span>
        );
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getRemainingPosts = (subscription: UserSubscription) => {
        if (!subscription.plan) {
            return `${subscription.posts_used_this_month}/1`;
        }
        if (subscription.plan.posts_per_month === 0) {
            return `${subscription.posts_used_this_month}/∞`;
        }
        return `${subscription.posts_used_this_month}/${subscription.plan.posts_per_month}`;
    };

    // Define table columns
    const columns: Column<UserSubscription>[] = useMemo(() => [
        {
            header: "User",
            accessor: (subscription) => (
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 flex-shrink-0 flex items-center justify-center">
                        {subscription.user.avatar ? (
                            <img
                                src={subscription.user.avatar}
                                alt={subscription.user.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-5 h-5 text-white/40" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">{subscription.user.username}</p>
                        <p className="text-xs text-white/60">{subscription.user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Plan",
            accessor: (subscription) => (
                subscription.plan ? (
                    <div>
                        <p className="text-sm font-medium text-white">{subscription.plan.display_name}</p>
                        <p className="text-xs text-white/60">${subscription.plan.price}/month</p>
                    </div>
                ) : (
                    <span className="text-sm text-white/40">Free Plan</span>
                )
            ),
        },
        {
            header: "Status",
            accessor: (subscription) => getStatusBadge(subscription.status),
        },
        {
            header: "Posts Used",
            accessor: (subscription) => (
                <span className="text-sm text-white/80">{getRemainingPosts(subscription)}</span>
            ),
        },
        {
            header: "Created",
            accessor: (subscription) => (
                <span className="text-sm text-white/80">{formatDate(subscription.created_at)}</span>
            ),
        },
        {
            header: "Actions",
            accessor: (subscription) => (
                <div className="flex items-center gap-2">
                    {subscription.status === 'active' && subscription.plan ? (
                        <button
                            onClick={() => handleCancelClick(subscription)}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                            title="Cancel Subscription"
                        >
                            <Ban className="w-4 h-4" />
                        </button>
                    ) : subscription.status === 'canceled' ? (
                        <button
                            onClick={() => handleUncancelClick(subscription)}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                            title="Restore Subscription"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    ) : null}

                    <button
                        onClick={() => handleDeleteClick(subscription)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                        title="Delete Record"
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
        },
    ], []);

    // Server pagination handlers
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleLimitChange = (newLimit: number) => {
        setPageSize(newLimit);
        setPage(1);
    };

    const handlePreviousPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (pagination && page < pagination.total_pages) {
            setPage(page + 1);
        }
    };

    const getPageNumbers = () => {
        if (!pagination) return [];

        const pages: (number | string)[] = [];
        const maxVisible = 5;
        const totalPages = pagination.total_pages;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (page <= 3) {
                for (let i = 2; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages);
            } else if (page >= totalPages - 2) {
                pages.push("...");
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push("...");
                for (let i = page - 1; i <= page + 1; i++) {
                    pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages);
            }
        }

        return pages;
    };

    // Filters component
    const filters = (
        <>
            <select
                value={statusFilter}
                onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                }}
                className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past Due</option>
                <option value="trialing">Trialing</option>
                <option value="incomplete">Incomplete</option>
            </select>
            <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
            >
                <RefreshCw className="w-4 h-4" />
                Refresh
            </button>
        </>
    );

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-blue-500/20">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-white/60">Total Subscriptions</p>
                                <p className="text-2xl font-bold text-white">{summary.total_subscriptions}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-green-500/20">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-white/60">Active Subscriptions</p>
                                <p className="text-2xl font-bold text-white">{summary.active_subscriptions}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-purple-500/20">
                                <DollarSign className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-white/60">Monthly Recurring Revenue</p>
                                <p className="text-2xl font-bold text-white">${summary.monthly_recurring_revenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Subscriptions Table */}
            <CustomTable
                columns={columns}
                data={subscriptions}
                title="Subscription Management"
                description="View and track all user subscriptions"
                filters={filters}
                emptyMessage="No subscriptions found"
                emptyIcon={
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <Users className="w-8 h-8 text-white/40" />
                    </div>
                }
                isLoading={isLoading}
                isError={isError}
                errorMessage="Failed to load subscriptions. Please try again."
                serverPagination={
                    pagination
                        ? {
                            totalCount: pagination.total_count,
                            currentPage: page,
                            pageSize: pageSize,
                            hasNext: page < pagination.total_pages,
                            hasPrevious: page > 1,
                            onPageChange: handlePageChange,
                            onLimitChange: handleLimitChange,
                            getPageNumbers,
                            handlePreviousPage,
                            handleNextPage,
                        }
                        : undefined
                }
            />

            {/* Cancel Confirmation Dialog */}
            <ConfirmDialog
                open={cancelDialogOpen}
                title="Cancel Subscription?"
                description={
                    selectedSubscription
                        ? `Are you sure you want to cancel the subscription for ${selectedSubscription.user.username}? This will immediately revoke their posting privileges and set their limit to the free tier (1 post/month).`
                        : ""
                }
                confirmLabel={isCanceling ? "Canceling..." : "Cancel Subscription"}
                cancelLabel="Keep Subscription"
                variant="destructive"
                onConfirm={handleCancelConfirm}
                onCancel={() => {
                    setCancelDialogOpen(false);
                    setSelectedSubscription(null);
                }}
            />

            {/* Uncancel Confirmation Dialog */}
            <ConfirmDialog
                open={uncancelDialogOpen}
                title="Restore Subscription?"
                description={
                    selectedSubscription
                        ? `Are you sure you want to restore the subscription for ${selectedSubscription.user.username}? This will reactivate their plan and restore their posting privileges.`
                        : ""
                }
                confirmLabel={isUncanceling ? "Restoring..." : "Restore Subscription"}
                cancelLabel="Cancel"
                variant="default"
                onConfirm={handleUncancelConfirm}
                onCancel={() => {
                    setUncancelDialogOpen(false);
                    setSelectedSubscription(null);
                }}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                title="Permanently Delete Subscription?"
                description={
                    selectedSubscription
                        ? `⚠️ WARNING: This will PERMANENTLY delete the subscription record for ${selectedSubscription.user.username}. This action cannot be undone. The user will lose all subscription history.`
                        : ""
                }
                confirmLabel={isDeleting ? "Deleting..." : "Permanently Delete"}
                cancelLabel="Cancel"
                variant="destructive"
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setDeleteDialogOpen(false);
                    setSelectedSubscription(null);
                }}
            />
        </div>
    );
}
