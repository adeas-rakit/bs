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
    where: { id: decoded.userId }
  })
  
  if (!user) throw new Error('User tidak ditemukan')
  return user
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    const units = await db.unit.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            transactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ units })

  } catch (error: any) {
    console.error('Get units error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const { name, address, phone } = await request.json()

    if (!name || !address || !phone) {
      return NextResponse.json(
        { error: 'Semua field diperlukan' },
        { status: 400 }
      )
    }

    const unit = await db.unit.create({
      data: {
        name,
        address,
        phone
      }
    })

    return NextResponse.json({
      message: 'Unit berhasil dibuat',
      unit
    })

  } catch (error: any) {
    console.error('Create unit error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}