'use client'
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { FiCheck, FiStar, FiAward, FiZap } from 'react-icons/fi';

const Subscription = () => {
    const router = useRouter()
    const [selectedPlan, setSelectedPlan] = useState('yearly');

    const features = [
        { icon: <FiZap className="w-5 h-5" />, text: "Ad-free experience" },
        { icon: <FiAward className="w-5 h-5" />, text: "Premium badge" },
        { icon: <FiStar className="w-5 h-5" />, text: "Exclusive content" },
        { icon: <FiCheck className="w-5 h-5" />, text: "Priority support" }
    ];

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-6">
            <div className="page-container">
                <div className="p-6 md:p-12">
                    
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <FiAward className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                                Get Premium
                            </h1>
                        </div>
                        <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            Unlock exclusive features and enjoy an ad-free experience with our premium subscription.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-blue-400">
                                    {feature.icon}
                                </div>
                                <span className="text-white font-medium">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pricing Plans */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Monthly Plan */}
                        <div 
                            className={`relative cursor-pointer transition-all duration-300 ${
                                selectedPlan === 'monthly' ? 'scale-105' : 'hover:scale-102'
                            }`}
                            onClick={() => setSelectedPlan('monthly')}
                        >
                            <div className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                                selectedPlan === 'monthly' 
                                    ? 'border-blue-500 bg-blue-500/10' 
                                    : 'border-white/20 bg-white/5 hover:border-white/40'
                            }`}>
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-white mb-2">Monthly</h3>
                                    <div className="text-4xl font-bold text-white mb-2">$99</div>
                                </div>
                                {selectedPlan === 'monthly' && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <FiCheck className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Yearly Plan */}
                        <div 
                            className={`relative cursor-pointer transition-all duration-300 ${
                                selectedPlan === 'yearly' ? 'scale-105' : 'hover:scale-102'
                            }`}
                            onClick={() => setSelectedPlan('yearly')}
                        >
                            <div className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                                selectedPlan === 'yearly' 
                                    ? 'border-blue-500 bg-blue-500/10' 
                                    : 'border-white/20 bg-white/5 hover:border-white/40'
                            }`}>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <h3 className="text-2xl font-bold text-white">Yearly</h3>
                                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Save 20%</span>
                                    </div>
                                    <div className="text-4xl font-bold text-white mb-2">$599</div>
                                </div>
                                {selectedPlan === 'yearly' && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <FiCheck className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <button onClick={()=> router.push(`/main/checkout?plan=${selectedPlan} &amount=${selectedPlan === 'monthly' ? 99 : 599}`)} className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
                            Subscribe Now
                        </button>
                    </div>

                    <div className="text-center space-y-2 text-white/60 text-sm">
                       <p>All features are subject to availability and may vary by region.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;