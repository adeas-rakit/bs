import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { generateTransactionNo } from '@/lib/utils';

const updateWithdrawalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status') || 'PENDING';
        const skip = (page - 1) * limit;

        const where: any = {
            status: status.toUpperCase(),
        };

        const [withdrawalRequests, total] = await Promise.all([
            db.withdrawalRequest.findMany({
                where,
                skip,
                take: limit,
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
            }),
            db.withdrawalRequest.count({ where }),
        ]);

        const formattedRequests = withdrawalRequests.map(wr => ({
            ...wr,
            nasabahName: wr.nasabah.user.name,
            unitName: wr.unit?.name || 'N/A',
        }));

        return NextResponse.json({
            data: formattedRequests,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });

    } catch (error: any) {
        console.error("Error fetching withdrawal requests:", error);
        return NextResponse.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 });
    }
}


export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    
    try {
        const admin = await authenticateAdmin(request);
        const body = await request.json();
        const { status } = updateWithdrawalSchema.parse(body);

        const withdrawalRequest = await db.withdrawalRequest.findUnique({
            where: { id },
        });

        if (!withdrawalRequest) {
            return NextResponse.json({ error: 'Permintaan tidak ditemukan' }, { status: 404 });
        }

        if (withdrawalRequest.status !== 'PENDING') {
            return NextResponse.json({ error: 'Hanya permintaan yang PENDING yang dapat diproses' }, { status: 400 });
        }
        
        if (status === 'APPROVED') {
            if (!withdrawalRequest.unitId) {
                console.error(`Missing unitId in withdrawal request ${withdrawalRequest.id}`);
                return NextResponse.json({ error: 'Data inkonsisten: ID unit pada request penarikan tidak ditemukan.' }, { status: 500 });
            }
            // Perbaikan: Simpan unitId yang sudah divalidasi ke variabel baru.
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
                        // Perbaikan: Gunakan variabel baru yang tipenya sudah pasti string.
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
          return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
        }
        console.error("Error processing withdrawal:", error);
        return NextResponse.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 })
      }
    }
