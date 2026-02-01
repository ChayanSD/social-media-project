"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { PieChart } from "@/components/PieChart";
import { LineChart } from "@/components/LineChart";
import { PostAnalyticsChart } from "@/components/PostAnalyticsChart";
import { UserAnalyticsChart } from "@/components/UserAnalyticsChart";
import { ServiceAnalyticsChart } from "@/components/ServiceAnalyticsChart";
import { SubscriptionAnalyticsChart } from "@/components/SubscriptionAnalyticsChart";
import { Column, DataTable } from "@/components/DataTable";
import { DateFilter, DateRangePreset, DateRange } from "@/components/admin/DateFilter";
import { useGetDashboardAnalyticsQuery, useGetPostAnalyticsQuery, useGetUserAnalyticsQuery, useGetServiceAnalyticsQuery, useGetSubscriptionAnalyticsQuery } from "@/store/dashboardApi";
import { getApiBaseUrl } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface PostData {
  postHead: string;
  postDate: string;
  totalLikes: string;
  totalComments?: string;
  totalShares?: string;
  user_name: string;
  avatar?: string;
}

// Helper function to calculate date range from preset (matching DateFilter logic)
const getDateRangeForPreset = (preset: DateRangePreset): DateRange | undefined => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  switch (preset) {
    case "all":
      return undefined;
    case "this-week": {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        start_date: formatDate(startOfWeek),
        end_date: formatDate(endOfWeek),
      };
    }
    case "last-week": {
      const dayOfWeek = today.getDay();
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(today.getDate() - dayOfWeek - 7);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      return {
        start_date: formatDate(startOfLastWeek),
        end_date: formatDate(endOfLastWeek),
      };
    }
    case "this-month": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        start_date: formatDate(startOfMonth),
        end_date: formatDate(endOfMonth),
      };
    }
    case "last-month": {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start_date: formatDate(startOfLastMonth),
        end_date: formatDate(endOfLastMonth),
      };
    }
    case "this-year": {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      return {
        start_date: formatDate(startOfYear),
        end_date: formatDate(endOfYear),
      };
    }
    case "last-year": {
      const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
      return {
        start_date: formatDate(startOfLastYear),
        end_date: formatDate(endOfLastYear),
      };
    }
    case "custom":
      return undefined;
    default:
      return undefined;
  }
};

