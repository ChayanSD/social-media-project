"use client";

import React, { useState } from "react";
import { useGetMessageRequestsQuery } from "@/store/chatApi";
import { MessageSquare, Bell } from "lucide-react";
import MessageRequests from "./MessageRequests";

export default function MessageRequestBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useGetMessageRequestsQuery();
  
  const pendingCount = data?.data?.length || 0;

  if (pendingCount === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
        title={`${pendingCount} pending message request${pendingCount > 1 ? 's' : ''}`}
      >
        <Bell className="w-5 h-5 text-white" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>
      
      <MessageRequests isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

