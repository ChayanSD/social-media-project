import { ShoppingBag, MessageSquare, Star, BadgePercent } from "lucide-react";

type FeedItemBadgeProps = {
  type: "product" | "discussion" | "review" | "deal";
  className?: string;
};

const badgeConfig = {
  product: {
    label: "Product",
    icon: ShoppingBag,
    className: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
  },
  discussion: {
    label: "Discussion",
    icon: MessageSquare,
    className: "border-purple-300/20 bg-purple-400/10 text-purple-100",
  },
  review: {
    label: "Review",
    icon: Star,
    className: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  },
  deal: {
    label: "Deal",
    icon: BadgePercent,
    className: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  },
};

export default function FeedItemBadge({ type, className = "" }: FeedItemBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className} ${className}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}