export default function AdminDashboardHome() {
  const { data: analyticsData, isLoading, isError, refetch: refetchData } = useGetDashboardAnalyticsQuery();
  const [loading, setLoading] = useState(false);
  // Date filter state using DateFilter component
  const [postDatePreset, setPostDatePreset] = useState<DateRangePreset>("this-month");
  const [postDateRange, setPostDateRange] = useState<DateRange | undefined>(() => getDateRangeForPreset("this-month"));
  const [userDatePreset, setUserDatePreset] = useState<DateRangePreset>("this-month");
  const [userDateRange, setUserDateRange] = useState<DateRange | undefined>(() => getDateRangeForPreset("this-month"));
  const [serviceDatePreset, setServiceDatePreset] = useState<DateRangePreset>("this-month");
  const [serviceDateRange, setServiceDateRange] = useState<DateRange | undefined>(() => getDateRangeForPreset("this-month"));
  const [subscriptionDatePreset, setSubscriptionDatePreset] = useState<DateRangePreset>("this-month");
  const [subscriptionDateRange, setSubscriptionDateRange] = useState<DateRange | undefined>(() => getDateRangeForPreset("this-month"));

  // Initialize date ranges when presets change
  useEffect(() => {
    if (postDatePreset !== "custom") {
      setPostDateRange(getDateRangeForPreset(postDatePreset));
    }
  }, [postDatePreset]);

  useEffect(() => {
    if (userDatePreset !== "custom") {
      setUserDateRange(getDateRangeForPreset(userDatePreset));
    }
  }, [userDatePreset]);

  useEffect(() => {
    if (serviceDatePreset !== "custom") {
      setServiceDateRange(getDateRangeForPreset(serviceDatePreset));
    }
  }, [serviceDatePreset]);

  useEffect(() => {
    if (subscriptionDatePreset !== "custom") {
      setSubscriptionDateRange(getDateRangeForPreset(subscriptionDatePreset));
    }
  }, [subscriptionDatePreset]);

  const { data: postAnalyticsData, isLoading: isLoadingPostAnalytics, refetch: refetchPostAnalytics } = useGetPostAnalyticsQuery({
    start_date: postDateRange?.start_date,
    end_date: postDateRange?.end_date,
  });

  const { data: userAnalyticsData, isLoading: isLoadingUserAnalytics, refetch: refetchUserAnalytics } = useGetUserAnalyticsQuery({
    start_date: userDateRange?.start_date,
    end_date: userDateRange?.end_date,
  });

  const { data: serviceAnalyticsData, isLoading: isLoadingServiceAnalytics, refetch: refetchServiceAnalytics } = useGetServiceAnalyticsQuery({
    start_date: serviceDateRange?.start_date,
    end_date: serviceDateRange?.end_date,
  });

  const { data: subscriptionAnalyticsData, isLoading: isLoadingSubscriptionAnalytics, refetch: refetchSubscriptionAnalytics } = useGetSubscriptionAnalyticsQuery({
    start_date: subscriptionDateRange?.start_date,
    end_date: subscriptionDateRange?.end_date,
  });

  // Format date helper
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString("en-GB", { month: "short" });
      const year = date.getFullYear();

      return `${day} ${month} ${year}`;
    } catch {
      return "N/A";
    }
  };

  // Format number helper
  const formatNumber = (num: number | undefined) => {
    if (!num) return "0";
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Format currency helper
  const formatCurrency = (num: number | undefined) => {
    if (!num) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Get image URL helper
  const getImageUrl = (image: string | undefined) => {
    if (!image) return "/sheep.jpg";
    if (image.startsWith("http")) return image;
    const baseUrl = getApiBaseUrl();
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = image.startsWith("/") ? image.slice(1) : image;
    return `${cleanBase}/${cleanPath}`;
  };

  // Get user initials helper
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Transform top posts to table data
  const transformPostData = useMemo(() => {
    return (posts: Array<{
      title?: string;
      created_at?: string;
      likes_count?: number;
      comments_count?: number;
      shares_count?: number;
      user_name?: string;
      username?: string;
      avatar?: string;
      author?: { username?: string; avatar?: string };
      media?: string[];
    }>): PostData[] => {
      if (!posts || !Array.isArray(posts)) return [];

      return posts.map((post) => {
        let avatarUrl: string | undefined;
        if (typeof post.avatar === 'string') {
          avatarUrl = post.avatar;
        } else if (post.author?.avatar && typeof post.author.avatar === 'string') {
          avatarUrl = post.author.avatar;
        } else if (post.media && Array.isArray(post.media) && post.media[0] && typeof post.media[0] === 'string') {
          avatarUrl = post.media[0];
        }

        return {
          postHead: post.title || "Untitled Post",
          postDate: formatDate(post.created_at),
          totalLikes: formatNumber(post.likes_count || 0),
          totalComments: formatNumber(post.comments_count || 0),
          totalShares: formatNumber(post.shares_count || 0),
          user_name: post.user_name || post.author?.username || post.username || "Unknown",
          avatar: avatarUrl,
        };
      });
    };
  }, []);

  const mostLikedPosts = useMemo(() => transformPostData(analyticsData?.data?.top_posts?.most_liked || []), [analyticsData, transformPostData]);
  const mostCommentedPosts = useMemo(() => transformPostData(analyticsData?.data?.top_posts?.most_commented || []), [analyticsData, transformPostData]);
  const mostSharedPosts = useMemo(() => transformPostData(analyticsData?.data?.top_posts?.most_shared || []), [analyticsData, transformPostData]);

  const postColumns: Column<PostData>[] = [
    {
      header: 'Avatar',
      accessor: (row) => (
        <div className="flex items-center justify-center">
          {row.avatar ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={getImageUrl(row.avatar)}
                alt={row.user_name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#6B83FA] flex items-center justify-center text-white font-semibold text-sm">
              {getUserInitials(row.user_name)}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Post Title',
      accessor: (row) => (
        <div className="max-w-xs truncate" title={row.postHead}>
          {row.postHead}
        </div>
      )
    },
    {
      header: 'Username',
      accessor: (row) => row.user_name
    },
    {
      header: 'Date',
      accessor: (row) => row.postDate
    },
    {
      header: 'Likes',
      accessor: (row) => row.totalLikes
    },
    {
      header: 'Comments',
      accessor: (row) => row.totalComments || "0"
    },
    {
      header: 'Shares',
      accessor: (row) => row.totalShares || "0"
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 pb-10 animate-pulse">
        {/* MAIN KPI CARDS SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-white/20 bg-black/30 backdrop-blur-sm p-6">
              <div className="h-4 bg-white/10 rounded w-24 mb-3"></div>
              <div className="h-8 bg-white/20 rounded w-20 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-32"></div>
            </div>
          ))}
        </div>

        {/* SECONDARY METRICS SKELETON */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm p-4">
              <div className="h-3 bg-white/10 rounded w-20 mb-2"></div>
              <div className="h-6 bg-white/20 rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* CHARTS SECTION SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-fit w-full border border-[#9BD4F0] rounded-xl p-6 bg-black/30 backdrop-blur-sm">
              <div className="h-6 bg-white/20 rounded w-48 mb-4"></div>
              <div className="h-64 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>

        {/* ENGAGEMENT METRICS SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
              <div className="h-6 bg-white/20 rounded w-40 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-white/10 rounded w-32"></div>
                    <div className="h-4 bg-white/20 rounded w-12"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* MARKETPLACE ANALYTICS SKELETON */}
        <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <div className="h-6 bg-white/20 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx}>
                <div className="h-4 bg-white/10 rounded w-20 mb-2"></div>
                <div className="h-8 bg-white/20 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx}>
                <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
                <div className="h-6 bg-white/20 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP POSTS TABLES SKELETON */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
              <div className="h-6 bg-white/20 rounded w-48 mb-4"></div>
              <div className="space-y-3">
                {/* Table Header */}
                <div className="grid grid-cols-7 gap-4 pb-3 border-b border-white/10">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-4 bg-white/10 rounded"></div>
                  ))}
                </div>
                {/* Table Rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-7 gap-4 py-2">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <div key={j} className="h-4 bg-white/10 rounded"></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-400">Failed to load dashboard analytics</div>
      </div>
    );
  }

  const data = analyticsData.data;
  const handleRefresh = async () => {
    if (loading) return;

    setLoading(true);

    // wait 2 seconds (spin time)
    setTimeout(() => {
      refetchData();
      refetchPostAnalytics();
      refetchUserAnalytics();
      refetchServiceAnalytics();
      refetchSubscriptionAnalytics();
      setLoading(false);
    }, 2000);
  };
  return (
    <div className="space-y-8 pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-y-auto">
      {/* MAIN KPI CARDS - Top Row */}

      <button
        onClick={handleRefresh}
        disabled={loading}
        className="bg-[#6B83FA] px-4 py-3 md:py-4 rounded-[10px] flex items-center text-base md:text-xl hover:bg-[#5a6fe8] transition-colors cursor-pointer absolute top-4 md:top-7 right-4 cursor-pointer z-30"
      >
        <RefreshCw
          className={`w-6 h-6 transition-transform ${loading ? "animate-spin" : ""
            }`}
        />
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Users",
            count: formatNumber(data.total_users),
            subtitle: `${data.user_activity.active_users_30d} active (30d)`,
            color: "#6B83FA"
          },
          {
            title: "Total Posts",
            count: formatNumber(data.total_posts),
            subtitle: `${formatNumber(data.recent_activity_7d.new_posts)} new (7d)`,
            color: "#517EE0"
          },
          {
            title: "Total Engagement",
            count: formatNumber(data.total_engagement),
            subtitle: `${formatNumber(data.total_likes)} likes, ${formatNumber(data.total_comments)} comments, ${formatNumber(data.total_shares)} shares`,
            color: "#10B981"
          },
          {
            title: "Total Communities",
            count: formatNumber(data.total_communities),
            subtitle: `${formatNumber(data.recent_activity_7d.new_communities)} new (7d)`,
            color: "#ff4db8"
          },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/20 bg-black/30 backdrop-blur-sm p-6">
            <h3 className="text-white/70 text-sm font-medium mb-1">{item.title}</h3>
            <p className="text-xs text-white/40 mb-2">
              {item.title === "Total Users" && "Complete count of all registered users in the platform"}
              {item.title === "Total Posts" && "Total number of posts created by all users"}
              {item.title === "Total Engagement" && "Combined count of all likes, comments, and shares"}
              {item.title === "Total Communities" && "Total number of communities created by users"}
            </p>
            <p className="text-3xl font-bold text-white mb-1">{item.count}</p>
            <p className="text-xs text-white/50">{item.subtitle}</p>
          </div>
        ))}
      </div>

      {/* SECONDARY METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { title: "Total Likes", value: formatNumber(data.total_likes), color: "#EF4444" },
          { title: "Total Comments", value: formatNumber(data.total_comments), color: "#3B82F6" },
          { title: "Total Shares", value: formatNumber(data.total_shares), color: "#10B981" },
          { title: "Total Services", value: formatNumber(data.total_products), color: "#F59E0B" },
          { title: "Active (7d)", value: formatNumber(data.user_activity.active_users_7d), color: "#EC4899" },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm p-4">
            <p className="text-white/60 text-xs mb-1">{item.title}</p>
            <p className="text-[10px] text-white/40 mb-2 leading-tight">
              {item.title === "Total Likes" && "All likes received on posts"}
              {item.title === "Total Comments" && "All comments made on posts"}
              {item.title === "Total Shares" && "All posts shared by users"}
              {item.title === "Total Services" && "Total services promoted in marketplace"}
              {item.title === "Active (7d)" && "Users active in the last 7 days"}
            </p>
            <p className="text-xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline - Enhanced */}
        <div className="h-fit w-full border border-[#9BD4F0] rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-1 text-white">Activity Timeline (7 Days)</h2>
          <p className="text-sm text-white/50 mb-4">Daily breakdown of new posts and user registrations over the last 30 days. Helps track platform growth trends.</p>
          <LineChart
            data={data.activity_timeline}
            title=""
          />
        </div>

        {/* Engagement Timeline */}
        <div className="h-fit w-full border border-[#9BD4F0] rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-1 text-white">Engagement Timeline (7 Days)</h2>
          <p className="text-sm text-white/50 mb-4">Daily breakdown of likes, comments, and shares over the last 30 days. Helps track platform engagement trends.</p>
          <LineChart
            data={data.engagement_timeline}
            title=""
            showEngagement={true}
          />
        </div>

        {/* Post Status Distribution */}
        <div className="h-fit w-full border border-[#9BD4F0] rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-1 text-white">Post Status Distribution</h2>
          <p className="text-sm text-white/50 mb-4">Visual breakdown of posts by moderation status. Shows how many posts are approved, rejected, pending review, or saved as drafts.</p>
          <PieChart
            data={{
              labels: ['Approved', 'Rejected', 'Pending', 'Draft'],
              values: [
                data.post_status.approved,
                data.post_status.rejected,
                data.post_status.pending,
                data.post_status.draft,
              ],
              colors: ['#387135', '#B53939', '#F59E0B', '#6B7280'],
            }}
          />
        </div>

        {/* Post Type Distribution */}
        <div className="h-fit w-full border border-[#9BD4F0] rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-1 text-white">Post Type Distribution</h2>
          <p className="text-sm text-white/50 mb-4">Breakdown of posts by content type. Shows the proportion of text-only posts, media posts (images/videos), and link posts.</p>
          <PieChart
            data={{
              labels: ['Text', 'Media', 'Link'],
              values: [
                data.post_types.text,
                data.post_types.media,
                data.post_types.link,
              ],
              colors: ['#3B82F6', '#10B981', '#F59E0B'],
            }}
          />
        </div>
      </div>

      {/* POST ANALYTICS CHART WITH FILTERS */}
      <div className="border border-[#9BD4F0] rounded-xl p-6 bg-black/30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Post Analytics</h2>
            <p className="text-sm text-white/50">Time-series analysis of new post creation over time. Use the date filter to analyze specific time periods.</p>
          </div>
          <DateFilter
            value={postDatePreset}
            dateRange={postDateRange}
            onChange={(preset, range) => {
              setPostDatePreset(preset);
              setPostDateRange(range);
            }}
            label="Date"
          />
        </div>
        {isLoadingPostAnalytics ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-white/60">Loading post analytics...</div>
          </div>
        ) : postAnalyticsData?.data?.post_analytics ? (
          <PostAnalyticsChart data={postAnalyticsData.data.post_analytics} />
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-white/60">No data available</div>
          </div>
        )}
      </div>

      {/* USER ANALYTICS CHART WITH FILTERS */}
      <div className="w-full border border-[#9BD4F0] rounded-xl p-6 bg-black/30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">User Analytics</h2>
            <p className="text-sm text-white/50">Time-series analysis of new user registrations over time. Use the date filter to analyze specific time periods.</p>
          </div>
          <DateFilter
            value={userDatePreset}
            dateRange={userDateRange}
            onChange={(preset, range) => {
              setUserDatePreset(preset);
              setUserDateRange(range);
            }}
            label="Date"
          />
        </div>
        {isLoadingUserAnalytics ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-white/60">Loading user analytics...</div>
          </div>
        ) : userAnalyticsData?.data?.user_analytics ? (
          <UserAnalyticsChart data={userAnalyticsData.data.user_analytics} />
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-white/60">No data available</div>
          </div>
        )}
      </div>

      {/* SERVICE ANALYTICS CHART WITH FILTERS */}
      <div className="w-full border border-[#9BD4F0] rounded-xl p-6 bg-black/30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Service Promotion Analytics</h2>
            <p className="text-sm text-white/50">Time-series analysis of new service promotions posted over time. Use the date filter to analyze specific time periods and see day-wise service promotion trends.</p>
          </div>
          <DateFilter
            value={serviceDatePreset}
            dateRange={serviceDateRange}
            onChange={(preset, range) => {
              setServiceDatePreset(preset);
              setServiceDateRange(range);
            }}
            label="Date"
          />
        </div>
        {isLoadingServiceAnalytics ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-white/60">Loading service analytics...</div>
          </div>
        ) : serviceAnalyticsData?.data?.service_analytics ? (
          <ServiceAnalyticsChart data={serviceAnalyticsData.data.service_analytics} />
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-white/60">No data available</div>
          </div>
        )}
      </div>

      {/* SUBSCRIPTION ANALYTICS CHART WITH FILTERS */}
      <div className="w-full border border-[#9BD4F0] rounded-xl p-6 bg-black/30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Subscription Analytics</h2>
            <p className="text-sm text-white/50">Time-series analysis of new subscriptions created over time. Use the date filter to analyze specific time periods and see day-wise subscription trends.</p>
          </div>
          <DateFilter
            value={subscriptionDatePreset}
            dateRange={subscriptionDateRange}
            onChange={(preset, range) => {
              setSubscriptionDatePreset(preset);
              setSubscriptionDateRange(range);
            }}
            label="Date"
          />
        </div>
        {isLoadingSubscriptionAnalytics ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-white/60">Loading subscription analytics...</div>
          </div>
        ) : subscriptionAnalyticsData?.data?.subscription_analytics ? (
          <SubscriptionAnalyticsChart data={subscriptionAnalyticsData.data.subscription_analytics} />
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-white/60">No data available</div>
          </div>
        )}
      </div>

      {/* ENGAGEMENT METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-1">Engagement Averages</h3>
          <p className="text-xs text-white/50 mb-4">Average engagement metrics per post. Helps understand typical user interaction levels across all posts.</p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Avg Likes/Post</span>
              <span className="text-white font-semibold">{data.engagement_averages.avg_likes_per_post.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Avg Comments/Post</span>
              <span className="text-white font-semibold">{data.engagement_averages.avg_comments_per_post.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Avg Shares/Post</span>
              <span className="text-white font-semibold">{data.engagement_averages.avg_shares_per_post.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-1">Recent Activity (7 Days)</h3>
          <p className="text-xs text-white/50 mb-4">Summary of new content and user activity in the past week. Shows recent platform growth and engagement.</p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">New Users</span>
              <span className="text-white font-semibold">{formatNumber(data.recent_activity_7d.new_users)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">New Posts</span>
              <span className="text-white font-semibold">{formatNumber(data.recent_activity_7d.new_posts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">New Comments</span>
              <span className="text-white font-semibold">{formatNumber(data.recent_activity_7d.new_comments)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">New Likes</span>
              <span className="text-white font-semibold">{formatNumber(data.recent_activity_7d.new_likes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">New Shares</span>
              <span className="text-white font-semibold">{formatNumber(data.recent_activity_7d.new_shares)}</span>
            </div>
          </div>
        </div>

        <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-1">Community Analytics</h3>
          <p className="text-xs text-white/50 mb-4">Breakdown of communities by privacy type (public, restricted, private) and top communities by member count.</p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Public</span>
              <span className="text-white font-semibold">{formatNumber(data.community_analytics.public)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Restricted</span>
              <span className="text-white font-semibold">{formatNumber(data.community_analytics.restricted)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Private</span>
              <span className="text-white font-semibold">{formatNumber(data.community_analytics.private)}</span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-white/50 mb-2">Top Communities</p>
              <div className="space-y-1">
                {data.community_analytics.top_communities.slice(0, 3).map((comm) => (
                  <div key={comm.id} className="flex justify-between text-xs">
                    <span className="text-white/70 truncate">{comm.title}</span>
                    <span className="text-white">{formatNumber(comm.members_count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP POSTS TABLES */}
      <div className="space-y-6">
        <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-1">Top 10 Most Liked Posts</h3>
          <p className="text-sm text-white/50 mb-4">Posts ranked by total number of likes received. Shows the most popular content based on user appreciation.</p>
          <div className="max-h-[350px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DataTable
              title=""
              columns={postColumns}
              data={mostLikedPosts}
            />
          </div>
        </div>

        <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-1">Top 10 Most Commented Posts</h3>
          <p className="text-sm text-white/50 mb-4">Posts ranked by total number of comments. Highlights content that generates the most discussion and conversation.</p>
          <div className="max-h-[350px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DataTable
              title=""
              columns={postColumns}
              data={mostCommentedPosts}
            />
          </div>
        </div>

        <div className="border border-white/20 rounded-xl p-6 bg-black/30 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-1">Top 10 Most Shared Posts</h3>
          <p className="text-sm text-white/50 mb-4">Posts ranked by total number of shares. Identifies content that users find most valuable to share with others.</p>
          <div className="max-h-[350px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DataTable
              title=""
              columns={postColumns}
              data={mostSharedPosts}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
