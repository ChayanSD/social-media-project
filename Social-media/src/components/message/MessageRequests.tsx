"use client";

import React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { 
  useGetMessageRequestsQuery, 
  useAcceptMessageRequestMutation, 
  useRejectMessageRequestMutation,
  type MessageRequest 
} from "@/store/chatApi";
import { Loader2, Check, X, MessageSquare } from "lucide-react";
import CustomDialog from "@/components/ui/CustomDialog";

interface MessageRequestsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageRequests({ isOpen, onClose }: MessageRequestsProps) {
  const { data, isLoading, refetch } = useGetMessageRequestsQuery(undefined, {
    skip: !isOpen, // Only fetch when modal is open
  });
  
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptMessageRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectMessageRequestMutation();

  const requests = data?.data || [];

  const handleAccept = async (requestId: number | string) => {
    try {
      await acceptRequest({ request_id: requestId }).unwrap();
      toast.success("Message request accepted! You can now message each other.");
      refetch();
    } catch (error: unknown) {
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 'message' in error.data
         ? String(error.data.message)
         : null) ||
        "Failed to accept message request";
      toast.error(errorMessage);
    }
  };

  const handleReject = async (requestId: number | string) => {
    try {
      await rejectRequest({ request_id: requestId }).unwrap();
      toast.success("Message request rejected.");
      refetch();
    } catch (error: unknown) {
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 'message' in error.data
         ? String(error.data.message)
         : null) ||
        "Failed to reject message request";
      toast.error(errorMessage);
    }
  };

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Message Requests"
      maxWidth="md"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <p className="text-white/60">No pending message requests</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {requests.map((request: MessageRequest) => (
              <div
                key={request.id}
                className="backdrop-blur-[17px] rounded-xl p-4 border border-white/20 bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {request.sender?.avatar ? (
                      <Image
                        src={request.sender.avatar}
                        alt={request.sender_username || "User"}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                        {(request.sender_username || "U")[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold truncate">
                        {request.sender?.display_name || request.sender_username || "Unknown User"}
                      </h4>
                      <span className="text-xs text-white/50">
                        {request.created_at 
                          ? new Date(request.created_at).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                    
                    <p className="text-white/70 text-sm mb-3 line-clamp-2">
                      {request.content || "No message content"}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request.id!)}
                        disabled={isAccepting || isRejecting}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAccepting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(request.id!)}
                        disabled={isAccepting || isRejecting}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRejecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomDialog>
  );
}

