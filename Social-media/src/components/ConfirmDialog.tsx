"use client";

import React, { ReactNode } from "react";
import CustomDialog from "@/components/ui/CustomDialog";

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCancel();
    }
  };

  const confirmClasses =
    variant === "destructive"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm text-gray-200 bg-transparent hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-full text-sm text-white ${confirmClasses} disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer`}
          >
            {confirmLabel}
          </button>
        </>
      }
    />
  );
};

export default ConfirmDialog;


