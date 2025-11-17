import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// --- Helper Functions from dashboard/route.ts ---
function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return request.cookies.get('token')?.value
}

async function authenticateUser(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) throw new Error('Token tidak ditemukan')
  
  const decoded = jwt.verify(token, JWT_SECRET) as any
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    include: { unit: true }
  })
  
  if (!user) throw new Error('User tidak ditemukan')
  return user
}
// ------------------------------------------------

const withdrawalSchema = z.object({
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  unitId: z.string().nonempty('Unit harus dipilih'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);

    const nasabah = await db.nasabah.findUnique({
      where: { userId: user.id },
    });

    if (!nasabah) {
      return NextResponse.json(
        { error: 'Data nasabah tidak ditemukan' },
        { status: 404 }
      );
    }

    const withdrawals = await db.withdrawalRequest.findMany({
      where: { nasabahId: nasabah.id },
      orderBy: { createdAt: 'desc' },
      include: {
        unit: true, // Include unit details
      },
    });

    return NextResponse.json({ withdrawals });

  } catch (error: any) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)

    const nasabah = await db.nasabah.findUnique({
      where: { userId: user.id },
      include: {
        unitNasabah: true,
      },
    })

    if (!nasabah) {
      return NextResponse.json(
        { error: 'Hanya nasabah yang dapat membuat permintaan penarikan' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { amount, unitId } = withdrawalSchema.parse(body);

    const targetUnit = nasabah.unitNasabah.find(nu => nu.unitId === unitId);

    if (!targetUnit) {
      return NextResponse.json(
        { error: 'Anda tidak terdaftar di unit ini.' },
        { status: 403 }
      );
    }

    if (targetUnit.balance < amount) {
      return NextResponse.json(
        { error: 'Saldo di unit ini tidak mencukupi.' },
        { status: 400 }
      );
    }

    // Create the withdrawal request
    const withdrawalRequest = await db.withdrawalRequest.create({
      data: {
        nasabahId: nasabah.id,
        amount,
        unitId,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      message: 'Permintaan penarikan berhasil dibuat',
      withdrawalRequest,
    })

  } catch (error: any) {
    console.error('Create withdrawal request error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}
