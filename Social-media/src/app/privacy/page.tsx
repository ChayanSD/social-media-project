import type { Metadata } from 'next';
import Privacy from '../../../components/Features/Privacy/Privacy';
import StructuredData from '../../../components/Shared/StructuredData/StructuredData';

// Force static generation at build time
export const dynamic = 'force-static';
// Revalidate every 24 hours (ISR - Incremental Static Regeneration)
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Privacy Policy - Your Data Protection | Inter Cafe',
  description: 'Learn how we protect your privacy and handle your personal information. Our comprehensive privacy policy explains data collection, usage, security, and your rights.',
  keywords: ['privacy policy', 'data protection', 'privacy', 'data security', 'personal information', 'GDPR', 'user rights'],
  openGraph: {
    title: 'Privacy Policy - Your Data Protection | Inter Cafe',
    description: 'Learn how we protect your privacy and handle your personal information.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy - Your Data Protection | Inter Cafe',
    description: 'Learn how we protect your privacy and handle your personal information.',
  },
};

const privacyStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy',
  description: 'Learn how we protect your privacy and handle your personal information.',
  about: {
    '@type': 'Thing',
    name: 'Privacy Policy',
    description: 'Comprehensive privacy policy explaining data collection, usage, security, and user rights.',
  },
};

/**
 * Public Privacy Page - Accessible without login
 */
export default function PrivacyPage() {
  return (
    <>
      <StructuredData data={privacyStructuredData} />
      <div>
        <Privacy />
      </div>
    </>
  );
}

