
'use server'

import { db } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
  action: z.enum(['approve', 'reject']),
})

async function getUnitSpecificBalance(nasabahId: string, unitId: string): Promise<number> {
  const unitNasabah = await db.unitNasabah.findUnique({
    where: {
        unitId_nasabahId: {
            unitId: unitId,
            nasabahId: nasabahId
        }
    }
  });
  return unitNasabah?.balance || 0;
}

export async function POST(request: NextRequest, { params }: { params: { id: string; action: string } }) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 });
    }
    const user = await getUserFromToken(token);
    if (!user || !user.unitId) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak terhubung dengan unit manapun' }, { status: 403 })
    }

    const { id, action } = routeSchema.parse(params)

    const withdrawalRequest = await db.withdrawalRequest.findUnique({
      where: { id: id, status: 'PENDING' },
      include: { nasabah: true },
    })

    if (!withdrawalRequest) {
      return NextResponse.json({ error: 'Permintaan penarikan tidak ditemukan atau sudah diproses' }, { status: 404 })
    }

    if (action === 'reject') {
      const updatedWithdrawal = await db.withdrawalRequest.update({
        where: { id: id },
        data: { status: 'REJECTED', adminId: user.id },
      })
      return NextResponse.json({ message: 'Permintaan berhasil ditolak', withdrawal: updatedWithdrawal })
    }

    if (action === 'approve') {
      const unitSpecificBalance = await getUnitSpecificBalance(withdrawalRequest.nasabahId, user.unitId);

      if (withdrawalRequest.amount > unitSpecificBalance) {
          return NextResponse.json(
              { error: `Saldo nasabah di unit ini tidak mencukupi (Tersedia: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(unitSpecificBalance)})` },
              { status: 400 }
          );
      }

      if (withdrawalRequest.amount > withdrawalRequest.nasabah.balance) {
        return NextResponse.json(
          { error: `Total saldo nasabah tidak mencukupi (Total Saldo: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(withdrawalRequest.nasabah.balance)})` },
          { status: 400 }
        )
      }

      const result = await db.$transaction(async (tx) => {
        // 1. Kurangi saldo total nasabah
        const updatedNasabah = await tx.nasabah.update({
          where: { id: withdrawalRequest.nasabahId },
          data: { balance: { decrement: withdrawalRequest.amount } },
        });

        // 2. Kurangi saldo nasabah di unit terkait
        await tx.unitNasabah.update({
            where: {
                unitId_nasabahId: {
                    unitId: user.unitId!,
                    nasabahId: withdrawalRequest.nasabahId
                }
            },
            data: {
                balance: { decrement: withdrawalRequest.amount }
            }
        })

        const transactionNo = 'WDR' + Date.now().toString().slice(-8);

        // 3. Buat catatan transaksi
        const transaction = await tx.transaction.create({
            data: {
                transactionNo,
                nasabahId: withdrawalRequest.nasabahId,
                unitId: user.unitId!,
                userId: user.id,
                createdById: user.id,
                type: 'WITHDRAWAL',
                totalAmount: withdrawalRequest.amount,
                totalWeight: 0,
                status: 'SUCCESS',
                notes: `Penarikan saldo disetujui oleh unit ${user.unit?.name || ''}`,
            },
        });

        // 4. Update status permintaan penarikan
        const updatedWithdrawal = await tx.withdrawalRequest.update({
          where: { id: id },
          data: { 
            status: 'APPROVED',
            transactionId: transaction.id,
            adminId: user.id,
          },
        });

        return { updatedNasabah, updatedWithdrawal, transaction };
      });

      return NextResponse.json({ message: 'Permintaan berhasil disetujui', data: result });
    }
  } catch (error: any) {
    console.error(`Withdrawal action error (/${params.action}):`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parameter tidak valid' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
