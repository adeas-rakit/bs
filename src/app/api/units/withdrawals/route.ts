'use server'

import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { WithdrawalRequestStatus } from '@prisma/client'
import { generateTransactionNo } from '@/lib/utils'

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

// GET handler to fetch withdrawal requests for a unit
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user || !user.unit) {
      return NextResponse.json({ error: 'Akun unit tidak ditemukan' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as WithdrawalRequestStatus | 'all' | null;
    const search = searchParams.get('search');

    let whereClause: any = {
      unitId: user.unit.id,
    };

    if (status && status !== 'all' && Object.values(WithdrawalRequestStatus).includes(status as WithdrawalRequestStatus)) {
      whereClause.status = status as WithdrawalRequestStatus;
    }

    if (search) {
        whereClause.OR = [
            {
                nasabah: {
                    user: {
                        name: {
                            contains: search,
                        },
                    },
                },
            },
            {
                nasabah: {
                    accountNo: {
                        contains: search,
                    },
                },
            },
        ];
    }

    const withdrawals = await db.withdrawalRequest.findMany({
      where: whereClause,
      include: {
        nasabah: {
          select: { 
            id: true,
            accountNo: true,
            user: {
              select: { name: true }
            }
           },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ withdrawals })
  } catch (error: any) {
    console.error('Get withdrawal requests for unit error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT handler to approve or reject a withdrawal request
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user || user.role !== 'UNIT' || !user.unitId) {
      return NextResponse.json(
        { error: 'Otorisasi gagal: Hanya UNIT yang bisa melakukan tindakan ini' },
        { status: 403 }
      )
    }

    const { id: withdrawalId, action, rejectionReason } = await request.json();

    if (!withdrawalId || !action || (action === 'reject' && !rejectionReason)) {
        return NextResponse.json({ error: 'Payload tidak lengkap: id, action, dan rejectionReason (jika reject) diperlukan' }, { status: 400 });
    }

    const withdrawalRequest = await db.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { nasabah: true },
    })

    if (!withdrawalRequest) {
      return NextResponse.json({ error: 'Permintaan penarikan tidak ditemukan' }, { status: 404 })
    }

    if (withdrawalRequest.unitId !== user.unitId) {
      return NextResponse.json(
        { error: 'Otorisasi gagal: Anda tidak memiliki akses ke permintaan ini' },
        { status: 403 }
      )
    }

    if (withdrawalRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Permintaan sudah dalam status ${withdrawalRequest.status}` },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      if (!withdrawalRequest.nasabah) {
          return NextResponse.json({ error: 'Data nasabah tidak ditemukan' }, { status: 404 });
      }
      if (withdrawalRequest.nasabah.balance < withdrawalRequest.amount) {
        return NextResponse.json({ error: 'Saldo nasabah tidak mencukupi' }, { status: 400 })
      }

      const updatedWithdrawal = await db.$transaction(async (prisma) => {
        const transaction = await prisma.transaction.create({
          data: {
            transactionNo: generateTransactionNo('WDR'),
            nasabahId: withdrawalRequest.nasabahId,
            unitId: user.unitId as string,
            type: 'WITHDRAWAL',
            totalAmount: withdrawalRequest.amount,
            totalWeight: 0,
            status: 'SUCCESS',
            createdById: user.id,
            userId: user.id,
          },
        })

        await prisma.nasabah.update({
          where: { id: withdrawalRequest.nasabahId },
          data: { balance: { decrement: withdrawalRequest.amount } },
        })

        return prisma.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: 'APPROVED',
            processedById: user.id,
            transactionId: transaction.id,
          },
        })
      })

      return NextResponse.json({
        message: 'Permintaan penarikan telah disetujui',
        withdrawal: updatedWithdrawal,
      })
    } else if (action === 'reject') {
      const updatedWithdrawal = await db.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'REJECTED',
          rejectionReason,
          processedById: user.id,
        },
      })

      return NextResponse.json({
        message: 'Permintaan penarikan telah ditolak',
        withdrawal: updatedWithdrawal,
      })
    } else {
      return NextResponse.json({ error: 'Tindakan tidak valid' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Update withdrawal request error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
