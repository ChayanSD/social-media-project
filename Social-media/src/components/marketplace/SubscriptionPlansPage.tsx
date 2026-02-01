"use client";

import React, { useState, useEffect } from "react";
import {
  useGetSubscriptionPlansQuery,
  useGetSubscriptionUsageQuery,
  SubscriptionPlan,
} from "@/store/paymentApi";
import { Loader2, Check, Zap, Crown, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import PaymentModal from "./PaymentModal";

export default function SubscriptionPlansPage() {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const searchParams = useSearchParams();
  const { data, isLoading } = useGetSubscriptionPlansQuery();
  const { data: usageData } = useGetSubscriptionUsageQuery();

  const plans = data?.data || [];
  const usage = usageData?.data;
  const hasActiveSubscription = usage?.has_subscription && usage?.remaining_posts !== null && usage?.remaining_posts > 0;
  const currentPlanName = usage?.plan_name?.toLowerCase();
  // Only show "Your Plan" if user has remaining posts
  const hasRemainingPosts = (usage?.remaining_posts ?? 0) > 0;

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
      case "free":
        return <Zap className="w-6 h-6" />;
      case "basic":
        return <Check className="w-6 h-6" />;
      case "pro":
        return <Crown className="w-6 h-6" />;
      case "enterprise":
        return <Rocket className="w-6 h-6" />;
      default:
        return <Check className="w-6 h-6" />;
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
              Select a subscription plan that fits your needs or purchase individual posts.
            </p>
          </div>

          {/* Subscription Plans */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const isRecommended = plan.is_recommended || false;
                  // Only show "Your Plan" if it's the current plan AND user has remaining posts
                  const isCurrentPlan = currentPlanName === plan.name.toLowerCase() && hasRemainingPosts;
                  // Disable button only if user has active subscription with remaining posts for a different plan
                  const shouldDisableButton = hasActiveSubscription && !isCurrentPlan;
                  return (
                    <div
                      key={plan.id}
                      className={`relative p-6  rounded-xl border-2 transition-all duration-300 flex flex-col ${
                        isCurrentPlan
                          ? "border-green-500 bg-green-500/10"
                          : isRecommended
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/20 bg-white/5 hover:border-white/40"
                      }`}
                    >
                      {isCurrentPlan && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full">
                            YOUR PLAN
                          </span>
                        </div>
                      )}
                      {isRecommended && !isCurrentPlan && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                            RECOMMENDED
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                          {getPlanIcon(plan.name)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {plan.display_name}
                          </h3>
                          <p className="text-2xl font-bold text-white mt-1">
                            ${plan.price}
                            <span className="text-sm font-normal text-white/60">
                              /month
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-white/80">
                            {plan.posts_per_month === 0
                              ? "Unlimited"
                              : `${plan.posts_per_month} posts/month`}
                          </span>
                        </div>
                        {plan.features && plan.features.length > 0 && (
                          <ul className="space-y-2 mt-3">
                            {plan.features.map((feature, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-white/70"
                              >
                                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={shouldDisableButton}
                        className={`w-full px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 ${
                          isCurrentPlan
                            ? "bg-green-600 cursor-default"
                            : shouldDisableButton
                            ? "bg-gray-600 cursor-not-allowed opacity-50"
                            : isRecommended
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 cursor-pointer"
                            : "bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer"
                        }`}
                      >
                        {isCurrentPlan ? "Current Plan" : shouldDisableButton ? "Use Current Plan First" : "Subscribe"}
                      </button>
                    </div>
                  );
                })}
              </div>


              {/* Footer Info */}
              <div className="text-center space-y-2 text-white/60 text-sm pt-6">
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
          paymentType="subscription"
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

