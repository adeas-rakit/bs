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

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let where: any = {}
    
    if (user.role === 'UNIT') {
      where.user = {
        unitId: user.unit?.id
      }
    } else if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    if (status) {
      where.user = {
        ...where.user,
        status: status
      }
    }

    if (search) {
      where.user = {
        ...where.user,
        OR: [
          { name: { contains: search } },
          { accountNo: { contains: search } },
          { phone: { contains: search } }
        ]
      }
    }

    const nasabah = await db.nasabah.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ nasabah })

  } catch (error: any) {
    console.error('Get nasabah error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    
    if (user.role !== 'ADMIN' && user.role !== 'UNIT') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const { id, name, phone, status } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID nasabah diperlukan' },
        { status: 400 }
      )
    }

    const nasabah = await db.nasabah.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!nasabah) {
      return NextResponse.json(
        { error: 'Nasabah tidak ditemukan' },
        { status: 404 }
      )
    }

    if (user.role === 'UNIT' && nasabah.user.unitId !== user.unit?.id) {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const updatedUser = await db.user.update({
      where: { id: nasabah.userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(status && { status })
      }
    })

    return NextResponse.json({
      message: 'Nasabah berhasil diperbarui',
      nasabah: {
        ...nasabah,
        user: updatedUser
      }
    })

  } catch (error: any) {
    console.error('Update nasabah error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}