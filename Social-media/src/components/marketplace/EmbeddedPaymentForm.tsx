"use client";

import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateSubscriptionWithPaymentMethodMutation,
  useCreatePostPaymentWithPaymentMethodMutation,
} from "@/store/paymentApi";

interface EmbeddedPaymentFormProps {
  planId: number;
  planName: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  paymentType: "subscription" | "one_time";
}

export default function EmbeddedPaymentForm({
  planId,
  planName,
  amount,
  onSuccess,
  onCancel,
  paymentType,
}: EmbeddedPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  
  const [createSubscription] = useCreateSubscriptionWithPaymentMethodMutation();
  const [createPostPayment] = useCreatePostPaymentWithPaymentMethodMutation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe is not loaded. Please refresh the page.");
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Submit elements first to validate the form
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setPaymentStatus("error");
        toast.error(submitError.message || "Please check your payment details");
        setIsProcessing(false);
        return;
      }

      // Create payment method after elements are submitted
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
      });

      if (pmError) {
        setPaymentStatus("error");
        toast.error(pmError.message || "Failed to create payment method");
        setIsProcessing(false);
        return;
      }

      if (!paymentMethod || !paymentMethod.id) {
        setPaymentStatus("error");
        toast.error("Failed to create payment method");
        setIsProcessing(false);
        return;
      }

      // Call backend to create subscription/payment
      let result;
      try {
        if (paymentType === "subscription") {
          if (!planId || planId === 0) {
            throw new Error("Invalid plan ID. Please select a valid subscription plan.");
          }
          console.log("Creating subscription:", { plan_id: planId, payment_method_id: paymentMethod.id });
          result = await createSubscription({
            plan_id: planId,
            payment_method_id: paymentMethod.id,
          }).unwrap();
        } else {
          console.log("Creating post payment:", { payment_method_id: paymentMethod.id });
          result = await createPostPayment({
            payment_method_id: paymentMethod.id,
            return_url: window.location.href,
          }).unwrap();
        }

        if (!result || !result.success) {
          setPaymentStatus("error");
          toast.error(result?.message || "Payment failed");
          setIsProcessing(false);
          return;
        }
      } catch (error: unknown) {
        setPaymentStatus("error");
        // Extract error message from RTK Query error format
        const errorMessage = 
          (error && typeof error === 'object' && 'data' in error && 
           error.data && typeof error.data === 'object' && 'message' in error.data
           ? String(error.data.message)
           : null) ||
          (error && typeof error === 'object' && 'data' in error && 
           error.data && typeof error.data === 'object' && 'error' in error.data
           ? String(error.data.error)
           : null) ||
          (error && typeof error === 'object' && 'message' in error
           ? String(error.message)
           : null) ||
          (error && typeof error === 'object' && 'error' in error
           ? String(error.error)
           : null) ||
          "Payment failed. Please check your payment details and try again.";
        toast.error(errorMessage);
        console.error("Payment error details:", {
          error,
          data: error && typeof error === 'object' && 'data' in error ? error.data : undefined,
          status: error && typeof error === 'object' && 'status' in error ? error.status : undefined,
          message: errorMessage
        });
        setIsProcessing(false);
        return;
      }

      // Handle 3D Secure if required
      if (result.data.requires_action && result.data.client_secret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.data.client_secret
        );

        if (confirmError) {
          setPaymentStatus("error");
          toast.error(confirmError.message || "Payment confirmation failed");
          setIsProcessing(false);
          return;
        }
      }

      // Success!
      setPaymentStatus("success");
      toast.success(
        paymentType === "subscription"
          ? "Subscription activated successfully!"
          : "Payment successful! Post credit added."
      );
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: unknown) {
      setPaymentStatus("error");
      const errorMessage = 
        (error && typeof error === 'object' && 'message' in error
         ? String(error.message)
         : null) ||
        "An error occurred during payment";
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const paymentElementOptions = {
    layout: "tabs" as const,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="border border-white/90 rounded-xl p-4 bg-white/50 ">
        <PaymentElement options={paymentElementOptions} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">
            {paymentType === "subscription"
              ? "Your subscription will auto-renew monthly. Cancel anytime."
              : "One-time payment for a single promotion post."}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing || paymentStatus === "success"}
            className="px-4 py-2 cursor-pointer bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || isProcessing || paymentStatus === "success"}
            className="px-6 py-2 cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : paymentStatus === "success" ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Success!
              </>
            ) : paymentStatus === "error" ? (
              <>
                <XCircle className="w-4 h-4" />
                Try Again
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

