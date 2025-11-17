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
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const nasabahId = searchParams.get('nasabahId')

    let where: any = {}
    
    if (user.role === 'NASABAH') {
      const nasabah = await db.nasabah.findUnique({
        where: { userId: user.id }
      })
      if (nasabah) {
        where.nasabahId = nasabah.id
      }
    }

    if (type) where.type = type
    if (status) where.status = status
    if (nasabahId) where.nasabahId = nasabahId

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        nasabah: {
          include: {
            user: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        },
        unit: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            wasteType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ transactions })

  } catch (error: any) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
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

    const { nasabahId, type, items, notes } = await request.json()

    if (!nasabahId || !type || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Data transaksi tidak lengkap' },
        { status: 400 }
      )
    }

    const nasabah = await db.nasabah.findUnique({
      where: { id: nasabahId }
    })

    if (!nasabah) {
      return NextResponse.json(
        { error: 'Nasabah tidak ditemukan' },
        { status: 404 }
      )
    }

    let totalAmount = 0
    let totalWeight = 0

    for (const item of items) {
      const wasteType = await db.wasteType.findUnique({
        where: { id: item.wasteTypeId }
      })
      
      if (!wasteType) {
        return NextResponse.json(
          { error: 'Jenis sampah tidak ditemukan' },
          { status: 404 }
        )
      }

      totalAmount += item.weight * wasteType.pricePerKg
      totalWeight += item.weight
    }

    const transactionNo = 'TRX' + Date.now().toString().slice(-8)
    const unitId = user.unit!.id;

    const transaction = await db.transaction.create({
      data: {
        transactionNo,
        nasabahId,
        unitId: unitId,
        userId: user.id,
        type,
        totalAmount,
        totalWeight,
        notes,
        status: type === 'WITHDRAWAL' ? 'PENDING' : 'SUCCESS'
      },
      include: {
        nasabah: {
          include: {
            user: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        },
        unit: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    })

    for (const item of items) {
      const wasteType = await db.wasteType.findUnique({
        where: { id: item.wasteTypeId }
      })

      await db.transactionItem.create({
        data: {
          transactionId: transaction.id,
          wasteTypeId: item.wasteTypeId,
          weight: item.weight,
          amount: item.weight * wasteType!.pricePerKg
        }
      })
    }

    if (type === 'DEPOSIT') {
      await db.nasabah.update({
        where: { id: nasabahId },
        data: {
          balance: { increment: totalAmount },
          totalWeight: { increment: totalWeight },
          depositCount: { increment: 1 }
        }
      })

      await db.unitNasabah.upsert({
        where: { unitId_nasabahId: { unitId, nasabahId } },
        create: { 
          unitId, 
          nasabahId, 
          balance: totalAmount, 
          totalWeight: totalWeight 
        },
        update: { 
          balance: { increment: totalAmount }, 
          totalWeight: { increment: totalWeight } 
        }
      });
    }

    const transactionWithItems = await db.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        nasabah: {
          include: {
            user: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        },
        unit: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            wasteType: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Transaksi berhasil dibuat',
      transaction: transactionWithItems
    })

  } catch (error: any) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}