"use client";
import React, { useState } from 'react';
import { FiTrendingUp, FiHash, FiUsers, FiMessageCircle, FiHeart, FiShare2, FiClock, FiFilter, FiSearch } from 'react-icons/fi';
import { IoTrendingUp } from 'react-icons/io5';
import { RiMenuSearchLine } from 'react-icons/ri';

const Topics = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('trending');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    const categories = [
        { id: 'trending', label: 'Trending', icon: <FiTrendingUp className="w-5 h-5" /> },
        { id: 'technology', label: 'Technology', icon: <FiHash className="w-5 h-5" /> },
        { id: 'science', label: 'Science', icon: <FiHash className="w-5 h-5" /> },
        { id: 'entertainment', label: 'Entertainment', icon: <FiHash className="w-5 h-5" /> },
        { id: 'sports', label: 'Sports', icon: <FiHash className="w-5 h-5" /> },
        { id: 'lifestyle', label: 'Lifestyle', icon: <FiHash className="w-5 h-5" /> },
    ];

    const trendingTopics = [
        {
            id: 1,
            name: 'Artificial Intelligence',
            hashtag: '#AI',
            posts: 1250,
            members: 45000,
            trend: '+12%',
            category: 'technology',
            description: 'Discuss the latest developments in AI, machine learning, and automation.',
        },
        {
            id: 2,
            name: 'Climate Change',
            hashtag: '#ClimateAction',
            posts: 980,
            members: 32000,
            trend: '+8%',
            category: 'science',
            description: 'Join the conversation about environmental sustainability and climate solutions.',
        },
        {
            id: 3,
            name: 'Gaming',
            hashtag: '#Gaming',
            posts: 2100,
            members: 78000,
            trend: '+15%',
            category: 'entertainment',
            description: 'Share your gaming experiences, reviews, and connect with fellow gamers.',
        },
        {
            id: 4,
            name: 'Fitness',
            hashtag: '#Fitness',
            posts: 1560,
            members: 55000,
            trend: '+10%',
            category: 'lifestyle',
            description: 'Get motivated, share workout routines, and achieve your fitness goals together.',
        },
        {
            id: 5,
            name: 'Crypto & Blockchain',
            hashtag: '#Crypto',
            posts: 890,
            members: 28000,
            trend: '+5%',
            category: 'technology',
            description: 'Discuss cryptocurrency, blockchain technology, and digital assets.',
        },
        {
            id: 6,
            name: 'Travel',
            hashtag: '#Travel',
            posts: 1340,
            members: 42000,
            trend: '+9%',
            category: 'lifestyle',
            description: 'Share travel tips, destinations, and amazing experiences from around the world.',
        },
    ];

    const recentPosts = [
        {
            id: 1,
            topic: 'Artificial Intelligence',
            title: 'The Future of AI in Healthcare',
            author: 'TechEnthusiast',
            upvotes: 234,
            comments: 45,
            time: '2h ago',
        },
        {
            id: 2,
            topic: 'Climate Change',
            title: 'Renewable Energy Breakthroughs in 2024',
            author: 'EcoWarrior',
            upvotes: 189,
            comments: 32,
            time: '4h ago',
        },
        {
            id: 3,
            topic: 'Gaming',
            title: 'Best Indie Games of the Year',
            author: 'GameReviewer',
            upvotes: 567,
            comments: 89,
            time: '6h ago',
        },
        {
            id: 4,
            topic: 'Fitness',
            title: 'Home Workout Routines That Actually Work',
            author: 'FitnessGuru',
            upvotes: 312,
            comments: 67,
            time: '8h ago',
        },
    ];

    const filteredTopics = selectedCategory === 'trending'
        ? trendingTopics
        : trendingTopics.filter(topic => topic.category === selectedCategory);

    return (
        <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
            <div className="page-container">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <RiMenuSearchLine className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                            Explore Topics
                        </h1>
                    </div>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Discover trending topics, join discussions, and connect with communities that share your interests.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-12">
                    <div className="relative max-w-2xl mx-auto">
                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search topics, hashtags, or communities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-white/40"
                        />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Browse Categories</h2>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                                    selectedCategory === category.id
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                                        : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                                }`}
                            >
                                {category.icon}
                                <span>{category.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Trending Topics Grid */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-white">
                            {selectedCategory === 'trending' ? 'Trending Topics' : `${categories.find(c => c.id === selectedCategory)?.label} Topics`}
                        </h2>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all">
                            <FiFilter className="w-4 h-4" />
                            <span>Filter</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTopics.map((topic) => (
                            <div
                                key={topic.id}
                                className="bg-white/5 rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer"
                                onClick={() => setSelectedTopic(selectedTopic === topic.name ? null : topic.name)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                            <FiHash className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{topic.name}</h3>
                                            <p className="text-sm text-purple-400">{topic.hashtag}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                                        <IoTrendingUp className="w-4 h-4" />
                                        <span>{topic.trend}</span>
                                    </div>
                                </div>
                                <p className="text-white/60 text-sm mb-4">{topic.description}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-white/60">
                                            <FiMessageCircle className="w-4 h-4" />
                                            <span>{topic.posts.toLocaleString()} posts</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-white/60">
                                            <FiUsers className="w-4 h-4" />
                                            <span>{topic.members.toLocaleString()} members</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full mt-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg text-white font-medium transition-all">
                                    Join Topic
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Posts */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6 text-white">Recent Discussions</h2>
                    <div className="space-y-4">
                        {recentPosts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-white/5 rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                                                {post.topic}
                                            </span>
                                            <span className="text-white/40 text-sm">by {post.author}</span>
                                            <span className="text-white/40 text-sm flex items-center gap-1">
                                                <FiClock className="w-3 h-3" />
                                                {post.time}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <button className="flex items-center gap-2 text-white/60 hover:text-red-400 transition-colors">
                                        <FiHeart className="w-4 h-4" />
                                        <span>{post.upvotes}</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-white/60 hover:text-blue-400 transition-colors">
                                        <FiMessageCircle className="w-4 h-4" />
                                        <span>{post.comments}</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-white/60 hover:text-green-400 transition-colors">
                                        <FiShare2 className="w-4 h-4" />
                                        <span>Share</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Topic CTA */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-2xl border border-purple-500/30 p-6 md:p-8 text-center">
                    <h3 className="text-2xl font-bold text-white mb-3">Can&apos;t Find Your Topic?</h3>
                    <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                        Start a new topic and create a community around your interests. Share your passion and connect with like-minded people.
                    </p>
                    <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg">
                        Create New Topic
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Topics;

