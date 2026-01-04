import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile-header";
import { CurrencyProviderWrapper } from "@/components/currency-provider-wrapper";
import { UserProviderWrapper } from "@/components/user-provider-wrapper";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProviderWrapper>
          <CurrencyProviderWrapper>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-background pb-20 md:pb-0">
                <MobileHeader />
                {children}
              </main>
              <MobileBottomNav />
            </div>
          </CurrencyProviderWrapper>
        </UserProviderWrapper>
      </body>
    </html>
  );
}
