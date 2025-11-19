'use server'

import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })
    }
    
    const user = await getUserFromToken(token)
    if (!user || !user.unit) {
      return NextResponse.json({ error: 'Akun unit tidak ditemukan' }, { status: 403 })
    }

    const withdrawals = await db.withdrawalRequest.findMany({
      where: {
        unitId: user.unit.id,
      },
      include: {
        nasabah: {
          select: { 
            id: true,
            accountNo: true,
            user: {
              select: { name: true }
            }
           },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ withdrawals })
  } catch (error: any) {
    console.error('Get withdrawal requests for unit error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
