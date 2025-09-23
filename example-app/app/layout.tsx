import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GrowthKit Test App",
  description: "Testing GrowthKit SDK Features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">GrowthKit Test App</h1>
            <div className="flex gap-4">
              <a href="/" className="hover:underline">Home</a>
              <a href="/waitlist" className="hover:underline">Waitlist</a>
              <a href="/dashboard" className="hover:underline">Dashboard</a>
              <a href="/referral" className="hover:underline">Referral Test</a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
