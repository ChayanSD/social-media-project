"use client";

export type FeedTabValue = "for-you" | "trending" | "products" | "discussions" | "reviews" | "deals";

type FeedTab = {
  value: FeedTabValue;
  label: string;
  count?: number;
};

type FeedTabsProps = {
  tabs: FeedTab[];
  activeTab: FeedTabValue;
  onTabChange: (tab: FeedTabValue) => void;
};

export default function FeedTabs({ tabs, activeTab, onTabChange }: FeedTabsProps) {
  return (
    <div className="sticky top-0 z-10 overflow-x-auto py-2 backdrop-blur">
      <div className="flex items-center w-max min-w-full gap-2 rounded-2xl border border-white/10 bg-[#06133FBF] p-2">
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isActive
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span className="ml-2 text-xs opacity-70">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
