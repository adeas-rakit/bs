'use server'

import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { formatCurrency } from '@/lib/utils'

// This GET handler is now specifically for Nasabah to get their own withdrawal history.
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })
    }
    
    const user = await getUserFromToken(token)
    if (!user || !user.nasabah) {
      return NextResponse.json({ error: 'Akun nasabah tidak ditemukan' }, { status: 403 })
    }

    // Handle pagination and filters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const searchTerm = searchParams.get('search');

    const whereClause: any = { // Use 'any' for dynamic conditions
      nasabahId: user.nasabah.id, 
    };

    // Apply status filter if provided
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      whereClause.status = status;
    }

    // Apply search filter for amount if provided and is a valid number
    if (searchTerm) {
        try {
            const searchAmount = parseFloat(searchTerm);
            if (!isNaN(searchAmount)) {
                whereClause.amount = searchAmount;
            }
        } catch (e) {
            // Ignore if search term is not a valid number
        }
    }

    // Fetch total count for pagination based on the applied filters
    const totalWithdrawals = await db.withdrawalRequest.count({ where: whereClause });
    const totalPages = Math.ceil(totalWithdrawals / limit);

    const withdrawals = await db.withdrawalRequest.findMany({
      where: whereClause,
      include: {
        unit: { 
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: skip,
      take: limit,
    })

    return NextResponse.json({
      withdrawals,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error: any) {
    console.error('Get withdrawal history error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || !user.nasabah) {
      return NextResponse.json({ error: 'Anda bukan nasabah' }, { status: 403 });
    }

    const { amount, unitId } = await request.json();
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Jumlah penarikan tidak valid' }, { status: 400 });
    }

    if (!unitId) {
      return NextResponse.json({ error: 'Unit ID tidak valid' }, { status: 400 });
    }

    // Check for existing pending withdrawal for this unit
    const existingPendingWithdrawal = await db.withdrawalRequest.findFirst({
        where: {
            nasabahId: user.nasabah.id,
            unitId: unitId,
            status: 'PENDING',
        }
    });

    if (existingPendingWithdrawal) {
        return NextResponse.json({ error: 'Anda sudah memiliki 1 permintaan penarikan di unit ini. Mohon tunggu hingga permintaan sebelumnya diproses.' }, { status: 409 });
    }

    // === START OF FIX ===
    // 1. Fetch the Unit to check its rules
    const unit = await db.unit.findUnique({
        where: { id: unitId }
    });

    if (!unit) {
        return NextResponse.json({ error: 'Unit tidak ditemukan' }, { status: 404 });
    }
    
    // 2. Validate against the minimum withdrawal amount set by the Unit
    if (unit.minWithdrawal && amount < unit.minWithdrawal) {
        return NextResponse.json({ error: `Jumlah penarikan minimal adalah ${formatCurrency(unit.minWithdrawal)}.` }, { status: 400 });
    }
    // === END OF FIX ===

    const unitNasabah = await db.unitNasabah.findFirst({
      where: {
        nasabahId: user.nasabah.id,
        unitId: unitId,
      },
    });

    if (!unitNasabah) {
      return NextResponse.json({ error: 'Anda tidak terdaftar di unit ini' }, { status: 403 });
    }

    if (unitNasabah.balance < amount) {
      return NextResponse.json({ error: 'Saldo di unit ini tidak mencukupi' }, { status: 400 });
    }

    const withdrawal = await db.withdrawalRequest.create({
      data: {
        amount,
        status: 'PENDING',
        nasabahId: user.nasabah.id,
        unitId: unitId,
        createdById: user.id, 
      },
    });

    return NextResponse.json({ message: 'Permintaan penarikan berhasil dibuat', withdrawal });
  } catch (error: any) {
    console.error('Create withdrawal request error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
