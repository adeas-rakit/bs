
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })
    }
    const user = await getUserFromToken(token)
    if (!user || user.role !== 'UNIT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const nasabahId = searchParams.get('nasabahId')
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let where: any = {
      unitId: user.unitId,
      status: 'SUCCESS'
    }

    if (nasabahId && nasabahId !== 'all') {
      where.nasabahId = nasabahId;
    }

    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }

    const transactions = await db.transaction.findMany({
      where,
      skip,
      take: limit,
      include: {
        nasabah: {
          include: {
            user: true
          }
        },
        items: {
          include: {
            wasteType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const totalTransactions = await db.transaction.count({ where });

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      createdAt: t.createdAt,
      type: t.type.toLowerCase(),
      nasabah: { name: t.nasabah.user.name },
      amount: t.totalAmount,
      description: t.type === 'WITHDRAWAL' 
        ? t.notes || 'Penarikan tunai' 
        : t.items.map(item => `${item.wasteType.name} (${item.weight} kg)`).join(', ')
    }));

    const nasabahInUnit = await db.unitNasabah.findMany({
        where: {
            unitId: user.unitId
        },
        include: {
            nasabah: {
                include: {
                    user: true
                }
            }
        }
    })

    const nasabahList = nasabahInUnit.map(nu => ({
        id: nu.nasabahId,
        name: nu.nasabah.user.name
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      nasabahList,
      totalPages: Math.ceil(totalTransactions / limit),
      currentPage: page
    });

  } catch (error) {
    console.error('Error fetching statement data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
