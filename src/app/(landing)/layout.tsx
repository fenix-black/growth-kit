import type { Metadata } from 'next';
import LandingNav from '@/components/landing/layout/LandingNav';
import LandingFooter from '@/components/landing/layout/LandingFooter';
import LandingPageProvider from '@/components/landing/layout/LandingPageProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';

export const metadata: Metadata = {
  title: 'GrowthKit - Transform Any App Into a Viral Growth Engine',
  description: 'Add referrals, credits, and waitlists to your mini-app in minutes. Built for developers who want enterprise-grade growth features without the complexity.',
  keywords: [
    'growth hacking',
    'referral system',
    'viral marketing', 
    'user acquisition',
    'mini-app growth',
    'SaaS growth',
    'developer tools',
    'API service',
    'Next.js',
    'React SDK'
  ],
  authors: [{ name: 'FenixBlack' }],
  creator: 'FenixBlack',
  icons: {
    icon: [
      { url: '/growthkit-logo-icon-24px.png', sizes: '24x24', type: 'image/png' },
      { url: '/growthkit-logo-icon-alpha.png', sizes: '32x32', type: 'image/png' },
      { url: '/growthkit-logo-icon.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: { url: '/favicon.ico', type: 'image/x-icon' },
  },
  openGraph: {
    title: 'GrowthKit - Transform Any App Into a Viral Growth Engine',
    description: 'Add referrals, credits, and waitlists to your mini-app in minutes. Enterprise-grade growth features made simple.',
    type: 'website',
    locale: 'en_US',
    siteName: 'GrowthKit',
    images: [
      {
        url: '/growthkit-logo-alpha.png',
        width: 1200,
        height: 630,
        alt: 'GrowthKit - Viral Growth Engine for Any App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GrowthKit - Transform Any App Into a Viral Growth Engine',
    description: 'Add referrals, credits, and waitlists to your mini-app in minutes. Enterprise-grade growth features made simple.',
    creator: '@fenixblack',
    images: ['/growthkit-logo-alpha.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <LandingPageProvider>
        <div className="min-h-screen bg-white">
          <LandingNav />
          <main className="pt-16">
            {children}
          </main>
          <LandingFooter />
        </div>
      </LandingPageProvider>
    </LanguageProvider>
  );
}
