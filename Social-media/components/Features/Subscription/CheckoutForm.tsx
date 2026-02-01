"use client";

import React, { useState } from "react";
import {
    Elements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useSearchParams } from "next/navigation";

const publishableKey = 'pk_test_51SDMM6EbRBgxQBnKhhbdORl3dN1inJygwuDNSTGyxKfbv7ClnLoPBVzH7A859X5vPy8OINFnaLzUSXnCdrgJbwJu00EDdd4Nck';

const stripePromise = loadStripe(publishableKey);
const PaymentForm = ({ plan, amount }: { plan: string, amount: string }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [cardTitle, setCardTitle] = useState("");
    const [saveCard, setSaveCard] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<
        "idle" | "processing" | "success" | "error"
    >("idle");

    console.log(plan, amount)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        setIsLoading(true);
        setPaymentStatus("processing");

        try {
            if (!stripe || !elements) {
                console.error("Stripe not loaded. Please check your configuration.");
                return;
            }

            const { error: paymentMethodError, paymentMethod } =
                await stripe?.createPaymentMethod({
                    type: "card",
                    card: elements.getElement(CardNumberElement)!,
                    billing_details: {
                        name: cardTitle,
                    },
                });

            if (paymentMethodError) {
                setPaymentStatus("error");
                console.error("Payment method error:", paymentMethodError.message);
                return;
            }

            console.log("Payment method created:", paymentMethod);
            setPaymentStatus("success");

            // Reset form
            setCardTitle("");
            setSaveCard(false);

        } catch (err) {
            setPaymentStatus("error");
            console.error("Payment error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: "16px",
                color: "#ffffff",
                "::placeholder": {
                    color: "#aab7c4",
                },
                padding: "12px",
            },
            invalid: {
                color: "#9e2146",
            },
        },
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stripe Card Elements */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-white mb-2">
                        Card Number:
                    </label>
                    <div className="w-full px-3 py-2.5 border border-white/10 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:outline-none">
                        <CardNumberElement options={cardElementOptions} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Expiry Date:
                        </label>
                        <div className="w-full px-3 py-2.5 border border-white/10 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:outline-none">
                            <CardExpiryElement options={cardElementOptions} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            CVC:
                        </label>
                        <div className="w-full px-3 py-2.5 border border-white/10 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:outline-none">
                            <CardCvcElement options={cardElementOptions} />
                        </div>
                    </div>
                </div>
            </div>


            {/* Submit Button */}
            <div className="w-full flex flex-col md:flex-row items-start justify-between gap-4 ">
                <p className="text-xs text-white/60 mb-4">By continuing, you agree to automatic payments for Reddit Premium and to Company's Privacy Policy and Econ Terms. Your Premium subscription will auto-renew yearly for $49.99 (plus tax where applicable). Cancellation must be done at least 24 hours before your subscription ends to avoid renewal. No partial refunds. </p>
                <button
                    type={paymentStatus === "error" ? "button" : "submit"}
                    onClick={paymentStatus === "error" ? () => setPaymentStatus("idle") : undefined}
                    disabled={!stripe || isLoading || paymentStatus === "success"}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 cursor-pointer"
                >
                    {isLoading ? (
                        "Processing..."
                    ) : paymentStatus === "success" ? (
                        "Successful!"
                    ) : paymentStatus === "error" ? (
                        "Try Again"
                    ) : (
                        "Complete Purchase "
                    )}
                </button>
            </div>
        </form>
    );
};

const CheckoutForm = () => {
    const searchParams = useSearchParams()
    const plan = searchParams.get('plan')
    const amount = searchParams.get('amount')
    return (
        <div className="max-w-[1220px] mx-auto bg-[#06133FBF] backdrop-blur-[17.5px] rounded-2xl border border-white/10">
            <div className="max-w-[1640px] mx-auto">
                <div className="flex justify-center">
                    <div className="p-6 rounded-xl w-full max-w-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">
                        {plan === 'monthly' ? 'Get Monthly Premium' : 'Get Yearly Premium'}
                        </h2>
                        <Elements stripe={stripePromise}>
                            <PaymentForm plan={plan || ''} amount={amount || ''} />
                        </Elements>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutForm;