"use client";

import React, { useState } from 'react';
import { useReportUserMutation } from '@/store/chatApi';
import { toast } from 'sonner';
import CustomDialog from '@/components/ui/CustomDialog';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | string;
  username: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'fake_account', label: 'Fake Account' },
  { value: 'other', label: 'Other' },
] as const;

const ReportUserModal = ({ isOpen, onClose, userId, username }: ReportUserModalProps) => {
  const [reason, setReason] = useState<'spam' | 'harassment' | 'inappropriate_content' | 'fake_account' | 'other'>('spam');
  const [description, setDescription] = useState('');
  const [reportUser, { isLoading }] = useReportUserMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    try {
      await reportUser({
        reported_user: userId,
        reason,
        description: description.trim() || undefined,
      }).unwrap();

      toast.success('User has been reported. Our team will review this report.');
      setReason('spam');
      setDescription('');
      onClose();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || 'Failed to report user');
    }
  };

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Report User"
      description={`Reporting: ${username}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-white/60 mb-4">
          Please select a reason for reporting this user. Our team will review your report.
        </p>

        {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={(e) => setReason(e.target.value as typeof reason)}
                    className="mr-3 w-4 h-4 text-[#0059ff] focus:ring-[#0059ff] focus:ring-2"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-white">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional information that might help us review this report..."
              rows={4}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0059ff] focus:border-transparent text-sm text-white resize-none custom-scroll"
              disabled={isLoading}
            />
          </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !reason}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            ) : (
              'Report User'
            )}
          </button>
        </div>
      </form>
    </CustomDialog>
  );
};

export default ReportUserModal;

