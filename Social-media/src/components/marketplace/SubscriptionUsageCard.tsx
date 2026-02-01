"use client";

import React from "react";
import { useGetSubscriptionUsageQuery } from "@/store/paymentApi";
import { Loader2, CreditCard, Zap, AlertCircle } from "lucide-react";

interface SubscriptionUsageCardProps {
  onUpgrade?: () => void;
}

export default function SubscriptionUsageCard({
  onUpgrade,
}: SubscriptionUsageCardProps) {
  const { data, isLoading, error } = useGetSubscriptionUsageQuery();

  if (isLoading) {
    return (
      <div className="backdrop-blur-[17px] rounded-2xl p-4 md:p-6 border border-white/20 shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-[17px] rounded-2xl p-4 md:p-6 border border-red-500/20 shadow-lg">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load subscription information</p>
        </div>
      </div>
    );
  }

  const usage = data?.data;
  if (!usage) return null;

  const isUnlimited = usage.posts_limit === null;
  const usagePercentage = isUnlimited
    ? 0
    : usage.posts_limit && usage.posts_limit > 0
    ? (usage.posts_used / (usage.posts_limit ?? 0)) * 100
    : 0;

  return (
    <div className="backdrop-blur-[17px] rounded-2xl p-4 md:p-6 border border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Subscription Status</h3>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-medium text-white/80">{usage.plan_display_name || usage.plan_name}</span>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">Posts This Month</span>
          <span className="text-sm font-semibold text-white">
            {usage.posts_used} / {isUnlimited ? "∞" : usage.posts_limit}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              usagePercentage >= 90
                ? "bg-red-500"
                : usagePercentage >= 70
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Remaining Posts */}
      <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white/70">Remaining Posts</span>
          </div>
          <span className="text-lg font-bold text-white">
            {isUnlimited ? "∞" : usage.remaining_posts ?? 0}
          </span>
        </div>
        {usage.has_credits && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Post Credits</span>
              <span className="text-sm font-semibold text-green-400">
                {usage.credit_count} available
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions - Only show when user cannot post */}
      {!usage.can_post && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
          <p className="text-sm text-yellow-300 mb-3">
            You&apos;ve reached your posting limit. Upgrade your plan to continue posting.
          </p>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="w-full cursor-pointer px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}

