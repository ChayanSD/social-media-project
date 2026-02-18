"use client";

import React, { useState } from "react";
import {
  useGetSubscriptionPlansQuery,
  useGetSubscriptionUsageQuery,
  useGetUserSubscriptionQuery,
  SubscriptionPlan,
} from "@/store/paymentApi";
import { Loader2, Check, Zap, Crown, Rocket } from "lucide-react";
import { toast } from "sonner";
import CustomDialog from "@/components/ui/CustomDialog";
import PaymentModal from "./PaymentModal";

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void | Promise<void>;
}

type PlanGroup = {
  key: string;
  title: string;
  monthly?: SubscriptionPlan;
  yearly?: SubscriptionPlan;
  features: string[];
  postsPerMonth: number;
  isRecommended: boolean;
};

export default function SubscriptionPlansModal({
  isOpen,
  onClose,
  onPaymentSuccess,
}: SubscriptionPlansModalProps) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const { data, isLoading } = useGetSubscriptionPlansQuery();
  const { refetch: refetchUsage } = useGetSubscriptionUsageQuery();
  const { data: userSubscriptionData } = useGetUserSubscriptionQuery();

  const plans = React.useMemo(() => data?.data || [], [data]);
  const userSubscription = userSubscriptionData?.data;
  const activeStatuses = new Set(["active", "trialing"]);
  const hasActiveSubscription = !!userSubscription?.plan && activeStatuses.has(userSubscription.status);
  const activePlanId = hasActiveSubscription ? userSubscription?.plan?.id : null;
  const groups: PlanGroup[] = React.useMemo(() => {
    const grouped = new Map<string, PlanGroup>();

    plans.forEach((plan) => {
      const key = plan.name.split("-")[0].toLowerCase();
      const existing = grouped.get(key) || {
        key,
        title: key.charAt(0).toUpperCase() + key.slice(1),
        features: plan.features || [],
        postsPerMonth: plan.posts_per_month,
        isRecommended: !!plan.is_recommended,
      };

      if (plan.billing_cycle === "year") {
        existing.yearly = plan;
      } else {
        existing.monthly = plan;
      }
      existing.features = existing.features.length ? existing.features : (plan.features || []);
      existing.postsPerMonth = plan.posts_per_month;
      existing.isRecommended = existing.isRecommended || !!plan.is_recommended;

      grouped.set(key, existing);
    });

    const sortOrder = ["starter", "growth", "platinum"];
    const sorted = Array.from(grouped.values()).sort(
      (a, b) => sortOrder.indexOf(a.key) - sortOrder.indexOf(b.key)
    );
    if (!activePlanId) {
      return sorted;
    }

    return sorted
      .map((group) => ({
        ...group,
        monthly: group.monthly?.id === activePlanId ? undefined : group.monthly,
        yearly: group.yearly?.id === activePlanId ? undefined : group.yearly,
      }))
      .filter((group) => group.monthly || group.yearly);
  }, [plans, activePlanId]);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (!plan || !plan.id) {
      toast.error("Invalid plan selected");
      return;
    }
    setSelectedPlanForPayment(plan);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setPaymentModalOpen(false);
    setSelectedPlanForPayment(null);
    toast.success("Payment successful!");
    // Refetch subscription usage to update immediately
    try {
      await refetchUsage();
      // Call parent callback if provided
      if (onPaymentSuccess) {
        await onPaymentSuccess();
      }
    } catch (error) {
      console.error("Failed to refetch subscription usage:", error);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "starter":
        return <Zap className="w-6 h-6" />;
      case "growth":
        return <Check className="w-6 h-6" />;
      case "platinum":
        return <Crown className="w-6 h-6" />;
      default:
        return <Rocket className="w-6 h-6" />;
    }
  };

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Choose Your Plan"
      maxWidth="70vw"
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        ) : (
          <>
            {hasActiveSubscription && userSubscription?.plan && (
              <div className="mb-4 p-4 rounded-xl border border-green-500/40 bg-green-500/10">
                <p className="text-sm uppercase tracking-wide text-green-300">Active Subscription</p>
                <p className="text-white font-semibold mt-1">{userSubscription.plan.display_name}</p>
                <p className="text-sm text-white/70 mt-1">
                  Period end: {userSubscription.current_period_end ? new Date(userSubscription.current_period_end).toLocaleDateString() : "N/A"}
                </p>
              </div>
            )}
            {/* Subscription Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {groups.map((group) => {
                const currentMonthly = false;
                const currentYearly = false;
                return (
                  <div
                    key={group.key}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-300 flex flex-col ${(currentMonthly || currentYearly)
                      ? "border-green-500 bg-green-500/10"
                      : group.isRecommended
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/20 bg-white/5 hover:border-white/40"
                      }`}
                  >
                    {(currentMonthly || currentYearly) && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-full">
                          YOUR PLAN
                        </span>
                      </div>
                    )}
                    {group.isRecommended && !(currentMonthly || currentYearly) && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full">
                          RECOMMENDED
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                        {getPlanIcon(group.key)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {group.title}
                        </h3>
                      </div>
                    </div>

                    <div className="mb-4 flex-1">
                      <div className="space-y-3 mb-4">
                        {group.monthly && (
                          <div className="p-3 rounded-lg border border-white/10 bg-white/5">
                            <p className="text-sm uppercase tracking-wide text-white/60">Monthly</p>
                            <p className="text-lg font-bold text-white">${group.monthly.price}/mo</p>
                            <p className="text-sm text-white/60">Billed monthly</p>
                          </div>
                        )}
                        {group.yearly && (
                          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                            <p className="text-sm uppercase tracking-wide text-emerald-200">Yearly</p>
                            <p className="text-lg font-bold text-white">
                              ${(Number(group.yearly.price) / 12).toFixed(2)}/mo
                            </p>
                            <p className="text-sm text-emerald-200">
                              Billed ${Number(group.yearly.price).toFixed(2)} every 12 months
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-base text-white/80">
                          {group.postsPerMonth === 0
                            ? "Unlimited"
                            : `${group.postsPerMonth} posts/month`}
                        </span>
                      </div>
                      {group.features && group.features.length > 0 && (
                        <ul className="space-y-2 mt-3">
                          {group.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-base text-white/70"
                            >
                              <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => group.monthly && handleSubscribe(group.monthly)}
                        disabled={!group.monthly}
                        className={`w-full px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 ${currentMonthly
                          ? "bg-green-600 cursor-default"
                          : "bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                          }`}
                      >
                        {currentMonthly ? "Current" : "Monthly"}
                      </button>
                      <button
                        onClick={() => group.yearly && handleSubscribe(group.yearly)}
                        disabled={!group.yearly}
                        className={`w-full px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 ${currentYearly
                          ? "bg-green-600 cursor-default"
                          : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                          }`}
                      >
                        {currentYearly ? "Current" : "Yearly"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </>
        )}
      </div>

      {/* Embedded Payment Modal */}
      {selectedPlanForPayment && selectedPlanForPayment.id && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPlanForPayment(null);
          }}
          planId={selectedPlanForPayment.id}
          planName={selectedPlanForPayment.display_name}
          amount={selectedPlanForPayment.price}
          billingLabel={selectedPlanForPayment.billing_interval_count > 1
            ? `${selectedPlanForPayment.billing_interval_count} ${selectedPlanForPayment.billing_cycle}s`
            : selectedPlanForPayment.billing_cycle}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </CustomDialog>
  );
}
