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
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    if (role) where.role = role
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    const users = await db.user.findMany({
      where,
      include: {
        unit: {
          select: {
            name: true
          }
        },
        nasabah: {
          select: {
            accountNo: true,
            balance: true,
            totalWeight: true
          }
        },
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })

  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const { id, name, phone, status, unitId } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID user diperlukan' },
        { status: 400 }
      )
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(status && { status }),
        ...(unitId !== undefined && { unitId })
      },
      include: {
        unit: {
          select: {
            name: true
          }
        },
        nasabah: {
          select: {
            accountNo: true,
            balance: true,
            totalWeight: true
          }
        }
      }
    })

    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: 'User berhasil diperbarui',
      user: userWithoutPassword
    })

  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}