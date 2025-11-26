import { db } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { generateTransactionNo } from '@/lib/utils';

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
    const user = await authenticateUser(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const nasabahId = searchParams.get('nasabahId');
    const search = searchParams.get('search');
    
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    let where: any = {};

    if (user.role === 'UNIT') {
      if (!user.unit) {
        return NextResponse.json(
          { error: 'User tidak terhubung dengan unit manapun' },
          { status: 400 }
        );
      }
      where.unitId = user.unit.id;
    } else if (user.role === 'NASABAH') {
      const nasabah = await db.nasabah.findUnique({
        where: { userId: user.id },
      });
      if (nasabah) {
        where.nasabahId = nasabah.id;
      }
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (nasabahId) where.nasabahId = nasabahId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { transactionNo: { contains: search } },
        { nasabah: { user: { name: { contains: search } } } },
        { nasabah: { user: { phone: { contains: search } } } },
      ];
    }
    
    const includeClause = {
      nasabah: {
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
      unit: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
      items: {
        include: {
          wasteType: true,
        },
      },
    };

    if (pageParam && limitParam) {
      const page = parseInt(pageParam, 10);
      const limit = parseInt(limitParam, 10);
      const skip = (page - 1) * limit;

      const [transactions, totalTransactions] = await db.$transaction([
        db.transaction.findMany({
          where,
          include: includeClause,
          orderBy: { createdAt: 'desc' },
          skip: skip,
          take: limit,
        }),
        db.transaction.count({ where }),
      ]);
      
      const totalPages = Math.ceil(totalTransactions / limit);

      return NextResponse.json({
        transactions,
        totalPages,
        totalTransactions,
      });

    } else {
      const transactions = await db.transaction.findMany({
        where,
        include: includeClause,
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ transactions });
    }

  } catch (error: any) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    );
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

    const transactionNo = generateTransactionNo('TRX');
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
        status: type === 'WITHDRAWAL' ? 'PENDING' : 'SUCCESS',
        createdById: user.id,
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
          amount: item.weight * wasteType!.pricePerKg,
          createdById: user.id,
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
          totalWeight: totalWeight,
          createdById: user.id
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
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    );
  }
}
