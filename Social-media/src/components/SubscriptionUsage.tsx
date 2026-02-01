"use client";

import { useGetSubscriptionUsageQuery } from "@/store/marketplaceApi";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SubscriptionUsage() {
  const { data, isLoading, error } = useGetSubscriptionUsageQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-white" />
      </div>
    );
  }

  if (error || !data?.data) {
    return null;
  }

  const usage = data.data;
  const isUnlimited = usage.posts_limit === null;
  const remaining = usage.remaining_posts;

  return (
    <div className="backdrop-blur-[17px] rounded-2xl p-4 md:p-6 border border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Subscription Status</h3>
        {usage.can_post ? (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-400" />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-white/60 mb-1">Current Plan</p>
          <p className="text-lg font-medium text-white">{usage.plan_name}</p>
        </div>

        <div>
          <p className="text-sm text-white/60 mb-1">Posts This Month</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usage.can_post ? "bg-green-500" : "bg-red-500"
                }`}
                style={{
                  width: isUnlimited
                    ? "100%"
                    : `${Math.min(100, (usage.posts_used / (usage.posts_limit ?? 0)) * 100)}%`,
                }}
              />
            </div>
            <span className="text-sm text-white font-medium">
              {usage.posts_used}
              {!isUnlimited && ` / ${usage.posts_limit}`}
            </span>
          </div>
        </div>

        {!isUnlimited && (
          <div>
            <p className="text-sm text-white/60 mb-1">Remaining Posts</p>
            <p className="text-xl font-bold text-white">
              {remaining !== null ? remaining : "Unlimited"}
            </p>
          </div>
        )}

        {usage.has_credits && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-sm text-white/60 mb-1">Available Credits</p>
            <p className="text-lg font-medium text-green-400">
              {usage.credit_count} post{usage.credit_count !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {!usage.can_post && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-sm text-red-400">
              You&apos;ve reached your posting limit. Upgrade your plan or purchase additional posts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

