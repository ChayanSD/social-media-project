"use client";
import { useMemo, useState } from "react";
import { useGetUnifiedReportsQuery, useReviewUnifiedReportMutation, useDeleteUnifiedReportMutation, useBlockUserGlobalMutation, useBlockUserLocalMutation, useUnblockUserGlobalMutation, useUnblockUserLocalMutation, UnifiedReportItem, useGetAdminChatHistoryQuery, useDeletePostAsAdminMutation, useGetPostByIdQuery } from "@/store/postApi";
import { CustomTable, Column } from "@/components/admin/CustomTable";
import { TableFilters } from "@/components/admin/TableFilters";
import { DateFilter, DateRangePreset, DateRange } from "@/components/admin/DateFilter";
import { SearchFilter } from "@/components/admin/SearchFilter";
import { CheckCircle2, XCircle, Clock, FileText, User, ShieldAlert, UserX, UserMinus } from "lucide-react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ConfirmDialog";
import Image from "next/image";

export default function ReportedPostsTable() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data, isLoading, isError, refetch } = useGetUnifiedReportsQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    start_date: dateRange?.start_date,
    end_date: dateRange?.end_date,
    search: searchQuery.trim() || undefined,
  });
  const [reviewReport, { isLoading: isReviewing }] = useReviewUnifiedReportMutation();
  const [deleteReport] = useDeleteUnifiedReportMutation();
  const [blockGlobal, { isLoading: isBlockingGlobal }] = useBlockUserGlobalMutation();
  const [blockLocal, { isLoading: isBlockingLocal }] = useBlockUserLocalMutation();
  const [unblockGlobal, { isLoading: isUnblockingGlobal }] = useUnblockUserGlobalMutation();
  const [unblockLocal, { isLoading: isUnblockingLocal }] = useUnblockUserLocalMutation();

  const reports = useMemo((): UnifiedReportItem[] => {
    if (!data) return [];

    // Handle different response structures
    if (data.results) {
      if (typeof data.results === 'object' && !Array.isArray(data.results)) {
        if (data.results.data && Array.isArray(data.results.data)) {
          return data.results.data;
        }
      }
      if (Array.isArray(data.results)) {
        return data.results;
      }
    }

    if (Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  }, [data]);

  const [selectedReportId, setSelectedReportId] = useState<number | string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<'post' | 'user' | null>(null);

  const selectedReport = useMemo(() => {
    if (!selectedReportId || !selectedReportType) return null;
    return reports.find(r => r.id === selectedReportId && r.report_type === selectedReportType) || null;
  }, [reports, selectedReportId, selectedReportType]);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: number | string;
    type: 'post' | 'user';
    title: string;
  } | null>(null);
  const [showPostContent, setShowPostContent] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);

  const [deletePost, { isLoading: isDeletingPost }] = useDeletePostAsAdminMutation();

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

  const getStatusBadge = (status: string | undefined) => {
    const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-300",
        icon: <Clock className="w-3 h-3" />
      },
      resolved: {
        bg: "bg-green-500/20",
        text: "text-green-300",
        icon: <CheckCircle2 className="w-3 h-3" />
      },
      dismissed: {
        bg: "bg-gray-500/20",
        text: "text-gray-300",
        icon: <XCircle className="w-3 h-3" />
      },
    };

    const statusKey = (status || "pending").toLowerCase();
    const colors = statusColors[statusKey] || statusColors.pending;

    return (
      <div className="flex items-center justify-center gap-1.5">
        {colors.icon}
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
          {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
        </span>
      </div>
    );
  };

  const getReasonLabel = (reason: string | undefined) => {
    const reasonLabels: Record<string, string> = {
      spam: "Spam",
      harassment: "Harassment",
      hate_speech: "Hate Speech",
      violence: "Violence",
      misinformation: "Misinformation",
      copyright: "Copyright",
      inappropriate_content: "Inappropriate Content",
      fake_account: "Fake Account",
      other: "Other",
    };
    return reasonLabels[reason || "other"] || "Other";
  };

  const handleReview = async (reportId: number | string, reportType: 'post' | 'user', status: 'resolved' | 'dismissed') => {
    try {
      await reviewReport({ reportId, reportType, status }).unwrap();
      toast.success(`Report marked as ${status}`);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to update report status";
      toast.error("Failed to update report", { description: errorMessage });
    }
  };

  const handleRowClick = (report: UnifiedReportItem) => {
    setSelectedReportId(report.id!);
    setSelectedReportType(report.report_type);
    setDetailsModalOpen(true);
  };

  const handleViewPost = (postId: number | string | undefined) => {
    if (postId) {
      router.push(`/main/post/${postId}`);
    }
  };

  const handleDeleteClick = (report: UnifiedReportItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!report.id) return;
    const reportType = report.report_type || 'post';
    const reportTitle = report.report_type === 'post'
      ? report.post_title || 'Post Report'
      : getReportedItemName(report) || 'User Report';
    setReportToDelete({ id: report.id, type: reportType as 'post' | 'user', title: reportTitle });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;

    try {
      await deleteReport({
        reportId: reportToDelete.id,
        reportType: reportToDelete.type
      }).unwrap();
      toast.success("Report deleted successfully!");
      setDeleteDialogOpen(false);
      setReportToDelete(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string } })?.data?.error ||
        (error as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to delete report";
      toast.error("Failed to delete report", { description: errorMessage });
    }
  };

  const getReporterName = (report: UnifiedReportItem) => {
    return report.reporter?.display_name || report.reporter?.username || "N/A";
  };

  const getReportedItemName = (report: UnifiedReportItem) => {
    if (report.report_type === 'post') {
      return report.post_title || "N/A";
    } else {
      return report.reported_user?.display_name || report.reported_user?.username || "N/A";
    }
  };

  const handleBlockGlobal = async (userId: number | string) => {
    try {
      await blockGlobal({ userId }).unwrap();
      toast.success("User blocked globally successfully!");
    } catch (error: any) {
      toast.error("Failed to block user globally", {
        description: error.data?.error || error.data?.message || "Something went wrong"
      });
    }
  };

  const handleBlockLocal = async (blockerId: number | string, blockedId: number | string) => {
    try {
      await blockLocal({ blockerId, blockedId }).unwrap();
      toast.success("User blocked from the reporter successfully!");
    } catch (error: any) {
      toast.error("Failed to block user locally", {
        description: error.data?.error || error.data?.message || "Something went wrong"
      });
    }
  };

  const handleUnblockGlobal = async (userId: number | string) => {
    try {
      await unblockGlobal({ userId }).unwrap();
      toast.success("User unblocked globally successfully!");
    } catch (error: any) {
      toast.error("Failed to unblock user globally", {
        description: error.data?.error || error.data?.message || "Something went wrong"
      });
    }
  };

  const handleUnblockLocal = async (blockerId: number | string, blockedId: number | string) => {
    try {
      await unblockLocal({ blockerId, blockedId }).unwrap();
      toast.success("User unblocked for the reporter successfully!");
    } catch (error: any) {
      toast.error("Failed to unblock user locally", {
        description: error.data?.error || error.data?.message || "Something went wrong"
      });
    }
  };

  const handleDeletePost = async (postId: number | string) => {
    try {
      await deletePost({ postId }).unwrap();
      toast.success("Post deleted successfully!");
      setDetailsModalOpen(false);
    } catch (error: any) {
      toast.error("Failed to delete post", {
        description: error.data?.error || error.data?.message || "Something went wrong"
      });
    }
  };

  type ReportRow = UnifiedReportItem;

  const columns: Column<ReportRow>[] = [
    {
      header: "SL",
      accessor: (row, index) => <span>{index + 1}.</span>,
    },
    {
      header: "Type",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.report_type === 'post' ? (
            <FileText className="w-4 h-4 text-blue-400" />
          ) : (
            <User className="w-4 h-4 text-purple-400" />
          )}
          <span className="text-xs text-white/60">{row.type_label || (row.report_type === 'post' ? 'Post' : 'User')}</span>
        </div>
      ),
    },
    {
      header: (row: ReportRow) => row.report_type === 'post' ? "Post Title" : "Reported User",
      accessor: (row) => {
        if (row.report_type === 'post') {
          return (
            <div
              className="max-w-xs truncate cursor-pointer hover:text-blue-400 transition-colors"
              title={row.post_title || "N/A"}
              onClick={(e) => {
                e.stopPropagation();
                handleViewPost(row.post_id || row.post);
              }}
            >
              {row.post_title || "N/A"}
            </div>
          );
        } else {
          return (
            <div className="max-w-xs truncate" title={getReportedItemName(row)}>
              {getReportedItemName(row)}
            </div>
          );
        }
      },
    },
    {
      header: "Reporter",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={getReporterName(row)}>
          {getReporterName(row)}
        </div>
      ),
    },
    {
      header: (row: ReportRow) => row.report_type === 'post' ? "Post Author" : "Reported User",
      accessor: (row) => {
        if (row.report_type === 'post') {
          return (
            <div className="max-w-xs truncate" title={row.post_author_details?.username || "N/A"}>
              {row.post_author_details?.display_name || row.post_author_details?.username || "N/A"}
            </div>
          );
        } else {
          return (
            <div className="max-w-xs truncate" title={getReportedItemName(row)}>
              {getReportedItemName(row)}
            </div>
          );
        }
      },
    },
    {
      header: "Reason",
      accessor: (row) => (
        <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">
          {getReasonLabel(row.reason)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => getStatusBadge(row.status),
      className: "text-center",
    },
    {
      header: "Reported At",
      accessor: (row) => <span className="text-sm">{formatDate(row.created_at)}</span>,
    },
    {
      header: "Reviewed By",
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.reviewed_by_details?.username || "Not reviewed"}>
          {row.reviewed_by_details?.username || "—"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => {
        const isPending = row.status === 'pending';
        const reportType = row.report_type || 'post';
        return (
          <div className="flex items-center justify-center space-x-3">
            {isPending && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReview(row.id!, reportType as 'post' | 'user', 'resolved');
                  }}
                  disabled={isReviewing}
                  className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Mark as Resolved"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReview(row.id!, reportType as 'post' | 'user', 'dismissed');
                  }}
                  disabled={isReviewing}
                  className="p-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Dismiss"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
            {!isPending && (
              <span className="text-xs text-white/40">Handled</span>
            )}
            <button
              onClick={(e) => handleDeleteClick(row, e)}
              className="p-2 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="Delete report"
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

  return (
    <>
      <div className="w-[88vw] lg:w-full rounded-2xl border border-white/20 flex flex-col">
        <CustomTable
          columns={columns}
          data={reports}
          title="All Reports"
          description="Review and manage reported posts and content"
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
                      { label: "Pending", value: "pending" },
                      { label: "Resolved", value: "resolved" },
                      { label: "Dismissed", value: "dismissed" },
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
                placeholder="Search by reporter, reason, or content..."
                label="Search"
              />
            </>
          }
          emptyMessage="No reports found"
          isError={isError}
          errorMessage="Failed to load reports. Please try again later"
          disablePagination={true}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Report Details Modal */}
      {detailsModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1F2149] border border-white/20 rounded-2xl w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <ShieldAlert className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">Report Review</h3>
                  <p className="text-sm text-white/50">{selectedReport.type_label || (selectedReport.report_type === 'post' ? 'Post Report' : 'User Report')}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Reporter Card */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Reporter Information</h4>
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/30">
                      <Image
                        src={selectedReport.reporter?.avatar || "/sheep.jpg"}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white leading-none mb-1">{selectedReport.reporter?.display_name || "Anonymous"}</p>
                      <p className="text-sm text-purple-400 font-medium tracking-tight">@{selectedReport.reporter?.username || "unknown"}</p>
                      <p className="text-xs text-white/40 mt-1">{selectedReport.reporter?.email || "No email available"}</p>
                    </div>
                  </div>
                </div>

                {/* Reported User/Author Card */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">
                    {selectedReport.report_type === 'post' ? 'Post Author Details' : 'Reported User Details'}
                  </h4>
                  {(() => {
                    const reportedUser = selectedReport.report_type === 'post'
                      ? selectedReport.post_author_details
                      : selectedReport.reported_user;

                    return (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-red-500/30">
                            <Image
                              src={reportedUser?.avatar || "/sheep.jpg"}
                              alt="Avatar"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-white leading-none mb-1">{reportedUser?.display_name || "N/A"}</p>
                            <p className="text-sm text-red-400 font-medium tracking-tight">@{reportedUser?.username || "unknown"}</p>
                            <p className="text-xs text-white/40 mt-1">{reportedUser?.email || "No email available"}</p>
                          </div>
                        </div>

                        {/* Blocking Actions */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {reportedUser?.is_active !== false ? (
                            <button
                              onClick={() => reportedUser?.id && handleBlockGlobal(reportedUser.id)}
                              disabled={isBlockingGlobal}
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            >
                              <UserX className="w-4 h-4" />
                              {isBlockingGlobal ? "Blocking..." : "Block Global"}
                            </button>
                          ) : (
                            <button
                              onClick={() => reportedUser?.id && handleUnblockGlobal(reportedUser.id)}
                              disabled={isUnblockingGlobal}
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {isUnblockingGlobal ? "Unblocking..." : "Unblock Global"}
                            </button>
                          )}

                          {reportedUser?.is_blocked_locally !== true ? (
                            <button
                              onClick={() => reportedUser?.id && selectedReport.reporter?.id && handleBlockLocal(selectedReport.reporter.id, reportedUser.id)}
                              disabled={isBlockingLocal}
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            >
                              <UserMinus className="w-4 h-4" />
                              {isBlockingLocal ? "Blocking..." : "Block by this user"}
                            </button>
                          ) : (
                            <button
                              onClick={() => reportedUser?.id && selectedReport.reporter?.id && handleUnblockLocal(selectedReport.reporter.id, reportedUser.id)}
                              disabled={isUnblockingLocal}
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            >
                              <User className="w-4 h-4" />
                              {isUnblockingLocal ? "Unblocking..." : "Unblock by this user"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Report Context */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Reason for Report</h4>
                    <p className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-bold inline-block border border-purple-500/30">
                      {getReasonLabel(selectedReport.reason)}
                    </p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Status</h4>
                    <div className="inline-block">{getStatusBadge(selectedReport.status)}</div>
                  </div>
                </div>

                {selectedReport.report_type === 'post' && selectedReport.post_id && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowPostContent(!showPostContent)}
                      className="w-full p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Reported Post</h4>
                        <p className="text-white font-bold text-lg">{selectedReport.post_title || "View Post Content"}</p>
                      </div>
                      <div className="text-white/40">{showPostContent ? '▼' : '▶'}</div>
                    </button>

                    {showPostContent && (
                      <PostContentPreview
                        postId={selectedReport.post_id}
                        onDelete={() => handleDeletePost(selectedReport.post_id!)}
                        isDeleting={isDeletingPost}
                      />
                    )}
                  </div>
                )}

                {selectedReport.report_type === 'user' && selectedReport.reporter?.id && selectedReport.reported_user?.id && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowChatHistory(!showChatHistory)}
                      className="w-full p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Chat History</h4>
                        <p className="text-white font-bold text-sm">View conversation between users</p>
                      </div>
                      <div className="text-white/40">{showChatHistory ? '▼' : '▶'}</div>
                    </button>

                    {showChatHistory && (
                      <ChatHistoryPreview
                        reporterId={selectedReport.reporter.id}
                        reportedId={selectedReport.reported_user.id}
                      />
                    )}
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Detailed Description</h4>
                  <p className="text-white/80 leading-relaxed text-base italic border-l-4 border-purple-500/50 pl-4 py-1">
                    {selectedReport.description || "No description provided by the reporter."}
                  </p>
                </div>
              </div>

              {/* metadata */}
              <div className="flex flex-wrap gap-6 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Reported on: {formatDate(selectedReport.created_at)}</span>
                </div>
                {selectedReport.reviewed_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Resolved on: {formatDate(selectedReport.reviewed_at)}</span>
                  </div>
                )}
                {selectedReport.reviewed_by_details && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Handling Admin: @{selectedReport.reviewed_by_details.username}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              {selectedReport.status === 'pending' ? (
                <>
                  <button
                    onClick={() => {
                      const reportType = selectedReport.report_type || 'post';
                      handleReview(selectedReport.id!, reportType as 'post' | 'user', 'resolved');
                      setDetailsModalOpen(false);
                    }}
                    disabled={isReviewing}
                    className="flex-1 py-3 px-6 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold transition shadow-lg shadow-green-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    Mark as Resolved
                  </button>
                  <button
                    onClick={() => {
                      const reportType = selectedReport.report_type || 'post';
                      handleReview(selectedReport.id!, reportType as 'post' | 'user', 'dismissed');
                      setDetailsModalOpen(false);
                    }}
                    disabled={isReviewing}
                    className="flex-1 py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    Dismiss Report
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="w-full py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition cursor-pointer"
                >
                  Close Review
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Report?"
        description={`Are you sure you want to delete this ${reportToDelete?.type === 'post' ? 'post' : 'user'} report? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setReportToDelete(null);
        }}
      />
    </>
  );
}

// Post Content Preview Component
function PostContentPreview({ postId, onDelete, isDeleting }: { postId: number | string; onDelete: () => void; isDeleting: boolean }) {
  const { data: postData, isLoading, isError } = useGetPostByIdQuery(postId);

  if (isLoading) {
    return <div className="mt-4 p-4 bg-white/5 rounded-xl text-white/60 text-center">Loading post content...</div>;
  }

  if (isError || !postData) {
    return <div className="mt-4 p-4 bg-red-500/10 rounded-xl text-red-400 text-center">Failed to load post content</div>;
  }

  const post: any = (postData as any).data || postData;

  return (
    <div className="mt-4 p-6 bg-white/5 rounded-xl border border-white/10">
      <div className="mb-4">
        <h5 className="text-white font-bold text-xl mb-2">{post.title}</h5>
        <p className="text-white/80 leading-relaxed">{post.content}</p>
      </div>

      {post.media && post.media.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {post.media.map((mediaUrl: string, idx: number) => (
            <div key={idx} className="relative w-full h-48 rounded-lg overflow-hidden">
              <Image src={mediaUrl} alt={`Post media ${idx + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-white/40 mb-4">
        <span>👍 {post.likes_count || 0} likes</span>
        <span>💬 {post.comments_count || 0} comments</span>
        <span>🔄 {post.shares_count || 0} shares</span>
      </div>

      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="w-full py-3 px-6 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition shadow-lg shadow-red-500/20 disabled:opacity-50 cursor-pointer"
      >
        {isDeleting ? "Deleting..." : "Delete This Post"}
      </button>
    </div>
  );
}

// Chat History Preview Component
function ChatHistoryPreview({ reporterId, reportedId }: { reporterId: number | string; reportedId: number | string }) {
  const { data: chatData, isLoading, isError } = useGetAdminChatHistoryQuery({ reporterId, reportedId });

  if (isLoading) {
    return <div className="mt-4 p-4 bg-white/5 rounded-xl text-white/60 text-center">Loading chat history...</div>;
  }

  if (isError || !chatData) {
    return <div className="mt-4 p-4 bg-yellow-500/10 rounded-xl text-yellow-400 text-center">Failed to load chat history</div>;
  }

  const messages = chatData.data || [];

  if (messages.length === 0) {
    return <div className="mt-4 p-4 bg-white/5 rounded-xl text-white/60 text-center">No chat history found between these users</div>;
  }

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 max-h-96 overflow-y-auto custom-scrollbar">
      <p className="text-xs text-white/40 mb-4">Showing last {messages.length} messages</p>
      <div className="space-y-3">
        {messages.slice().reverse().map((msg: any) => (
          <div key={msg.id} className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-purple-400">@{msg.sender?.username || "Unknown"}</span>
              <span className="text-xs text-white/40">{new Date(msg.created_at).toLocaleString()}</span>
            </div>
            <p className="text-white/80 text-sm">{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

