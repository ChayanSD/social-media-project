"use client";

import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import {
  useGetSubscriptionPlansQuery,
  useCreateSubscriptionCheckoutMutation,
  useCreatePostPaymentCheckoutMutation,
  SubscriptionPlan,
} from "@/store/marketplaceApi";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SubscriptionPlansModal({
  isOpen,
  onClose,
  onSuccess,
}: SubscriptionPlansModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const { data: plansData, isLoading } = useGetSubscriptionPlansQuery();
  const [createSubscriptionCheckout, { isLoading: isCreatingSubscription }] =
    useCreateSubscriptionCheckoutMutation();
  const [createPostPayment, { isLoading: isCreatingPostPayment }] =
    useCreatePostPaymentCheckoutMutation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const plans = plansData?.data || [];

  useEffect(() => {
    // Check for success/cancel from Stripe redirect
    const success = searchParams?.get("success");
    const canceled = searchParams?.get("canceled");

    if (success === "true") {
      toast.success("Payment successful! Your subscription is now active.");
      onSuccess?.();
      onClose();
      // Clean URL
      router.replace("/marketplace/promote");
    } else if (canceled === "true") {
      toast.info("Payment canceled.");
      // Clean URL
      router.replace("/marketplace/promote");
    }
  }, [searchParams, onSuccess, onClose, router]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!plan.stripe_price_id) {
      toast.error("This plan is not available for subscription.");
      return;
    }

    try {
      const result = await createSubscriptionCheckout({
        plan_id: plan.id,
        success_url: `${window.location.origin}/marketplace/promote?success=true`,
        cancel_url: `${window.location.origin}/marketplace/promote?canceled=true`,
      }).unwrap();

      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create checkout session");
      }
    }
  };

  const handleBuyPost = async () => {
    try {
      const result = await createPostPayment({
        success_url: `${window.location.origin}/marketplace/promote?success=true`,
        cancel_url: `${window.location.origin}/marketplace/promote?canceled=true`,
      }).unwrap();

      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create checkout session");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-white/20 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : (
            <>
              {/* Subscription Plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6  rounded-xl border-2 transition-all ${
                      selectedPlan === plan.id
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/20 bg-white/5"
                    }`}
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {plan.display_name}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">
                          ${plan.price}
                        </span>
                        <span className="text-white/60">/month</span>
                      </div>
                    </div>

                    <div className="mb-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-400" />
                        <span className="text-white">
                          {plan.posts_per_month === 0
                            ? "Unlimited"
                            : `${plan.posts_per_month}`}{" "}
                          posts/month
                        </span>
                      </div>
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-400" />
                          <span className="text-white/80 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isCreatingSubscription || !plan.stripe_price_id}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingSubscription ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : plan.stripe_price_id ? (
                        "Subscribe"
                      ) : (
                        "Coming Soon"
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Pay Per Post Option */}
              <div className="border-t border-white/10 pt-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Pay Per Post
                  </h3>
                  <p className="text-white/60 mb-4">
                    Don&apos;t need a subscription? Purchase individual posts for $2.99
                    each.
                  </p>
                  <button
                    onClick={handleBuyPost}
                    disabled={isCreatingPostPayment}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingPostPayment ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Buy 1 Post - $2.99"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

