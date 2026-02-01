"use client";

import React, { useState, useMemo } from "react";
import { useGetAdminPaymentsQuery } from "@/store/dashboardApi";
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock, RefreshCw, User } from "lucide-react";
import { Payment } from "@/store/dashboardApi";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("");

  const { data, isLoading, isError, refetch } = useGetAdminPaymentsQuery({
    page,
    page_size: pageSize,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
    payment_type: paymentTypeFilter && paymentTypeFilter !== "all" ? paymentTypeFilter : undefined,
  });

  const payments = data?.data?.payments || [];
  const pagination = data?.data?.pagination;
  const summary = data?.data?.summary;

  const getStatusBadge = (status: string) => {
    const styles = {
      succeeded: "bg-green-500/20 text-green-400 border-green-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      failed: "bg-red-500/20 text-red-400 border-red-500/30",
      refunded: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };

    const icons = {
      succeeded: <CheckCircle className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
      refunded: <RefreshCw className="w-4 h-4" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending
          }`}
      >
        {icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Define table columns
  const columns: Column<Payment>[] = useMemo(
    () => [
      {
        header: "User",
        accessor: (payment) => (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 flex-shrink-0 flex items-center justify-center">
              {payment.user.avatar ? (
                <img
                  src={payment.user.avatar}
                  alt={payment.user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white/40" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{payment.user.username}</p>
              <p className="text-xs text-white/60">{payment.user.email}</p>
            </div>
          </div>
        ),
      },

      {
        header: "Plan",
        accessor: (payment) =>
          payment.subscription?.plan ? (
            <span className="text-sm text-white/80">{payment.subscription.plan.display_name}</span>
          ) : (
            <span className="text-sm text-white/40">N/A</span>
          ),
      },
      {
        header: "Amount",
        accessor: (payment) => (
          <span className="text-sm font-semibold text-white">{formatAmount(payment.amount)}</span>
        ),
      },
      {
        header: "Status",
        accessor: (payment) => getStatusBadge(payment.status),
      },
      {
        header: "Date",
        accessor: (payment) => <span className="text-sm text-white/80">{formatDate(payment.created_at)}</span>,
      },
    ],
    []
  );

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
      <Select
        value={statusFilter}
        onValueChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-[180px] bg-white/5 border-white/20 text-white">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="succeeded">Succeeded</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={paymentTypeFilter}
        onValueChange={(value) => {
          setPaymentTypeFilter(value);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-[180px] bg-white/5 border-white/20 text-white">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="subscription">Subscription</SelectItem>
          <SelectItem value="one_time">One Time Post</SelectItem>
        </SelectContent>
      </Select>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  {formatAmount(summary.total_revenue.toString())}
                </p>
              </div>
            </div>
          </div>
          <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Total Payments</p>
                <p className="text-2xl font-bold text-white">{summary.total_payments}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <CustomTable
        columns={columns}
        data={payments}
        title="Payment Management"
        description="View and track all payment transactions"
        filters={filters}
        emptyMessage="No payments found"
        emptyIcon={
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-white/40" />
          </div>
        }
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load payments. Please try again."
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
    </div>
  );
}