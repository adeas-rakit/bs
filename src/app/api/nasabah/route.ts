import { db } from '@/lib/db';
import { UserStatus } from '@prisma/client';
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

    if (user.role === 'UNIT' && user.unitId) {
      let nasabahFilter: any = {};
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

      if (andConditions.length > 0) {
        nasabahFilter.AND = andConditions;
      }

      const unitNasabahLinks = await db.unitNasabah.findMany({
        where: {
          unitId: user.unitId,
          nasabah: nasabahFilter,
        },
        include: {
          nasabah: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true, unitId: true } },
              unit: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { nasabah: { createdAt: 'desc' } },
      });

      const nasabahIds = unitNasabahLinks.map(link => link.nasabahId);
      const depositCounts = await db.transaction.groupBy({
        by: ['nasabahId'],
        where: { nasabahId: { in: nasabahIds }, unitId: user.unitId, type: 'DEPOSIT' },
        _count: { id: true },
      });

      const depositCountMap = depositCounts.reduce((acc, curr) => {
        acc[curr.nasabahId] = curr._count.id;
        return acc;
      }, {} as Record<string, number>);

      const nasabahList = unitNasabahLinks.map(link => ({
        ...link.nasabah,
        balance: link.balance,
        totalWeight: link.totalWeight,
        depositCount: depositCountMap[link.nasabahId] || 0,
      }));

      return NextResponse.json({ nasabah: nasabahList });
    } else {
      let where: any = {};
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

      if (andConditions.length > 0) {
        where.AND = andConditions;
      }

      const nasabah = await db.nasabah.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true, unitId: true } },
          unit: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const nasabahIds = nasabah.map(n => n.id);

      const [depositsByUnit, allUnits] = await Promise.all([
        db.transaction.groupBy({
            by: ['nasabahId', 'unitId'],
            where: { nasabahId: { in: nasabahIds }, type: 'DEPOSIT' },
            _count: { id: true },
        }),
        db.unit.findMany({ select: { id: true, name: true } })
      ]);

      const unitMap = allUnits.reduce((acc, unit) => {
        acc[unit.id] = unit.name;
        return acc;
      }, {} as Record<string, string>);

      const depositStatsMap = nasabahIds.reduce((acc, id) => {
        acc[id] = { totalDepositCount: 0, depositsByUnit: [] };
        return acc;
      }, {} as Record<string, { totalDepositCount: number, depositsByUnit: any[] }>);

      depositsByUnit.forEach(group => {
        if (group.nasabahId && group.unitId) {
          const nasabahStat = depositStatsMap[group.nasabahId];
          const count = group._count.id;
          nasabahStat.totalDepositCount += count;
          nasabahStat.depositsByUnit.push({
            unitId: group.unitId,
            unitName: unitMap[group.unitId] || 'Unknown Unit',
            count: count,
          });
        }
      });

      const augmentedNasabah = nasabah.map(n => ({
        ...n,
        ...(depositStatsMap[n.id] || { totalDepositCount: 0, depositsByUnit: [] }),
      }));

      return NextResponse.json({ nasabah: augmentedNasabah });
    }
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
      const isLocal = nasabah.unitId === user.unitId;
      const hasTransacted = await db.transaction.findFirst({
        where: { nasabahId: id, unitId: user.unitId }
      });

      if (!isLocal && !hasTransacted) {
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

        if (unitId) {
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
