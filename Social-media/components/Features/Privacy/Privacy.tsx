"use client";
import React, { useState } from 'react';
import { FiShield, FiLock, FiEye, FiEyeOff, FiUser, FiDatabase, FiGlobe, FiChevronDown, FiChevronRight, FiCheck } from 'react-icons/fi';
import PageHeader from '../../Shared/PageHeader/PageHeader';

const Privacy = () => {
    const [expandedSection, setExpandedSection] = useState<number | null>(null);

    const privacySections = [
        {
            id: 1,
            title: 'Information We Collect',
            icon: <FiDatabase className="w-5 h-5" />,
            content: `We collect information that you provide directly to us, including:
            
• Account Information: Username, email address, password, and profile information
• Content: Posts, comments, messages, photos, videos, and other content you create or share
• Usage Data: How you interact with our platform, including pages visited, features used, and time spent
• Device Information: Device type, operating system, browser type, IP address, and unique device identifiers
• Location Data: General location information based on your IP address (with your consent)

We use this information to provide, maintain, and improve our services, personalize your experience, and ensure platform security.`
        },
        {
            id: 2,
            title: 'How We Use Your Information',
            icon: <FiEye className="w-5 h-5" />,
            content: `Your information is used for the following purposes:

• Service Delivery: To provide, maintain, and improve our platform and services
• Personalization: To customize your experience, including content recommendations and personalized feeds
• Communication: To send you updates, notifications, and respond to your inquiries
• Safety & Security: To detect, prevent, and address fraud, abuse, security issues, and harmful content
• Analytics: To understand how our platform is used and improve user experience
• Legal Compliance: To comply with legal obligations and enforce our terms of service

We do not sell your personal information to third parties.`
        },
        {
            id: 3,
            title: 'Data Sharing & Disclosure',
            icon: <FiGlobe className="w-5 h-5" />,
            content: `We may share your information in the following circumstances:

• Public Content: Information you choose to make public (posts, profile information) is visible to other users
• Service Providers: We work with trusted third-party service providers who assist in operating our platform (hosting, analytics, customer support)
• Legal Requirements: When required by law, legal process, or government request
• Safety: To protect the rights, property, or safety of our users, platform, or others
• Business Transfers: In connection with a merger, acquisition, or sale of assets

We require all third parties to respect your privacy and handle your information in accordance with this policy.`
        },
        {
            id: 4,
            title: 'Your Privacy Rights',
            icon: <FiUser className="w-5 h-5" />,
            content: `You have the following rights regarding your personal information:

• Access: Request access to your personal information we hold
• Correction: Update or correct inaccurate information in your account settings
• Deletion: Request deletion of your account and associated data
• Data Portability: Request a copy of your data in a portable format
• Opt-Out: Opt out of certain data collection and processing activities
• Account Controls: Manage privacy settings, visibility preferences, and content sharing options

To exercise these rights, please contact us through our support channels or use the privacy controls in your account settings.`
        },
        {
            id: 5,
            title: 'Data Security',
            icon: <FiLock className="w-5 h-5" />,
            content: `We implement industry-standard security measures to protect your information:

• Encryption: Data is encrypted in transit and at rest using SSL/TLS protocols
• Access Controls: Limited access to personal information on a need-to-know basis
• Security Monitoring: Continuous monitoring for security threats and vulnerabilities
• Regular Audits: Periodic security assessments and penetration testing
• Incident Response: Procedures in place to respond to security incidents

However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.`
        },
        {
            id: 6,
            title: 'Cookies & Tracking Technologies',
            icon: <FiEyeOff className="w-5 h-5" />,
            content: `We use cookies and similar tracking technologies to:

• Essential Cookies: Required for the platform to function properly
• Analytics Cookies: Help us understand how users interact with our platform
• Preference Cookies: Remember your settings and preferences
• Advertising Cookies: Deliver relevant advertisements (with your consent)

You can control cookies through your browser settings. However, disabling certain cookies may affect platform functionality.`
        },
        {
            id: 7,
            title: 'Children\'s Privacy',
            icon: <FiShield className="w-5 h-5" />,
            content: `Our platform is not intended for users under the age of 13 (or the minimum age in your jurisdiction). We do not knowingly collect personal information from children under 13.

If you believe we have collected information from a child under 13, please contact us immediately. We will take steps to delete such information promptly.`
        },
        {
            id: 8,
            title: 'International Data Transfers',
            icon: <FiGlobe className="w-5 h-5" />,
            content: `Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.

By using our platform, you consent to the transfer of your information to these countries. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.`
        },
        {
            id: 9,
            title: 'Changes to This Policy',
            icon: <FiShield className="w-5 h-5" />,
            content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by:

• Posting the updated policy on this page
• Sending you an email notification (if you have provided an email address)
• Displaying a prominent notice on our platform

Your continued use of our platform after changes become effective constitutes acceptance of the updated policy. We encourage you to review this policy periodically.`
        }
    ];

    const privacyFeatures = [
        {
            icon: <FiLock className="w-6 h-6" />,
            title: 'End-to-End Encryption',
            description: 'Your private messages are encrypted and secure',
            color: 'from-blue-500 to-cyan-600',
        },
        {
            icon: <FiEyeOff className="w-6 h-6" />,
            title: 'Privacy Controls',
            description: 'Control who sees your content and profile',
            color: 'from-purple-500 to-pink-600',
        },
        {
            icon: <FiDatabase className="w-6 h-6" />,
            title: 'Data Transparency',
            description: 'Know what data we collect and why',
            color: 'from-green-500 to-emerald-600',
        },
        {
            icon: <FiShield className="w-6 h-6" />,
            title: 'Account Security',
            description: 'Advanced security features to protect your account',
            color: 'from-orange-500 to-red-600',
        },
    ];

    const toggleSection = (id: number) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    return (
        <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
            <div className="p-4 sm:p-6 md:p-8">
                {/* Header Section */}
                <div className="mb-12">
                    <PageHeader
                        icon={<FiShield className="w-8 h-8 text-white" />}
                        title="Privacy Policy"
                        description="Your privacy is important to us. This policy explains how we collect, use, protect, and share your information when you use our platform."
                    />
                    <p className="text-white/60 text-sm  text-center">
                        Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Privacy Features */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Your Privacy Matters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {privacyFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white/5 rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all"
                            >
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 text-white">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-white/60 text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Privacy Policy Sections */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Privacy Policy Details</h2>
                    <div className="space-y-3">
                        {privacySections.map((section) => (
                            <div
                                key={section.id}
                                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
                                            {section.icon}
                                        </div>
                                        <span className="font-medium text-white pr-4">{section.title}</span>
                                    </div>
                                    {expandedSection === section.id ? (
                                        <FiChevronDown className="w-5 h-5 text-white/60 flex-shrink-0" />
                                    ) : (
                                        <FiChevronRight className="w-5 h-5 text-white/60 flex-shrink-0" />
                                    )}
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        expandedSection === section.id ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="p-4 pt-0 text-white/80 whitespace-pre-line leading-relaxed">
                                        {section.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Key Privacy Points */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Key Privacy Commitments</h2>
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-2xl border border-purple-500/30 p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                'We never sell your personal information',
                                'You control your privacy settings',
                                'Your data is encrypted and secure',
                                'Transparent about data collection',
                                'Easy account deletion available',
                                'Regular security audits conducted',
                            ].map((point, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <FiCheck className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white/90">{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-2xl border border-purple-500/30 p-6 md:p-8 text-center">
                    <h3 className="text-2xl font-bold text-white mb-3">Questions About Privacy?</h3>
                    <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                        If you have questions about this Privacy Policy or our privacy practices, please contact our privacy team. We&apos;re committed to protecting your privacy and will respond to your inquiries promptly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg">
                            Contact Privacy Team
                        </button>
                        <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all">
                            Manage Privacy Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Privacy;

