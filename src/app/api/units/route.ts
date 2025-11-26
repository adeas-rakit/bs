
import { db } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

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

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const units = await db.unit.findMany({
      where,
      include: {
        _count: {
          select: {
            transactions: true,
            wasteTypes: true, 
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const unitsWithCounts = await Promise.all(
      units.map(async (unit) => {
        const officersCount = await db.user.count({
          where: { role: 'UNIT', unitId: unit.id },
        });

        const registeredNasabah = await db.user.findMany({
            where: { role: 'NASABAH', unitId: unit.id },
            select: { id: true },
        });
        const registeredNasabahIds = registeredNasabah.map(n => n.id);
        const registeredNasabahCount = registeredNasabahIds.length;

        const transactionalNasabah = await db.unitNasabah.findMany({
            where: { unitId: unit.id },
            select: { nasabahId: true },
            distinct: ['nasabahId'],
        });
        const transactionalNasabahIds = transactionalNasabah.map(n => n.nasabahId);
        const activeNasabahCount = transactionalNasabahIds.length;
        
        const allNasabahIds = new Set([...registeredNasabahIds, ...transactionalNasabahIds]);
        const totalNasabahCount = allNasabahIds.size;

        return {
          ...unit,
          officersCount,
          transactionsCount: unit._count.transactions,
          wasteTypesCount: unit._count.wasteTypes, 
          registeredNasabahCount,
          activeNasabahCount,
          totalNasabahCount,
        };
      })
    );

    return NextResponse.json({ units: unitsWithCounts });
  } catch (error: any) {
    console.error('Get units error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { name, address, phone } = await request.json();

    if (!name || !address || !phone) {
      return NextResponse.json(
        { error: 'Semua field diperlukan' },
        { status: 400 }
      );
    }

    const unit = await db.unit.create({
      data: {
        name,
        address,
        phone,
        createdById: user.id,
      },
    });

    return NextResponse.json({
      message: 'Unit berhasil dibuat',
      unit,
    });
  } catch (error: any) {
    console.error('Create unit error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { name, address, phone, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID unit diperlukan' },
        { status: 400 }
      );
    }

    const updatedUnit = await db.unit.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({
      message: 'Unit berhasil diperbarui',
      unit: updatedUnit,
    });
  } catch (error: any) {
    console.error('Update unit error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    );
  }
}
