import { useInfiniteQuery } from "@tanstack/react-query";
import { getStoredAccessToken } from "@/lib/auth";
import { PostItem } from "@/store/postApi";

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || "https://socialmedia.lumivancelabs.com/";

interface NewsFeedResponse {
  data?: PostItem[];
  results?: PostItem[] | {
    data?: PostItem[];
  };
  posts?: PostItem[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

const fetchNewsFeed = async ({ pageParam = 1 }): Promise<NewsFeedResponse> => {
  const token = getStoredAccessToken();
  const url = `${baseUrl}api/posts/news_feed/?page=${pageParam}`;
  
  const response = await fetch(url, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch news feed");
  }

  return response.json();
};

export const useNewsFeedInfinite = () => {
  return useInfiniteQuery({
    queryKey: ["newsFeed"],
    queryFn: fetchNewsFeed,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Check if there's a next page
      if (lastPage.next && lastPage.next !== null && lastPage.next !== '') {
        try {
          // Extract page number from next URL
          const url = new URL(lastPage.next);
          const page = url.searchParams.get("page");
          return page ? parseInt(page, 10) : undefined;
        } catch {
          // If URL parsing fails, increment page number
          return allPages.length + 1;
        }
      }
      return undefined;
    },
    select: (data) => {
      // Flatten all pages into a single array of posts
      const allPosts: PostItem[] = [];
      
      data.pages.forEach((page) => {
        let posts: PostItem[] = [];
        
        // Handle different response structures
        if (Array.isArray(page.data)) {
          posts = page.data;
        } else if (Array.isArray(page.posts)) {
          posts = page.posts;
        } else if (page.results) {
          if (Array.isArray(page.results)) {
            posts = page.results;
          } else if (page.results.data && Array.isArray(page.results.data)) {
            posts = page.results.data;
          }
        }
        
        allPosts.push(...posts);
      });
      
      return {
        pages: data.pages,
        pageParams: data.pageParams,
        posts: allPosts,
      };
    },
  });
};

