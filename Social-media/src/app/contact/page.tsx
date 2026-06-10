import type { Metadata } from "next";
import StructuredData from "../../../components/Shared/StructuredData/StructuredData";
import LandingFooter from "../LandingFooter";
import LandingHeader from "../LandingHeader";
import { corePageMetadata, siteUrl } from "../seoPageContent";
import ContactForm from "./ContactForm";

const page = corePageMetadata.contact;

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: page.title,
  description:
    "Get in touch with the Interdimensional Cafe team. Questions about the quantum science forum, metaphysical marketplace, moderation, membership or your account? Reach out through our contact form.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
};

const contactStructuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: page.h1,
  description:
    "Get in touch with the Interdimensional Cafe team. Questions about the quantum science forum, metaphysical marketplace, moderation, membership or your account? Reach out through our contact form.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans flex flex-col justify-between overflow-x-clip selection:bg-[#F6339A] selection:text-white">
      <StructuredData data={contactStructuredData} />
      <LandingHeader />
      <main className="w-full max-w-[1440px] mx-auto px-6 py-16 md:py-24">
        <div className="seo-fade-up mx-auto max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-[64px]">
            {page.h1}
          </h1>
          <p className="mt-6 text-base leading-8 text-zinc-300 md:text-xl">
            Have a question about the community, marketplace or your account?
            Fill out the form below and we will get back to you as soon as
            possible.
          </p>
          <div className="seo-fade-up seo-fade-up-delay mt-10">
            <ContactForm />
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
