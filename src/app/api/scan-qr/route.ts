import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return request.cookies.get('token')?.value
}

async function authenticateUser(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) throw new Error('Token tidak ditemukan')
  
  const decoded = jwt.verify(token, JWT_SECRET) as any
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    include: { unit: true }
  })
  
  if (!user) throw new Error('User tidak ditemukan')
  return user
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    
    if (user.role !== 'UNIT') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const { qrData } = await request.json()

    if (!qrData) {
      return NextResponse.json(
        { error: 'Data QR tidak ditemukan' },
        { status: 400 }
      )
    }

    const nasabah = await db.nasabah.findUnique({
      where: { accountNo: qrData },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true
          }
        }
      }
    })

    if (!nasabah) {
      return NextResponse.json(
        { error: 'Nasabah tidak ditemukan' },
        { status: 404 }
      )
    }

    if (nasabah.user.status !== 'AKTIF') {
      return NextResponse.json(
        { error: 'Status nasabah tidak aktif' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'QR Code valid',
      nasabah
    })

  } catch (error: any) {
    console.error('Scan QR error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}