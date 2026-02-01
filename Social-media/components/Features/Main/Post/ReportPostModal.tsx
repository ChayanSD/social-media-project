"use client";

import React, { useState } from "react";
import CustomDialog from "@/components/ui/CustomDialog";
import { useReportPostMutation } from "@/store/postApi";
import { toast } from "sonner";

interface ReportPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number | string;
  postTitle?: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'violence', label: 'Violence' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'copyright', label: 'Copyright Violation' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'other', label: 'Other' },
];

const ReportPostModal: React.FC<ReportPostModalProps> = ({
  isOpen,
  onClose,
  postId,
  postTitle,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [reportPost, { isLoading }] = useReportPostMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    try {
      await reportPost({
        postId,
        reason: selectedReason,
        description: description.trim() || undefined,
      }).unwrap();
      
      toast.success("Post reported successfully. Our team will review it.");
      handleClose();
    } catch (error: unknown) {
      const errorMessage = 
        (error && typeof error === 'object' && 'data' in error && 
         error.data && typeof error.data === 'object' && 
         ('message' in error.data || 'error' in error.data))
          ? (error.data as { message?: string; error?: string }).message || 
            (error.data as { message?: string; error?: string }).error
          : "Failed to report post";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setDescription("");
    onClose();
  };

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title="Report Post"
      maxWidth="xl"
      maxHeight="90vh"
    >
      {postTitle && (
        <p className="text-sm text-white/70 mb-4">
          Reporting: <span className="font-medium">{postTitle}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Reason for reporting <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm text-white">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide more details about why you're reporting this post..."
              rows={4}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-white/60 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedReason}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Reporting..." : "Report Post"}
            </button>
          </div>
        </form>
    </CustomDialog>
  );
};

export default ReportPostModal;

