import type { Metadata } from 'next';
import HelpSupport from '../../../components/Features/HelpSupport/HelpSupport';
import StructuredData from '../../../components/Shared/StructuredData/StructuredData';

// Force static generation at build time
export const dynamic = 'force-static';
// Revalidate every 24 hours (ISR - Incremental Static Regeneration)
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Support - Contact Us for Help | Inter Cafe',
  description: 'Get in touch with our support team for assistance with your account, technical issues, billing questions, or any other concerns. We\'re here to help 24/7.',
  keywords: ['support', 'contact', 'help', 'customer service', 'assistance', 'technical support', 'billing support'],
  openGraph: {
    title: 'Support - Contact Us for Help | Inter Cafe',
    description: 'Get in touch with our support team for assistance. We\'re here to help 24/7.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Support - Contact Us for Help | Inter Cafe',
    description: 'Get in touch with our support team for assistance. We\'re here to help 24/7.',
  },
};

const contactPageStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Support - Contact Us',
  description: 'Get in touch with our support team for assistance with your account, technical issues, billing questions, or any other concerns.',
  mainEntity: {
    '@type': 'Organization',
    name: 'Inter Cafe',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      availableLanguage: 'English',
    },
  },
};

/**
 * Public Help Support Page - Accessible without login
 */
export default function HelpSupportPage() {
  return (
    <>
      <StructuredData data={contactPageStructuredData} />
      <div>
        <HelpSupport />
      </div>
    </>
  );
}

