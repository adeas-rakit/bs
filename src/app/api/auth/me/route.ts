import { getUserFromToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

async function authenticateUser(request: NextRequest) {
    const token = request.headers.get('authorization')?.split(' ')[1] || request.cookies.get('token')?.value;
    if (!token) {
      throw new Error('Token tidak ditemukan');
    }
    const user = await getUserFromToken(token);
    if (!user) {
      throw new Error('User tidak ditemukan');
    }
    return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)

    // Objek user dari getUserFromToken sudah tidak mengandung password,
    // jadi kita bisa langsung mengembalikannya.
    return NextResponse.json({
      user: user
    })

  } catch (error: any) {
    console.error('Auth me error:', error)
    return NextResponse.json({ error: error.message || 'Sesi tidak valid atau telah berakhir.' }, { status: 401 })
  }
}
