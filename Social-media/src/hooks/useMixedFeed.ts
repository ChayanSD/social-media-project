import { useMemo } from "react";
import { useNewsFeedInfinite } from "@/hooks/useNewsFeedInfinite";
import { MarketplaceItem, useGetMarketplaceItemsQuery } from "@/store/marketplaceApi";
import { PostItem } from "@/store/postApi";

export type MixedFeedItem =
  | {
      id: string;
      type: "post";
      createdAt?: string;
      searchableText: string;
      raw: PostItem;
    }
  | {
      id: string;
      type: "product";
      createdAt?: string;
      searchableText: string;
      raw: MarketplaceItem;
    };

type ProductFeedItem = Extract<MixedFeedItem, { type: "product" }>;
type PostFeedItem = Extract<MixedFeedItem, { type: "post" }>;

const extractMarketplaceItems = (
  response: ReturnType<typeof useGetMarketplaceItemsQuery>["data"]
): MarketplaceItem[] => {
  const rawItems = (response?.data ?? response?.results?.data ?? response?.items ?? []) as MarketplaceItem[];
  return rawItems.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    return !status || status === "published" || status === "approved";
  });
};

const getPostSearchText = (post: PostItem) => {
  return [
    post.title,
    post.content,
    post.user_name,
    post.username,
    post.author?.name,
    post.author?.username,
    ...(post.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const getProductSearchText = (item: MarketplaceItem) => {
  return [
    item.title,
    (item as { name?: string }).name,
    item.description,
    item.category,
    item.category_name,
    item.subcategory,
    item.subcategory_name,
    item.sub_category_name,
    item.location,
    item.seller?.display_name,
    item.seller?.username,
    (item as { user_name?: string }).user_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const interleaveFeed = (posts: PostFeedItem[], products: ProductFeedItem[]): MixedFeedItem[] => {
  if (!products.length) return posts;
  if (!posts.length) return products;

  const result: MixedFeedItem[] = [];
  let productIndex = 0;

  posts.forEach((post, index) => {
    result.push(post);

    const shouldInsertProduct = index === 1 || (index > 1 && (index + 1) % 4 === 0);
    if (shouldInsertProduct && products[productIndex]) {
      result.push(products[productIndex]);
      productIndex += 1;
    }
  });

  return result.concat(products.slice(productIndex, productIndex + 3));
};

export const useMixedFeed = (searchQuery = "") => {
  const newsFeed = useNewsFeedInfinite();
  const marketplace = useGetMarketplaceItemsQuery({ page: 1 });

  const normalized = useMemo(() => {
    const postItems: PostFeedItem[] = (newsFeed.data?.posts || []).map((post) => ({
      id: `post-${post.id}`,
      type: "post",
      createdAt: post.created_at,
      searchableText: getPostSearchText(post),
      raw: post,
    }));

    const productItems: ProductFeedItem[] = extractMarketplaceItems(marketplace.data).map((item) => ({
      id: `product-${item.id}`,
      type: "product",
      createdAt: item.created_at || item.updated_at,
      searchableText: getProductSearchText(item),
      raw: item,
    }));

    const query = searchQuery.trim().toLowerCase();
    const filteredPosts = query
      ? postItems.filter((item) => item.searchableText.includes(query))
      : postItems;
    const filteredProducts = query
      ? productItems.filter((item) => item.searchableText.includes(query))
      : productItems;

    const newestProducts = [...filteredProducts].sort((a, b) => {
      const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return right - left;
    });

    return {
      posts: filteredPosts,
      products: filteredProducts,
      mixed: interleaveFeed(filteredPosts, newestProducts),
      trending: interleaveFeed(filteredPosts.slice(0, 6), newestProducts.slice(0, 6)),
    };
  }, [marketplace.data, newsFeed.data, searchQuery]);

  return {
    ...normalized,
    newsFeed,
    marketplace,
    isLoading: newsFeed.isLoading || marketplace.isLoading,
    isError: newsFeed.isError || marketplace.isError,
    refetch: () => {
      newsFeed.refetch();
      marketplace.refetch();
    },
  };
};
