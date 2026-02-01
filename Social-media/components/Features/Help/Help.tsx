"use client";
import React, { useState } from 'react';
import { FiHelpCircle, FiSearch, FiBook, FiMessageCircle, FiMail, FiChevronDown, FiChevronRight, FiFileText, FiUsers } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import PageHeader from '../../Shared/PageHeader/PageHeader';

const Help = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', label: 'All Topics', icon: <FiBook className="w-5 h-5" /> },
        { id: 'getting-started', label: 'Getting Started', icon: <FiUsers className="w-5 h-5" /> },
        { id: 'account', label: 'Account', icon: <FiUsers className="w-5 h-5" /> },
        { id: 'communities', label: 'Communities', icon: <FiUsers className="w-5 h-5" /> },
        { id: 'posts', label: 'Posts & Content', icon: <FiFileText className="w-5 h-5" /> },
    ];

    const faqs = [
        {
            id: 1,
            category: 'getting-started',
            question: 'How do I create an account?',
            answer: 'To create an account, click on the "Sign Up" button in the top right corner. Fill in your email address, choose a username and password, and verify your email. Once verified, you can start using all features of our platform.',
        },
        {
            id: 2,
            category: 'account',
            question: 'How do I change my profile picture?',
            answer: 'Go to your profile page and click on your current profile picture. You can then upload a new image from your device. Supported formats include JPG, PNG, and GIF. The image will be automatically resized to fit.',
        },
        {
            id: 3,
            category: 'communities',
            question: 'How do I create a community?',
            answer: 'Navigate to the Communities section in the sidebar and click "Create Community". Fill in the community name, description, and choose privacy settings. You can also upload a banner and icon to customize your community.',
        },
        {
            id: 4,
            category: 'posts',
            question: 'How do I post content?',
            answer: 'Click the "Create Post" button in the navigation bar. You can create text posts, upload images or videos, or share links. Choose the community where you want to post, add tags if needed, and click "Publish".',
        },
        {
            id: 5,
            category: 'account',
            question: 'How do I reset my password?',
            answer: 'Go to the login page and click "Forgot Password". Enter your email address and you will receive a password reset link. Click the link in the email and follow the instructions to set a new password.',
        },
        {
            id: 6,
            category: 'communities',
            question: 'How do I join a community?',
            answer: 'Browse communities using the search function or explore popular communities. When you find a community you like, click the "Join" button. Some communities may require approval from moderators.',
        },
    ];

    const helpResources = [
        {
            icon: <FiBook className="w-6 h-6" />,
            title: 'Documentation',
            description: 'Comprehensive guides and tutorials',
            color: 'from-blue-500 to-cyan-600',
        },
        {
            icon: <FiMessageCircle className="w-6 h-6" />,
            title: 'Community Forum',
            description: 'Get help from other users',
            color: 'from-green-500 to-emerald-600',
        },
        {
            icon: <FiMail className="w-6 h-6" />,
            title: 'Contact Support',
            description: 'Reach out to our support team',
            color: 'from-orange-500 to-red-600',
        },
    ];

    const toggleFaq = (id: number) => {
        setExpandedFaq(expandedFaq === id ? null : id);
    };

    const filteredFaqs = selectedCategory === 'all' 
        ? faqs 
        : faqs.filter(faq => faq.category === selectedCategory);

    return (
        <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
            <div className="p-4 sm:p-6 md:p-8">
                {/* Header Section */}
                <div className="mb-12">
                    <PageHeader
                        icon={<FiHelpCircle className="w-8 h-8 text-white" />}
                        title="Help Center"
                        description="Find answers to common questions, learn how to use our platform, and get the support you need."
                    />
                </div>

                {/* Search Bar */}
                <div className="mb-12">
                    <div className="relative max-w-2xl mx-auto">
                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for help articles, FAQs, or topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-white/40"
                        />
                    </div>
                </div>

                {/* Help Resources */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Help Resources</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {helpResources.map((resource, index) => (
                            <div
                                key={index}
                                className="bg-white/5 rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 text-white">
                                    {resource.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{resource.title}</h3>
                                <p className="text-white/60 text-sm">{resource.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Browse by Category</h2>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                                    selectedCategory === category.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                        : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                                }`}
                            >
                                {category.icon}
                                <span>{category.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* FAQs */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        {filteredFaqs.map((faq) => (
                            <div
                                key={faq.id}
                                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleFaq(faq.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all text-left"
                                >
                                    <span className="font-medium text-white pr-4">{faq.question}</span>
                                    {expandedFaq === faq.id ? (
                                        <FiChevronDown className="w-5 h-5 text-white/60 flex-shrink-0" />
                                    ) : (
                                        <FiChevronRight className="w-5 h-5 text-white/60 flex-shrink-0" />
                                    )}
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        expandedFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="p-4 pt-0 text-white/80">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Support */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl border border-blue-500/30 p-6 md:p-8 text-center">
                    <h3 className="text-2xl font-bold text-white mb-3">Still Need Help?</h3>
                    <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                        Can&apos;t find what you&apos;re looking for? Our support team is here to help you 24/7. Reach out to us and we&apos;ll get back to you as soon as possible.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => router.push('/help-support')}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg"
                        >
                            Contact Support
                        </button>
                        <button 
                            onClick={() => router.push('/main/communities')}
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all"
                        >
                            Visit Community Forum
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Help;

