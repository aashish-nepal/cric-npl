import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NPL Cricket Hub — Live NPL scores, stats and news",
    template: "%s | NPL Cricket Hub",
  },
  description:
    "Independent Nepal Premier League coverage: live scores, ball-by-ball commentary, fixtures, results, points table, team and player statistics, analysis and fan polls.",
  applicationName: "NPL Cricket Hub",
  keywords: [
    "NPL live score",
    "Nepal Premier League",
    "NPL points table",
    "NPL fixtures",
    "NPL results",
    "Nepal cricket news",
    "NPL player statistics",
  ],
  authors: [{ name: "NPL Cricket Hub" }],
  creator: "NPL Cricket Hub",
  publisher: "NPL Cricket Hub",
  openGraph: {
    type: "website",
    siteName: "NPL Cricket Hub",
    title: "NPL Cricket Hub — Live NPL scores, stats and news",
    description:
      "Live scores, scorecards, standings, statistics and independent editorial coverage of Nepali cricket.",
    url: "/",
    locale: "en_NP",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPL Cricket Hub",
    description: "Live NPL scores, statistics and independent Nepali cricket coverage.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  category: "sports",
};

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
