import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { generateTransactionNo } from '@/lib/utils';

const updateWithdrawalSchema = z.object({
  id: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
});

async function authenticateAdmin(request: NextRequest) {
    const token = request.headers.get('authorization')?.split(' ')[1] || request.cookies.get('token')?.value;
    if (!token) {
        throw new Error('Token tidak ditemukan');
    }
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }
    return user;
}

export async function GET(request: NextRequest) {
    try {
        await authenticateAdmin(request);

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const status = searchParams.get('status');

        const where: any = {};

        if (status && status.toUpperCase() !== 'ALL') {
            where.status = status.toUpperCase();
        }

        if (search) {
            where.OR = [
                {
                    nasabah: {
                        user: {
                            name: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    nasabah: {
                        accountNo: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        const withdrawalRequests = await db.withdrawalRequest.findMany({
            where,
            include: {
                nasabah: {
                    include: {
                        user: true,
                    },
                },
                unit: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            withdrawals: withdrawalRequests,
        });

    } catch (error: any) {
        if (error.message === 'Token tidak ditemukan' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error("Error fetching withdrawal requests:", error);
        return NextResponse.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const admin = await authenticateAdmin(request);
        const body = await request.json();
        const { id, action } = updateWithdrawalSchema.parse(body);

        const withdrawalRequest = await db.withdrawalRequest.findUnique({
            where: { id },
            include: {
                nasabah: true
            }
        });

        if (!withdrawalRequest) {
            return NextResponse.json({ error: 'Permintaan tidak ditemukan' }, { status: 404 });
        }

        if (withdrawalRequest.status !== 'PENDING') {
            return NextResponse.json({ error: 'Hanya permintaan yang PENDING yang dapat diproses' }, { status: 400 });
        }
        
        if (action === 'APPROVE') {
            if (withdrawalRequest.nasabah.balance < withdrawalRequest.amount) {
                return NextResponse.json({ error: 'Saldo nasabah tidak mencukupi' }, { status: 400 });
            }

            if (!withdrawalRequest.unitId) {
                console.error(`Missing unitId in withdrawal request ${withdrawalRequest.id}`);
                return NextResponse.json({ error: 'Data inkonsisten: ID unit pada request penarikan tidak ditemukan.' }, { status: 500 });
            }
            const unitId = withdrawalRequest.unitId;

            const unit = await db.unit.findUnique({
                where: { id: unitId },
            });
    
            if (!unit) {
                console.error(`Invalid unitId ${unitId} in withdrawal request ${withdrawalRequest.id}`);
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
                        unitId: unitId, 
                        userId: admin.id,
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
                        processedById: admin.id,
                        transactionId: newTransaction.id
                    },
                });
                
                return finalWithdrawalRequest;
            });
            
            return NextResponse.json({ message: 'Permintaan penarikan berhasil disetujui', withdrawalRequest: updatedRequest });
    
        } else { // REJECT
          const updatedRequest = await db.withdrawalRequest.update({
            where: { id },
            data: { 
                status: 'REJECTED',
                processedById: admin.id,
             },
          })
          return NextResponse.json({ message: 'Permintaan penarikan berhasil ditolak', withdrawalRequest: updatedRequest })
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.issues.map(i => i.message).join(', ') }, { status: 400 })
        }
        if (error.message === 'Token tidak ditemukan' || error.message === 'Unauthorized') {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error("Error processing withdrawal:", error);
        return NextResponse.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 })
      }
    }
