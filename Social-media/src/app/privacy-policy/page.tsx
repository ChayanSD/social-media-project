import type { Metadata } from "next";
import StructuredData from "../../../components/Shared/StructuredData/StructuredData";
import LandingFooter from "../LandingFooter";
import LandingHeader from "../LandingHeader";
import { corePageMetadata, siteUrl } from "../seoPageContent";

const page = corePageMetadata.privacyPolicy;

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: {
    canonical: `${siteUrl}/privacy-policy`,
  },
};

const privacyStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy Policy - Interdimensional Cafe",
  description: page.description,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans flex flex-col justify-between overflow-x-clip selection:bg-[#F6339A] selection:text-white">
      <StructuredData data={privacyStructuredData} />
      <LandingHeader />
      <main className="w-full max-w-[1440px] mx-auto px-6 py-16 md:py-24">
        <article className="seo-fade-up mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/[0.04] p-6 md:p-10">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Privacy Policy - Interdimensional Cafe
          </h1>

          <div className="mt-10 space-y-8 text-base leading-8 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white">
                1. Introduction
              </h2>
              <p className="mt-3">
                Interdimensional Cafe (&quot;we&quot;, &quot;our&quot;,
                &quot;us&quot;) operates the website interdimensionalcafe.com.
                This Privacy Policy explains how we collect, use, store and
                protect your personal information when you use our platform,
                including our community forum, marketplace and messaging
                features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">
                2. Information We Collect
              </h2>
              <p className="mt-3">
                Account Information: When you register, we collect your display
                name, email address and password. You may optionally provide a
                profile bio, interests and profile image.
              </p>
              <p className="mt-3">
                Forum Activity: Posts, comments, votes and category requests you
                submit are stored and publicly visible to other registered
                members.
              </p>
              <p className="mt-3">
                Marketplace Data: If you list services or products on the
                marketplace, we store listing details including descriptions,
                pricing and category tags.
              </p>
              <p className="mt-3">
                Messages: Private messages between members are stored on our
                servers. Messages are not publicly visible but may be reviewed
                by our moderation system if a report is filed.
              </p>
              <p className="mt-3">
                Usage Data: We collect anonymized usage data through analytics
                tools including pages visited, time on site, device type and
                browser.
              </p>
              <p className="mt-3">
                Cookies: We use cookies for session management, authentication
                and analytics.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">
                3. How We Use Your Information
              </h2>
              <p className="mt-3">
                We use your information to: provide and maintain the platform
                and your account; display your posts and marketplace listings to
                other members; moderate content to ensure community guidelines
                are followed; send account-related emails (registration
                confirmation, password resets, violation notices); improve the
                platform based on aggregated usage data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">
                4. Content Moderation
              </h2>
              <p className="mt-3">
                Interdimensional Cafe uses automated moderation tools to screen
                posts and category requests for harmful content and topic
                relevance. Moderation decisions (approvals, rejections,
                warnings, suspensions) are logged and may be reviewed by a human
                administrator.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">
                5. Data Sharing
              </h2>
              <p className="mt-3">
                We do not sell your personal information to third parties. We
                may share data with: service providers who help operate the
                platform (hosting, email delivery, analytics); law enforcement
                if required by law or to protect the safety of our users;
                third-party payment processors if you make purchases through the
                marketplace.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">
                6. Data Retention
              </h2>
              <p className="mt-3">
                Your account data is retained as long as your account is active.
                If you delete your account, your personal information will be
                removed within 30 days. Forum posts may be anonymized rather
                than deleted to preserve discussion context.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">
                7. Your Rights
              </h2>
              <p className="mt-3">
                You have the right to: access your personal data; request
                correction of inaccurate data; request deletion of your account
                and data; opt out of non-essential emails.
              </p>
              <p className="mt-3">
                To exercise any of these rights, contact us through the contact
                form on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">
                8. Security
              </h2>
              <p className="mt-3">
                We use industry-standard measures to protect your data including
                encrypted connections (SSL/TLS), hashed passwords and access
                controls. However, no method of transmission over the internet
                is completely secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">
                9. Children&apos;s Privacy
              </h2>
              <p className="mt-3">
                Interdimensional Cafe is not intended for users under the age of
                13. We do not knowingly collect information from children under
                13. If you believe a child has provided us with personal
                information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">
                10. Changes to This Policy
              </h2>
              <p className="mt-3">
                We may update this Privacy Policy from time to time. Changes
                will be posted on this page. Continued use of the platform after
                changes are posted constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white">
                11. Contact
              </h2>
              <p className="mt-3">
                If you have questions about this Privacy Policy, please contact
                us through the contact form on our website at
                interdimensionalcafe.com/contact.
              </p>
            </section>
          </div>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}
