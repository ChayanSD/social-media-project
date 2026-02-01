"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { 
  useGetJoinRequestsQuery, 
  useApproveJoinRequestMutation, 
  useRejectJoinRequestMutation,
  JoinRequestItem 
} from "@/store/communityApi";
import { toast } from "sonner";
import { FiCheck, FiXCircle, FiClock } from "react-icons/fi";
import { getApiBaseUrl } from "@/lib/utils";
import CustomDialog from "@/components/ui/CustomDialog";

interface JoinRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityName: string;
  communityTitle?: string;
}

const JoinRequestsModal: React.FC<JoinRequestsModalProps> = ({
  isOpen,
  onClose,
  communityName,
  communityTitle,
}) => {
  const { data: joinRequestsResponse, isLoading, refetch } = useGetJoinRequestsQuery(communityName, {
    skip: !isOpen || !communityName,
  });
  const [approveRequest, { isLoading: isApproving }] = useApproveJoinRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectJoinRequestMutation();
  const apiBase = getApiBaseUrl();

  const joinRequests = useMemo(() => {
    if (!joinRequestsResponse) return [];
    const data = joinRequestsResponse.data ?? joinRequestsResponse.results ?? [];
    return Array.isArray(data) ? data : [];
  }, [joinRequestsResponse]);

  // Filter only pending requests
  const pendingRequests = useMemo(() => {
    return joinRequests.filter((req: JoinRequestItem) => req.status === 'pending');
  }, [joinRequests]);

  const handleApprove = async (requestId: number | string) => {
    try {
      await approveRequest(requestId).unwrap();
      toast.success("Join request approved!");
      refetch();
    } catch (error: unknown) {
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 
         ('message' in error.data || 'detail' in error.data))
          ? (error.data as { message?: string; detail?: string }).message || 
            (error.data as { message?: string; detail?: string }).detail
          : "Failed to approve request. Please try again.";
      
      toast.error("Error approving request", {
        description: errorMessage || "Failed to approve request. Please try again.",
      });
    }
  };

  const handleReject = async (requestId: number | string) => {
    try {
      await rejectRequest(requestId).unwrap();
      toast.success("Join request rejected");
      refetch();
    } catch (error: unknown) {
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 
         ('message' in error.data || 'detail' in error.data))
          ? (error.data as { message?: string; detail?: string }).message || 
            (error.data as { message?: string; detail?: string }).detail
          : "Failed to reject request. Please try again.";
      
      toast.error("Error rejecting request", {
        description: errorMessage || "Failed to reject request. Please try again.",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Join Requests"
      description={communityTitle || communityName}
      maxWidth="3xl"
      maxHeight="85vh"
      contentClassName="flex flex-col"
    >

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scroll p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse bg-white/5 rounded-lg border border-white/10 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-white/10" />
                      <div className="h-3 w-24 rounded bg-white/10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FiClock className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white text-lg font-medium mb-2">No pending requests</p>
              <p className="text-white/60 text-sm">
                All join requests have been processed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request: JoinRequestItem) => {
                const avatar = request.user_avatar;
                const displayName = request.user_display_name || request.username || "Unknown User";
                const username = request.username || String(request.user);
                
                return (
                  <div
                    key={request.id}
                    className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
                        <Image
                          src={
                            !avatar
                              ? "/sheep.jpg"
                              : avatar.startsWith("http")
                              ? avatar
                              : `${apiBase}${avatar.startsWith("/") ? avatar.slice(1) : avatar}`
                          }
                          alt={displayName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-white font-medium">{displayName}</p>
                            <p className="text-white/60 text-sm">@{username}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            Pending
                          </span>
                        </div>

                        {request.message && (
                          <p className="text-white/80 text-sm mb-3 mt-2">
                            {request.message}
                          </p>
                        )}

                        <p className="text-white/40 text-xs mb-3">
                          Requested on {formatDate(request.created_at)}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={isApproving || isRejecting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <FiCheck className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={isApproving || isRejecting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <FiXCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-white/60 text-sm">
            {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </CustomDialog>
  );
};

export default JoinRequestsModal;

