import { db } from '@/lib/db';
import { TransactionType, UserStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return request.cookies.get('token')?.value;
}

async function authenticateUser(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) throw new Error('Token tidak ditemukan');

  const decoded = jwt.verify(token, JWT_SECRET) as any;
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    include: { unit: true },
  });

  if (!user) throw new Error('User tidak ditemukan');
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);

    if (user.role !== 'ADMIN' && user.role !== 'UNIT') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const baseWhere: any = {};
    const andConditions: any[] = [];

    if (statusParam && Object.values(UserStatus).includes(statusParam as UserStatus)) {
      andConditions.push({ user: { status: statusParam as UserStatus } });
    }

    if (search) {
      andConditions.push({
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { accountNo: { contains: search, mode: 'insensitive' } },
          { user: { phone: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (user.role === 'UNIT' && user.unitId) {
      andConditions.push({
        OR: [
          { user: { unitId: user.unitId } },
          { transactions: { some: { unitId: user.unitId } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      baseWhere.AND = andConditions;
    }

    const [nasabah, total] = await db.$transaction([
      db.nasabah.findMany({
        where: baseWhere,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true, unitId: true } },
          unit: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.nasabah.count({ where: baseWhere }),
    ]);

    const nasabahIds = nasabah.map(n => n.id);
    let finalNasabah = [...nasabah];

    if (user.role === 'UNIT' && user.unitId && nasabahIds.length > 0) {
      const transactions = await db.transaction.groupBy({
        by: ['nasabahId', 'type'],
        where: {
          nasabahId: { in: nasabahIds },
          unitId: user.unitId,
          OR: [
            { type: 'DEPOSIT' },
            { type: 'WITHDRAWAL', status: 'SUCCESS' },
          ],
        },
        _sum: { totalAmount: true },
      });

      const balanceMap = nasabahIds.reduce((acc, id) => {
        acc[id] = { deposit: 0, withdrawal: 0 };
        return acc;
      }, {} as Record<string, { deposit: number, withdrawal: number }>);

      transactions.forEach(t => {
        if (t.nasabahId) {
          if (t.type === 'DEPOSIT') {
            balanceMap[t.nasabahId].deposit = t._sum.totalAmount || 0;
          } else if (t.type === 'WITHDRAWAL') {
            balanceMap[t.nasabahId].withdrawal = t._sum.totalAmount || 0;
          }
        }
      });

      const unitNasabahData = await db.unitNasabah.findMany({
        where: { unitId: user.unitId, nasabahId: { in: nasabahIds } },
        select: { nasabahId: true, totalWeight: true },
      });

      const weightMap = unitNasabahData.reduce((acc, un) => {
        acc[un.nasabahId] = un.totalWeight || 0;
        return acc;
      }, {} as Record<string, number>);

      finalNasabah = nasabah.map(n => {
        const deposits = balanceMap[n.id]?.deposit ?? 0;
        const withdrawals = balanceMap[n.id]?.withdrawal ?? 0;
        return {
          ...n,
          balance: deposits - withdrawals,
          totalWeight: weightMap[n.id] || 0,
        };
      });
    }

    const [depositsByUnit, allUnits] = await Promise.all([
        db.transaction.groupBy({
            by: ['nasabahId', 'unitId'],
            where: { nasabahId: { in: nasabahIds }, type: 'DEPOSIT' },
            _count: { id: true },
        }),
        db.unit.findMany({ select: { id: true, name: true, minWithdrawal: true } })
    ]);

    const unitMap = allUnits.reduce((acc, unit) => {
        acc[unit.id] = { name: unit.name, minWithdrawal: unit.minWithdrawal };
        return acc;
    }, {} as Record<string, { name: string, minWithdrawal: number }>);

    const depositStatsMap = nasabahIds.reduce((acc, id) => {
        acc[id] = { totalDepositCount: 0, depositsByUnit: [] };
        return acc;
    }, {} as Record<string, { totalDepositCount: number, depositsByUnit: any[] }>);

    depositsByUnit.forEach(group => {
        if (group.nasabahId && group.unitId) {
            const nasabahStat = depositStatsMap[group.nasabahId];
            if (nasabahStat) {
                const count = group._count.id;
                const unitInfo = unitMap[group.unitId] || { name: 'Unknown Unit', minWithdrawal: 0 };
                nasabahStat.totalDepositCount += count;
                nasabahStat.depositsByUnit.push({
                    unitId: group.unitId,
                    unitName: unitInfo.name,
                    minWithdrawal: unitInfo.minWithdrawal,
                    count: count,
                });
            }
        }
    });

    const augmentedNasabah = finalNasabah.map(n => ({
        ...n,
        ...(depositStatsMap[n.id] || { totalDepositCount: 0, depositsByUnit: [] }),
    }));

    return NextResponse.json({
      nasabah: augmentedNasabah,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error: any) {
    console.error('Get nasabah error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    
    if (user.role !== 'ADMIN' && user.role !== 'UNIT') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id, name, phone, status, unitId } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID nasabah diperlukan' }, { status: 400 })
    }

    const nasabah = await db.nasabah.findUnique({
      where: { id }
    })

    if (!nasabah) {
      return NextResponse.json({ error: 'Nasabah tidak ditemukan' }, { status: 404 })
    }

    if (user.role === 'UNIT' && user.unitId) {
      const isRegisteredHere = nasabah.unitId === user.unitId;
      const hasTransactedHere = await db.transaction.findFirst({
        where: { nasabahId: id, unitId: user.unitId }
      });

      if (!isRegisteredHere && !hasTransactedHere) {
        return NextResponse.json({ error: 'Anda tidak memiliki izin untuk mengelola nasabah ini' }, { status: 403 });
      }
    }
    
    if (unitId) {
        const unitExists = await db.unit.findUnique({ where: { id: unitId } });
        if (!unitExists) {
            return NextResponse.json({ error: 'Unit tidak ditemukan' }, { status: 404 });
        }
    }

    const userDataToUpdate: { name?: string; phone?: string; status?: UserStatus; } = {};
    if (name) userDataToUpdate.name = name;
    if (phone) userDataToUpdate.phone = phone;
    if (status) {
      if (Object.values(UserStatus).includes(status as UserStatus)) {
        userDataToUpdate.status = status as UserStatus;
      } else {
        return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
      }
    }

    await db.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: nasabah.userId },
            data: userDataToUpdate,
        });

        if (unitId && user.role === 'ADMIN') { // Only admin can change the main unit
            await tx.nasabah.update({
                where: { id: nasabah.id },
                data: { unit: { connect: { id: unitId } } },
            });
        }
    });

    return NextResponse.json({ message: 'Nasabah berhasil diperbarui' })

  } catch (error: any) {
    console.error('Update nasabah error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}
