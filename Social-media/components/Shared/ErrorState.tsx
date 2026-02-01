"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  showRetryButton?: boolean;
  onRetry?: () => void;
  className?: string;
  iconSize?: number;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Failed to load posts. Please try again later.",
  showRetryButton = true,
  onRetry,
  className = "",
  iconSize = 48,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}
    >
      <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
        <AlertCircle className="text-red-400" size={iconSize} />
      </div>
      <h3 className="text-red-400 text-lg font-semibold mb-2 text-center">
        Error Loading Data
      </h3>
      <p className="text-white/60 text-sm text-center max-w-md mb-6">
        {message}
      </p>
      {showRetryButton && onRetry && (
        <button
          onClick={onRetry}
          className="flex cursor-pointer items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-all duration-300 border border-red-500/30 hover:border-red-500/50"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
