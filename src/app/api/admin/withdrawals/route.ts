
import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function generateTransactionNo(prefix = 'TRX') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

async function authenticateAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) throw new Error('Token tidak ditemukan')

  const decoded = jwt.verify(token, JWT_SECRET) as any
  const admin = await db.user.findUnique({ where: { id: decoded.userId } });

  if (!admin || admin.role !== 'ADMIN') {
    throw new Error('Akses ditolak')
  }
  return admin;
}

const actionSchema = z.object({
  id: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
});

export async function GET(request: NextRequest) {
    try {
      await authenticateAdmin(request);
  
      const withdrawalRequests = await db.withdrawalRequest.findMany({
        include: {
          nasabah: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
            createdAt: 'desc',
        },
      });
  
      return NextResponse.json(withdrawalRequests);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Akses ditolak' ? 403 : 401 });
    }
  }

export async function POST(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request)

    const body = await request.json()
    const { id, action } = actionSchema.parse(body)

    const withdrawalRequest = await db.withdrawalRequest.findUnique({
      where: { id },
      include: {
        nasabah: true,
      },
    })

    if (!withdrawalRequest) {
      return NextResponse.json({ error: 'Permintaan tidak ditemukan' }, { status: 404 })
    }

    if (withdrawalRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Permintaan ini sudah diproses' }, { status: 400 })
    }

    if (action === 'APPROVE') {
        if (withdrawalRequest.nasabah.balance < withdrawalRequest.amount) {
            return NextResponse.json({ error: 'Saldo nasabah tidak mencukupi' }, { status: 400 });
        }

        if (!withdrawalRequest.unitId) {
            console.error(`Withdrawal request ${withdrawalRequest.id} is missing a unitId.`);
            return NextResponse.json({ error: 'Data inkonsisten: Request penarikan tidak memiliki ID unit terkait.' }, { status: 500 });
        }

        const unit = await db.unit.findUnique({
            where: { id: withdrawalRequest.unitId },
        });

        if (!unit) {
            console.error(`Invalid unitId ${withdrawalRequest.unitId} in withdrawal request ${withdrawalRequest.id}`);
            return NextResponse.json({ error: 'Data inkonsisten: ID unit pada request penarikan tidak valid atau telah dihapus.' }, { status: 500 });
        }

        const updatedRequest = await db.$transaction(async (tx) => {
            await tx.nasabah.update({
                where: { id: withdrawalRequest.nasabahId },
                data: { balance: { decrement: withdrawalRequest.amount } },
            });

            const newTransaction = await tx.transaction.create({
                data: {
                    transactionNo: generateTransactionNo('WDR'),
                    nasabahId: withdrawalRequest.nasabahId,
                    unitId: withdrawalRequest.unitId, 
                    userId: admin.id, // Assign the logged-in admin's ID
                    type: 'WITHDRAWAL',
                    totalAmount: withdrawalRequest.amount,
                    totalWeight: 0,
                    status: 'SUCCESS',
                    notes: `Penarikan dana sebesar ${withdrawalRequest.amount}`,
                    createdById: admin.id,
                },
            });

            const finalWithdrawalRequest = await tx.withdrawalRequest.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    transactionId: newTransaction.id,
                },
            });
            
            return finalWithdrawalRequest;
        });
        
        return NextResponse.json({ message: 'Permintaan disetujui', withdrawalRequest: updatedRequest });

    } else { // REJECT
      const updatedRequest = await db.withdrawalRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
      })
      return NextResponse.json({ message: 'Permintaan ditolak', withdrawalRequest: updatedRequest })
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error processing withdrawal:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 })
  }
}
