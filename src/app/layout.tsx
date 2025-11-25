import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AppWrapper from './AppWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcoNow",
  description: "Aplikasi modern untuk mengelola bank sampah dengan sistem digital yang efisien",
  keywords: ["Bank Sampah", "Digital", "Desa", "Non-organik", "Organik", "Sampah", "Lingkungan"],
  authors: [{ name: "Adeas Studio" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "EcoNow",
    description: "Aplikasi modern untuk mengelola bank sampah dengan sistem digital yang efisien",
    url: "https://econow.com",
    siteName: "EcoNow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoNow",
    description: "Aplikasi modern untuk mengelola bank sampah dengan sistem digital yang efisien",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppWrapper>
          {children}
        </AppWrapper>
        <Toaster />
      </body>
    </html>
  );
}
