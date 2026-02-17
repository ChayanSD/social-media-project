"use client";

import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import EmbeddedPaymentForm from "./EmbeddedPaymentForm";
import CustomDialog from "@/components/ui/CustomDialog";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51Q7CdfLx5KAnXwY6x7FsarUIy9l3sftmhY7X5Ear4VFso2xPlQ97BrcN41KJJK66wGVy96DrlQvyNfYRBWUwKJUH00bv4w4ucv"
);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: number;
  planName: string;
  amount: number;
  billingLabel?: string;
  onSuccess?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  planId,
  planName,
  amount,
  billingLabel,
  onSuccess,
}: PaymentModalProps) {
  // Ensure amount is a number
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
    // Note: onSuccess callback should handle refetching data
    // No need to reload the entire page
  };

  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={onClose}
      title={`Complete Payment - ${planName}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-2">
            ${numericAmount.toFixed(2)}
          </p>
          <p className="text-white/60">
            {billingLabel ? `Subscription billed every ${billingLabel}` : "Subscription"}
          </p>
        </div>

        {stripePromise && (
          <Elements
            stripe={stripePromise}
            options={{
              mode: "subscription",
              amount: Math.round(numericAmount * 100), // Convert to cents
              currency: "usd",
              paymentMethodCreation: "manual",
            }}
          >
            <EmbeddedPaymentForm
              planId={planId}
              planName={planName}
              amount={numericAmount}
              billingLabel={billingLabel}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </Elements>
        )}
      </div>
    </CustomDialog>
  );
}
