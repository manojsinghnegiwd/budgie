import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile-header";
import { CurrencyProviderWrapper } from "@/components/currency-provider-wrapper";
import { UserProviderWrapper } from "@/components/user-provider-wrapper";
import { PWAProvider } from "@/components/pwa-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budgie - Budget Tracker",
  description: "Track your expenses and manage your budget",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Budgie",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWAProvider>
          <UserProviderWrapper>
            <CurrencyProviderWrapper>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
                  <MobileHeader />
                  {children}
                </main>
                <MobileBottomNav />
              </div>
            </CurrencyProviderWrapper>
          </UserProviderWrapper>
        </PWAProvider>
      </body>
    </html>
  );
}
