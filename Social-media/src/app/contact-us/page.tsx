import type { Metadata } from 'next';
import ContactUs from '../../../components/Features/ContactUs/ContactUs';
import StructuredData from '../../../components/Shared/StructuredData/StructuredData';

const siteUrl = 'https://interdimensionalcafe.com';

// Force static generation at build time
export const dynamic = 'force-static';
// Revalidate every 24 hours (ISR - Incremental Static Regeneration)
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Contact Us - Get in Touch | Interdimensional Cafe',
  description: 'Contact our team for inquiries, feedback, partnerships or general questions. We\'d love to hear from you and are here to help.',
  keywords: ['contact', 'get in touch', 'inquiry', 'feedback', 'partnership', 'customer service', 'email', 'phone'],
  openGraph: {
    title: 'Contact Us - Get in Touch | Interdimensional Cafe',
    description: 'Contact our team for inquiries, feedback, partnerships or general questions.',
    type: 'website',
    url: `${siteUrl}/contact-us`,
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us - Get in Touch | Interdimensional Cafe',
    description: 'Contact our team for inquiries, feedback, partnerships or general questions.',
  },
  alternates: {
    canonical: `${siteUrl}/contact-us`,
  },
};

const contactStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Us',
  description: 'Contact our team for inquiries, feedback, partnerships or general questions.',
  mainEntity: {
    '@type': 'Organization',
    name: 'Interdimensional Cafe',
    url: siteUrl,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'English',
    },
  },
};

/**
 * Public Contact Us Page - Accessible without login
 */
export default function ContactUsPage() {
  return (
    <>
      <StructuredData data={contactStructuredData} />
      <div>
        <ContactUs />
      </div>
    </>
  )
}
