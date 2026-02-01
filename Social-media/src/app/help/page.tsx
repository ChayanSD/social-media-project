import type { Metadata } from 'next';
import Help from '../../../components/Features/Help/Help';
import StructuredData from '../../../components/Shared/StructuredData/StructuredData';

// Force static generation at build time
export const dynamic = 'force-static';
// Revalidate every 24 hours (ISR - Incremental Static Regeneration)
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Help Center - Get Support & Answers | Inter Cafe',
  description: 'Find answers to common questions, learn how to use our platform, and get help with account, communities, posts, and more. Comprehensive help center with FAQs and guides.',
  keywords: ['help', 'support', 'FAQ', 'guide', 'tutorial', 'how to', 'questions', 'answers'],
  openGraph: {
    title: 'Help Center - Get Support & Answers | Inter Cafe',
    description: 'Find answers to common questions and learn how to use our platform.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Help Center - Get Support & Answers | Inter Cafe',
    description: 'Find answers to common questions and learn how to use our platform.',
  },
};

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I create an account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'To create an account, click on the "Sign Up" button in the top right corner. Fill in your email address, choose a username and password, and verify your email. Once verified, you can start using all features of our platform.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I change my profile picture?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Go to your profile page and click on your current profile picture. You can then upload a new image from your device. Supported formats include JPG, PNG, and GIF. The image will be automatically resized to fit.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I create a community?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Navigate to the Communities section in the sidebar and click "Create Community". Fill in the community name, description, and choose privacy settings. You can also upload a banner and icon to customize your community.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I post content?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Click the "Create Post" button in the navigation bar. You can create text posts, upload images or videos, or share links. Choose the community where you want to post, add tags if needed, and click "Publish".',
      },
    },
  ],
};

/**
 * Public Help Page - Accessible without login
 */
export default function HelpPage() {
  return (
    <>
      <StructuredData data={faqStructuredData} />
      <div>
        <Help />
      </div>
    </>
  );
}

