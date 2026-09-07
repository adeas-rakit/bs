import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'EcoNow';
  const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Aplikasi modern untuk mengelola bank sampah dengan sistem digital yang efisien';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://econow.com';

  const manifest = {
    name: appName,
    short_name: appName,
    description: appDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
