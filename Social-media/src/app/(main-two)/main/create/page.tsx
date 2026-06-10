import Link from "next/link";
import { HelpCircle, MessageSquareText, ShoppingBag, Star, BadgePercent } from "lucide-react";

const createOptions = [
  {
    title: "Write a Post",
    description: "Start a discussion, share an update or post media with the community.",
    href: "/main/create-post",
    icon: MessageSquareText,
  },
  {
    title: "List a Product",
    description: "Promote a marketplace item or service using the existing listing flow.",
    href: "/marketplace/promote",
    icon: ShoppingBag,
  },
  {
    title: "Ask a Question",
    description: "Get advice before buying, selling or choosing a product.",
    href: "/main/create-post?type=question",
    icon: HelpCircle,
  },
  {
    title: "Write a Review",
    description: "Share your experience with a product, service or community seller.",
    href: "/main/create-post?type=review",
    icon: Star,
  },
  {
    title: "Share a Deal",
    description: "Found a great deal or offer? Let the community know about it.",
    href: "/main/create-post?type=deal",
    icon: BadgePercent,
  },
];

export default function CreatePage() {
  return (
    <main className="px-2 md:px-4 xl:px-10">
      <section className="rounded-2xl border border-white/10 bg-[#06133FBF] p-5 backdrop-blur-[17.5px]">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40">Create</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">What do you want to share?</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
          Choose the right format for a community post, marketplace listing, or product question.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {createOptions.map((option) => {
          const Icon = option.icon;

          return (
            <Link
              key={option.title}
              href={option.href}
              className="group rounded-2xl border border-white/10 bg-[#06133FBF] p-5 backdrop-blur-[17.5px] transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-white transition-colors group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500">
                <Icon size={24} />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-white">{option.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">{option.description}</p>
              <span className="mt-5 inline-flex rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors group-hover:bg-white/15">
                Continue
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
