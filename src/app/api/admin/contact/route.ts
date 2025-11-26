import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const admin = await db.user.findFirst({
      where: {
        role: 'ADMIN',
      },
      select: {
        phone: true,
      },
    });

    const adminPhone = admin?.phone || '6281234567890'; // Fallback phone number

    return NextResponse.json({ phone: adminPhone });
  } catch (error) {
    console.error('Failed to fetch admin contact:', error);
    return NextResponse.json(
      { phone: '6281234567890', error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
