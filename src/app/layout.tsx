import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AppWrapper from './AppWrapper';

const appName = process.env.NEXT_PUBLIC_APP_NAME || "EcoNow";
const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Aplikasi modern untuk mengelola bank sampah dengan sistem digital yang efisien";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://econow.com";
const ogImage = process.env.NEXT_PUBLIC_OG_IMAGE || "/og-image.png";
const twitterHandle = process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@econow";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description: appDescription,
  keywords: ["Bank Sampah", "Digital", "Desa", "Non-organik", "Organik", "Sampah", "Lingkungan"],
  authors: [{ name: "Adeas Studio" }],
  icons: {
    icon: "./logo.svg",
    apple: "./logo.svg",
  },
  themeColor: '#16a34a',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  openGraph: {
    title: appName,
    description: appDescription,
    url: appUrl,
    siteName: appName,
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: appName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: appDescription,
    images: [ogImage],
    creator: twitterHandle,
  },
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: appUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppWrapper>
          {children}
        </AppWrapper>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
