"use client";

import React, { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "70vw" | "80vw" | "90vw" | "full";
  maxHeight?: string;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "70vw": "max-w-[70vw]",
  "80vw": "max-w-[80vw]",
  "90vw": "max-w-[90vw]",
  "full": "max-w-full",
};

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = "lg",
  maxHeight = "90vh",
  showCloseButton = true,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Standard background for all dialogs
          "bg-[#06133FBF] backdrop-blur-md border border-white/20 text-white",
          // Max width
          maxWidthClasses[maxWidth],
          // Max height and scroll (using inline style for dynamic values)
          "overflow-y-auto",
          // Custom classes
          contentClassName,
          className
        )}
        style={{ maxHeight }}
      >
        {(title || description) && (
          <DialogHeader className={cn(headerClassName)}>
            {title && (
              <DialogTitle className="text-xl font-bold text-white">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-white/70">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        <div className={cn("py-4", !title && !description && "pt-0")}>
          {children}
        </div>

        {footer && (
          <DialogFooter className={cn("mt-4", footerClassName)}>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialog;

