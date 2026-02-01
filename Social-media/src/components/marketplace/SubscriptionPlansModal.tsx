"use client";

import React, { useState } from "react";
import {
  useGetSubscriptionPlansQuery,
  useGetSubscriptionUsageQuery,
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

export default function SubscriptionPlansModal({
  isOpen,
  onClose,
  onPaymentSuccess,
}: SubscriptionPlansModalProps) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const { data, isLoading } = useGetSubscriptionPlansQuery();
  const { data: usageData, refetch: refetchUsage } = useGetSubscriptionUsageQuery();

  const plans = data?.data || [];
  const usage = usageData?.data;
  const hasActiveSubscription = usage?.has_subscription && usage?.remaining_posts !== null && usage?.remaining_posts > 0;
  const currentPlanName = usage?.plan_name?.toLowerCase();
  // Only show "Your Plan" if user has remaining posts
  const hasRemainingPosts = (usage?.remaining_posts ?? 0) > 0;

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
            {/* Subscription Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2  xl:grid-cols-4 gap-6">
              {plans.map((plan, index) => {
                const isRecommended = plan.is_recommended || false;
                // Only show "Your Plan" if it's the current plan AND user has remaining posts
                const isCurrentPlan = currentPlanName === plan.name.toLowerCase() && hasRemainingPosts;
                // Disable button only if user has active subscription with remaining posts for a different plan
                const shouldDisableButton = hasActiveSubscription && !isCurrentPlan;
                return (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-300 flex flex-col ${isCurrentPlan
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
                        <p className="xl:text-2xl text-xl font-bold text-white mt-1">
                          ${plan.price}
                          <span className="text-xs font-normal text-white/60">
                            /Month
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
                      className={`w-full px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 ${isCurrentPlan
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
          paymentType="subscription"
          onSuccess={handlePaymentSuccess}
        />
      )}
    </CustomDialog>
  );
}

