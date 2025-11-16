
import { db } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user = await getUserFromToken(token);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const withdrawalRequests = await db.withdrawalRequest.findMany({
      include: {
        nasabah: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return NextResponse.json(withdrawalRequests);

  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil permintaan penarikan' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user = await getUserFromToken(token);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'ID Permintaan dan tindakan diperlukan' }, { status: 400 });
    }

    const withdrawalRequest = await db.withdrawalRequest.findUnique({
      where: { id },
      include: {
        nasabah: true,
      },
    });

    if (!withdrawalRequest) {
      return NextResponse.json({ error: 'Permintaan penarikan tidak ditemukan' }, { status: 404 });
    }

    if (withdrawalRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Permintaan sudah diproses' }, { status: 400 });
    }

    if (action === 'REJECT') {
      const updatedRequest = await db.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminId: user.id,
        },
      });
      return NextResponse.json({
        message: 'Permintaan penarikan berhasil ditolak.',
        request: updatedRequest,
      });
    }

    if (action === 'APPROVE') {
      if (!withdrawalRequest.nasabah) {
        return NextResponse.json({ error: 'Nasabah terkait tidak ditemukan' }, { status: 404 });
      }
      const nasabah = withdrawalRequest.nasabah;

      if (!nasabah.unitId) {
        console.error(`Error: Nasabah dengan ID ${nasabah.id} tidak memiliki unitId.`);
        return NextResponse.json({ error: 'Data nasabah tidak lengkap, unitId tidak ditemukan.' }, { status: 500 });
      }

      if (nasabah.balance < withdrawalRequest.amount) {
        return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 });
      }

      const result = await db.$transaction(async (tx) => {
        await tx.nasabah.update({
          where: { id: nasabah.id },
          data: { balance: { decrement: withdrawalRequest.amount } },
        });

        const transaction = await tx.transaction.create({
          data: {
            transactionNo: `WD-${Date.now()}`,
            type: 'WITHDRAWAL',
            totalAmount: withdrawalRequest.amount,
            totalWeight: 0,
            status: 'SUCCESS',
            nasabah: {
              connect: { id: nasabah.id }
            },
            unit: {
              connect: { id: nasabah.unitId }
            },
            user: {
              connect: { id: user.id }
            }
          },
        });

        const updatedRequest = await tx.withdrawalRequest.update({
          where: { id: withdrawalRequest.id },
          data: {
            status: 'APPROVED',
            transactionId: transaction.id,
            adminId: user.id,
          },
        });
        return updatedRequest;
      });

      return NextResponse.json({
        message: 'Penarikan berhasil disetujui.',
        request: result,
      });
    }

    return NextResponse.json({ error: 'Tindakan tidak valid' }, { status: 400 });

  } catch (error) {
    console.error('Error processing withdrawal request:', error);
    return NextResponse.json(
      { error: 'Gagal memproses permintaan penarikan' },
      { status: 500 }
    );
  }
}
