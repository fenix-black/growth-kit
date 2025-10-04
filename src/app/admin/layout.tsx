import type { Metadata } from "next";
import ClientWrapper from './ClientWrapper';
import ThemeScript from './ThemeScript';
import AdminLayoutWrapper from './AdminLayoutWrapper';

export const metadata: Metadata = {
  title: "FenixBlack.ai GrowthKit - Admin Dashboard",
  description: "Powering growth with intelligent waitlist management and referral systems - Admin Dashboard",
  icons: {
    icon: [
      { url: '/growthkit-logo-icon-24px.png', sizes: '24x24', type: 'image/png' },
      { url: '/growthkit-logo-icon-alpha.png', sizes: '32x32', type: 'image/png' },
      { url: '/growthkit-logo-icon.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: { url: '/growthkit-logo-icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: { url: '/favicon.ico', type: 'image/x-icon' },
  },
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
        <AdminLayoutWrapper>
          {children}
        </AdminLayoutWrapper>
      </ClientWrapper>
    </>
  );
}
