import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FenixBlack.ai GrowthKit",
  description: "Powering growth with intelligent waitlist management and referral systems",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
