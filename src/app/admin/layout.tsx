import type { Metadata } from "next";
import ClientWrapper from './ClientWrapper';
import ThemeScript from './ThemeScript';

export const metadata: Metadata = {
  title: "GrowthKit Admin",
  description: "GrowthKit Administration Dashboard",
  icons: {
    icon: '/growthkit-logo-icon.png',
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
        {children}
      </ClientWrapper>
    </>
  );
}
