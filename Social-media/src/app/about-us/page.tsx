import type { Metadata } from 'next';
import AboutUs from '../../../components/Features/AboutUs/AboutUs';
import StructuredData from '../../../components/Shared/StructuredData/StructuredData';

// Force static generation at build time
export const dynamic = 'force-static';
// Revalidate every 1 hour (ISR - for stats that update from API)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'About Us - Our Mission & Values | Inter Cafe',
  description: 'Learn about Inter Cafe, our mission to create vibrant communities, our values, and our story. Discover how we\'re building a platform for authentic connections.',
  keywords: ['about us', 'mission', 'values', 'company', 'team', 'story', 'community', 'social platform'],
  openGraph: {
    title: 'About Us - Our Mission & Values | Inter Cafe',
    description: 'Learn about Inter Cafe, our mission to create vibrant communities, and our values.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'About Us - Our Mission & Values | Inter Cafe',
    description: 'Learn about Inter Cafe, our mission to create vibrant communities, and our values.',
  },
};

const aboutStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Us',
  description: 'Learn about Inter Cafe, our mission to create vibrant communities, our values, and our story.',
  mainEntity: {
    '@type': 'Organization',
    name: 'Inter Cafe',
    description: 'A social platform that empowers individuals to connect, share, and build meaningful communities.',
    url: 'https://intercafe.com',
    foundingDate: '2024',
    mission: 'To create a vibrant social platform that empowers individuals to connect, share, and build meaningful communities.',
  },
};

/**
 * Public About Us Page - Accessible without login
 */
export default function AboutUsPage() {
  return (
    <>
      <StructuredData data={aboutStructuredData} />
      <div>
        <AboutUs />
      </div>
    </>
  );
}

