"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ExternalLink, MapPin, MessageSquare, Store } from "lucide-react";
import { MarketplaceItem } from "@/store/marketplaceApi";
import { getApiBaseUrl } from "@/lib/utils";
import FeedItemBadge from "../Shared/FeedItemBadge";

type ProductFeedCardProps = {
  item: MarketplaceItem;
  compact?: boolean;
};

const getImageUrl = (image?: string) => {
  if (!image) return "/sheep.jpg";
  if (image.startsWith("http")) return image;
  return `${getApiBaseUrl()}${image.startsWith("/") ? image.slice(1) : image}`;
};

export default function ProductFeedCard({ item, compact = false }: ProductFeedCardProps) {
  const router = useRouter();
  const title = (item.title || (item as { name?: string }).name || "Marketplace item") as string;
  const image = getImageUrl(item.image || item.images?.[0]);
  const sellerName =
    item.seller?.display_name ||
    item.seller?.username ||
    ((item as { user_name?: string }).user_name as string | undefined) ||
    "Community seller";
  const category = item.category_name || item.category || item.subcategory_name || item.sub_category_name;
  const price = ((item as { price?: string | number }).price ?? (item as { amount?: string | number }).amount) as
    | string
    | number
    | undefined;

  const handleCardClick = () => {
    router.push(`/marketplace/buy/${item.id}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#06133FBF] backdrop-blur-[17.5px] transition-all duration-300 hover:border-white/20 hover:scale-[1.01] hover:shadow-lg hover:shadow-purple-500/5">
      <div className={compact ? "flex gap-3 p-3" : "flex flex-col sm:flex-row"}>
        <div
          className={`relative flex-shrink-0 overflow-hidden bg-white/5 ${
            compact ? "h-24 w-24 rounded-xl" : "aspect-[4/3] w-full sm:w-44"
          }`}
        >
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        </div>

        <div className={`flex min-w-0 flex-1 flex-col ${compact ? "gap-2" : "gap-3 p-4"}`}>
          <div className="flex items-start justify-between gap-3">
            <FeedItemBadge type="product" />
            {price !== undefined && (
              <span className="shrink-0 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/20 px-3 py-1 text-sm font-bold text-white">
                {typeof price === 'number' ? `$${price}` : price}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-white">{title}</h3>
            {item.description && !compact && (
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/60">{item.description}</p>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/50">
            <span className="inline-flex min-w-0 items-center gap-1">
              <Store size={14} />
              <span className="truncate">{sellerName}</span>
            </span>
            {item.location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin size={14} />
                <span className="truncate">{item.location}</span>
              </span>
            )}
            {category && <span className="truncate">{String(category)}</span>}
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={14} />
              Discuss
            </span>
          </div>

          {item.link && !compact && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Explore
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
