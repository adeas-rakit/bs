'use server'

import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

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

    const withdrawals = await db.withdrawalRequest.findMany({
      where: {
        nasabahId: user.nasabah.id, // Fetch based on the logged-in user's nasabah ID
      },
      include: {
        unit: { // Include unit name for context
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'desc', // Show the most recent withdrawals first
      },
    })

    return NextResponse.json({ withdrawals })
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
