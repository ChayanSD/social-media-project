"use client";

import React, { useState, useEffect } from "react";
import {
  useGetSubscriptionPlansQuery,
  useGetUserSubscriptionQuery,
  SubscriptionPlan,
} from "@/store/paymentApi";
import { Loader2, Check, Zap, Crown, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import PaymentModal from "./PaymentModal";

type PlanGroup = {
  key: string;
  title: string;
  monthly?: SubscriptionPlan;
  yearly?: SubscriptionPlan;
  features: string[];
  postsPerMonth: number;
  isRecommended: boolean;
};

export default function SubscriptionPlansPage() {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const searchParams = useSearchParams();
  const { data, isLoading } = useGetSubscriptionPlansQuery();
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

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams?.get("success");
    const canceled = searchParams?.get("canceled");

    if (success === "true") {
      toast.success("Payment successful! Your subscription is now active.");
    } else if (canceled === "true") {
      toast.info("Payment canceled. You can try again anytime.");
    }
  }, [searchParams]);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlanForPayment(plan);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setSelectedPlanForPayment(null);
    toast.success("Payment successful!");
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
    <div className="max-w-[1400px] mx-auto p-4 md:p-6">
      <div className="page-container">
        <div className="p-6 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Select a tier and choose Monthly or Yearly billing.
            </p>
          </div>

          {hasActiveSubscription && userSubscription?.plan && (
            <div className="mb-8 p-5 rounded-xl border border-green-500/40 bg-green-500/10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-wide text-green-300">Active Subscription</p>
                  <h3 className="text-xl font-bold text-white mt-1">{userSubscription.plan.display_name}</h3>
                  <p className="text-base text-white/70 mt-1">
                    Status: <span className="text-green-300 font-medium capitalize">{userSubscription.status}</span>
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-base text-white/70">Current billing period end</p>
                  <p className="text-white font-semibold">
                    {userSubscription.current_period_end
                      ? new Date(userSubscription.current_period_end).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Plans */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {groups.map((group) => {
                  const currentMonthly = false;
                  const currentYearly = false;
                  return (
                    <div
                      key={group.key}
                      className={`relative p-6  rounded-xl border-2 transition-all duration-300 flex flex-col ${currentMonthly || currentYearly
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
                          {"Monthly"}
                        </button>
                        <button
                          onClick={() => group.yearly && handleSubscribe(group.yearly)}
                          disabled={!group.yearly}
                          className={`w-full px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 ${currentYearly
                            ? "bg-green-600 cursor-default"
                            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            }`}
                        >
                          {"Yearly"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {groups.length === 0 && hasActiveSubscription && (
                <div className="rounded-xl border border-white/20 bg-white/5 p-6 text-center">
                  <p className="text-white/80">You already have the active plan. No other plans are available right now.</p>
                </div>
              )}


              {/* Footer Info */}
              <div className="text-center space-y-2 text-white/60 text-base pt-6">
                <p>All features are subject to availability and may vary by region.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Payment Modal */}
      {selectedPlanForPayment && (
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
    </div>
  );
}
