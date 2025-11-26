import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth';
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
    
    if (user.role !== 'ADMIN' && user.role !== 'UNIT') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const unitId = searchParams.get('unitId')

    const where: any = {}
    if (status) where.status = status

    if (user.role === 'UNIT') {
      where.unitId = user.unitId
    } else if (user.role === 'ADMIN' && unitId) {
      where.unitId = unitId
    }

    const wasteTypes = await db.wasteType.findMany({
      where,
      include: {
        unit: true,
        _count: {
          select: {
            transactionItems: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ wasteTypes })

  } catch (error: any) {
    console.error('Get waste types error:', error)
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

    const { name, pricePerKg, unitId } = await request.json()

    if (!name || !pricePerKg || !unitId) {
      return NextResponse.json(
        { error: 'Nama, harga per kg dan ID unit diperlukan' },
        { status: 400 }
      )
    }

    const wasteType = await db.wasteType.create({
      data: {
        name,
        pricePerKg,
        unitId,
        createdById: user.id,
      }
    })

    return NextResponse.json({
      message: 'Jenis sampah berhasil dibuat',
      wasteType
    })

  } catch (error: any) {
    console.error('Create waste type error:', error)
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const { name, pricePerKg, status } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID jenis sampah diperlukan' },
        { status: 400 }
      )
    }

    const updatedWasteType = await db.wasteType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(pricePerKg && { pricePerKg }),
        ...(status && { status })
      }
    })

    return NextResponse.json({
      message: 'Jenis sampah berhasil diperbarui',
      wasteType: updatedWasteType
    })

  } catch (error: any) {
    console.error('Update waste type error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}