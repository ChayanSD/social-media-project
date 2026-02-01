"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FiUsers, FiTarget, FiHeart, FiAward, FiGlobe, FiZap } from 'react-icons/fi';
import PageHeader from '../../Shared/PageHeader/PageHeader';
import { useGetPublicStatsQuery } from '@/store/authApi';

const AboutUs = () => {
    const [animatedStats, setAnimatedStats] = useState([0, 0, 0, 0]);
    const [hasAnimated, setHasAnimated] = useState(false);
    const statsRef = useRef<HTMLDivElement>(null);
    const timersRef = useRef<NodeJS.Timeout[]>([]);
    const observerRef = useRef<IntersectionObserver | null>(null);
    
    // Fetch stats from API
    const { data: statsData, isLoading: isLoadingStats } = useGetPublicStatsQuery();
    
    // Reset animation when new data arrives
    useEffect(() => {
        if (statsData?.data) {
            setHasAnimated(false);
            setAnimatedStats([0, 0, 0, 0]);
            // Clear any existing timers
            timersRef.current.forEach(timer => clearInterval(timer));
            timersRef.current = [];
        }
    }, [statsData]);

    const values = [
        {
            icon: <FiUsers className="w-6 h-6" />,
            title: 'Community First',
            description: 'We believe in building strong, supportive communities where everyone can connect and share.',
            color: 'from-blue-500 to-cyan-600',
        },
        {
            icon: <FiTarget className="w-6 h-6" />,
            title: 'User-Centric',
            description: 'Your experience and privacy are our top priorities. We design with you in mind.',
            color: 'from-purple-500 to-pink-600',
        },
        {
            icon: <FiHeart className="w-6 h-6" />,
            title: 'Authentic Connections',
            description: 'We foster genuine relationships and meaningful conversations in a safe environment.',
            color: 'from-red-500 to-orange-600',
        },
        {
            icon: <FiZap className="w-6 h-6" />,
            title: 'Innovation',
            description: 'We continuously evolve our platform with cutting-edge features and technology.',
            color: 'from-yellow-500 to-amber-600',
        },
    ];

    // Build stats array from API data
    const stats = useMemo(() => {
        const apiData = statsData?.data;
        if (!apiData) {
            // Return default values while loading
            return [
                { number: '0', label: 'Active Users', targetValue: 0 },
                { number: '0', label: 'Communities', targetValue: 0 },
                { number: '0', label: 'Posts Shared', targetValue: 0 },
                { number: '24/7', label: 'Support', targetValue: null }, // Special case
            ];
        }
        
        // Determine format based on value
        const formatUserValue = (value: number) => {
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K+`;
            return `${value}+`;
        };
        
        const formatPostValue = (value: number) => {
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K+`;
            return `${value}+`;
        };
        
        return [
            { 
                number: formatUserValue(apiData.total_users), 
                label: 'Active Users', 
                targetValue: apiData.total_users 
            },
            { 
                number: `${apiData.total_communities}+`, 
                label: 'Communities', 
                targetValue: apiData.total_communities 
            },
            { 
                number: formatPostValue(apiData.total_posts), 
                label: 'Posts Shared', 
                targetValue: apiData.total_posts 
            },
            { number: '24/7', label: 'Support', targetValue: null }, // Special case
        ];
    }, [statsData]);

    // Parse number with K suffix
    const formatNumber = (value: number, originalFormat: string): string => {
        if (originalFormat.includes('K')) {
            if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}K+`;
            }
            return `${value}+`;
        }
        return `${value}+`;
    };

    // Function to start animation
    const startAnimation = useCallback(() => {
        // Clear any existing timers first
        timersRef.current.forEach(timer => clearInterval(timer));
        timersRef.current = [];
        
        if (isLoadingStats || !statsData?.data) return;
        
        // Check if already animated using a ref to avoid stale closure
        if (hasAnimated) return;
        
        setHasAnimated(true);
        
        const apiData = statsData.data;
        const targetValues = [
            apiData.total_users,
            apiData.total_communities,
            apiData.total_posts,
            null, // Support - no animation
        ];
        
        // Reset animated stats to 0
        setAnimatedStats([0, 0, 0, 0]);
        
        // Animate each stat
        targetValues.forEach((targetValue, index) => {
            if (targetValue === null || targetValue === 0) {
                // For "24/7" or zero values, don't animate
                if (targetValue === 0) {
                    setAnimatedStats((prev) => {
                        const newStats = [...prev];
                        newStats[index] = 0;
                        return newStats;
                    });
                }
                return;
            }

            const duration = 2000; // 2 seconds
            const steps = 60;
            const increment = targetValue / steps;
            const stepDuration = duration / steps;

            let currentStep = 0;
            const timer = setInterval(() => {
                currentStep++;
                const currentValue = Math.min(
                    Math.floor(increment * currentStep),
                    targetValue
                );

                setAnimatedStats((prev) => {
                    const newStats = [...prev];
                    newStats[index] = currentValue;
                    return newStats;
                });

                if (currentStep >= steps) {
                    clearInterval(timer);
                    // Ensure final value is exact
                    setAnimatedStats((prev) => {
                        const newStats = [...prev];
                        newStats[index] = targetValue;
                        return newStats;
                    });
                }
            }, stepDuration);
            
            timersRef.current.push(timer);
        });
    }, [isLoadingStats, statsData, hasAnimated]);

    // Set up intersection observer and trigger animation
    useEffect(() => {
        // Clean up previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        // Don't set up observer if data is still loading
        if (isLoadingStats || !statsData?.data) return;

        const checkVisibilityAndAnimate = () => {
            if (!statsRef.current || hasAnimated) return;
            
            const rect = statsRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const isVisible = rect.top < windowHeight * 1.2 && rect.bottom > -100;
            
            if (isVisible) {
                startAnimation();
            }
        };

        // Check immediately when data loads
        const timeout = setTimeout(checkVisibilityAndAnimate, 100);

        // Set up intersection observer for scroll events
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        startAnimation();
                    }
                });
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        observerRef.current = observer;

        if (statsRef.current) {
            observer.observe(statsRef.current);
        }

        // Also check on scroll as fallback
        const handleScroll = () => {
            if (!hasAnimated) {
                checkVisibilityAndAnimate();
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            clearTimeout(timeout);
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isLoadingStats, statsData, hasAnimated, startAnimation]);

    return (
        <div className="max-w-[1220px] mx-auto px-4 py-8 text-white">
            <div className="p-4 sm:p-6 md:p-8">
                {/* Header Section */}
                <div className="mb-12">
                    <PageHeader
                        icon={<FiUsers className="w-8 h-8 text-white" />}
                        title="About Us"
                        description="We're building a platform where communities thrive, connections flourish, and voices are heard."
                    />
                </div>

                {/* Mission Section */}
                <div className="mb-12">
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl border border-blue-500/30 p-6 md:p-8">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <FiTarget className="w-6 h-6" />
                            Our Mission
                        </h2>
                        <p className="text-white/90 text-lg leading-relaxed">
                            Our mission is to create a vibrant social platform that empowers individuals to connect, share, and build meaningful communities. We strive to provide a safe, inclusive, and engaging environment where every voice matters and authentic relationships can flourish.
                        </p>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mb-12" ref={statsRef}>
                    <h2 className="text-2xl font-semibold mb-6 text-white text-center">Our Impact</h2>
                    {isLoadingStats ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[0, 1, 2, 3].map((index) => (
                                <div
                                    key={index}
                                    className="bg-white/5 rounded-xl border border-white/10 p-6 text-center animate-pulse"
                                >
                                    <div className="h-8 bg-white/10 rounded mb-2"></div>
                                    <div className="h-4 bg-white/5 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className="bg-white/5 rounded-xl border border-white/10 p-6 text-center"
                                >
                                    <div className="text-3xl font-bold text-white mb-2">
                                        {stat.targetValue === null 
                                            ? stat.number 
                                            : formatNumber(animatedStats[index], stat.number)
                                        }
                                    </div>
                                    <div className="text-white/60 text-sm">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Values Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6 text-white text-center">Our Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {values.map((value, index) => (
                            <div
                                key={index}
                                className="bg-white/5 rounded-xl border border-white/10 p-6"
                            >
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 text-white">
                                    {value.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                                <p className="text-white/60 text-sm">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Story Section */}
                <div className="mb-12">
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 md:p-8">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <FiGlobe className="w-6 h-6" />
                            Our Story
                        </h2>
                        <div className="space-y-4 text-white/80 leading-relaxed">
                            <p>
                                Founded with a vision to revolutionize social networking, we set out to create a platform that prioritizes genuine connections over algorithms. We believe that technology should bring people together, not drive them apart.
                            </p>
                            <p>
                                Our journey began with a simple idea: what if social media could be more meaningful, more community-focused, and more respectful of user privacy? This question led us to build a platform where communities can thrive organically, where content is created by real people for real people, and where every user feels valued and heard.
                            </p>
                            <p>
                                Today, we're proud to serve thousands of users across hundreds of communities. But we're just getting started. We're constantly innovating, listening to our community, and working to make our platform even better.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Join Us Section */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-2xl border border-purple-500/30 p-6 md:p-8 text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiAward className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Join Our Community</h3>
                    <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                        Be part of a growing community of creators, thinkers, and innovators. Together, we're building something special.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;

