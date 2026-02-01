"use client";

import React from "react";
import { FiFileText } from "react-icons/fi";

interface EmptyPostsStateProps {
  message?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  className?: string;
}

const EmptyPostsState: React.FC<EmptyPostsStateProps> = ({
  message = "No posts available yet",
  showCreateButton = false,
  onCreateClick,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}
    >
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
        <FiFileText className="text-white/60" size={48} />
      </div>
      <h3 className="text-white/80 text-lg font-semibold mb-2 text-center">
        {message}
      </h3>
      <p className="text-white/50 text-sm text-center max-w-md mb-6">
        Start sharing your thoughts and connect with others!
      </p>
      {showCreateButton && onCreateClick && (
        <button
          onClick={onCreateClick}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Create Your First Post
        </button>
      )}
    </div>
  );
};

export default EmptyPostsState;

