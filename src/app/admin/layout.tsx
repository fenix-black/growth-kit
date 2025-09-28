import type { Metadata } from "next";
import ClientWrapper from './ClientWrapper';
import ThemeScript from './ThemeScript';

export const metadata: Metadata = {
  title: "FenixBlack.ai GrowthKit - Admin Dashboard",
  description: "Powering growth with intelligent waitlist management and referral systems - Admin Dashboard",
  icons: [
    {
      url: '/favicon-16x16.png',
      sizes: '16x16',
      type: 'image/png',
    },
    {
      url: '/favicon-32x32.png',
      sizes: '32x32',
      type: 'image/png',
    },
    {
      url: '/favicon-48x48.png',
      sizes: '48x48',
      type: 'image/png',
    },
    {
      url: '/favicon-64x64.png',
      sizes: '64x64',
      type: 'image/png',
    }
  ],
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ThemeScript />
      <ClientWrapper>
        {children}
      </ClientWrapper>
    </>
  );
}
