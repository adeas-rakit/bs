import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
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
  title: "Bank Sampah - Sistem Manajemen Bank Sampah Digital",
  description: "Aplikasi modern untuk mengelola bank sampah dengan sistem digital yang efisien",
  keywords: ["Bank Sampah", "Digital", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "React"],
  authors: [{ name: "Bank Sampah Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Bank Sampah Digital",
    description: "Sistem manajemen bank sampah modern dan efisien",
    url: "https://chat.z.ai",
    siteName: "Bank Sampah",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bank Sampah Digital",
    description: "Sistem manajemen bank sampah modern dan efisien",
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
