
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { Nasabah, UserProfile, UserRole } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return new NextResponse(JSON.stringify({ error: 'Otentikasi diperlukan.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || (user.role !== 'UNIT' && user.role !== 'ADMIN')) {
      return new NextResponse(JSON.stringify({ error: 'Akses ditolak.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Token tidak valid atau kedaluwarsa.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { id } = params;

  if (typeof id !== 'string') {
    return new NextResponse(JSON.stringify({ error: 'ID tidak valid.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const identifier = id;
    let nasabahRecord;

    // Smart lookup: Check if the identifier is an account number or a CUID
    if (identifier.startsWith('NSB')) {
      nasabahRecord = await db.nasabah.findUnique({
        where: { accountNo: identifier },
        select: {
          id: true, accountNo: true, balance: true, totalWeight: true, depositCount: true, unitId: true,
          user: { select: { id: true, name: true, phone: true, status: true, role: true } },
        },
      });
    } else {
      nasabahRecord = await db.nasabah.findUnique({
        where: { id: identifier },
        select: {
          id: true, accountNo: true, balance: true, totalWeight: true, depositCount: true, unitId: true,
          user: { select: { id: true, name: true, phone: true, status: true, role: true } },
        },
      });
    }

    if (!nasabahRecord) {
      return new NextResponse(JSON.stringify({ error: 'Nasabah tidak ditemukan dengan identifier yang diberikan.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Structure the response to match the canonical Nasabah type
    const responseData: Nasabah = {
      id: nasabahRecord.id,
      accountNo: nasabahRecord.accountNo,
      balance: nasabahRecord.balance,
      totalWeight: nasabahRecord.totalWeight,
      depositCount: nasabahRecord.depositCount,
      unitId: nasabahRecord.unitId,
      user: {
        id: nasabahRecord.user.id,
        name: nasabahRecord.user.name,
        phone: nasabahRecord.user.phone,
        status: nasabahRecord.user.status as 'AKTIF' | 'DITANGGUHKAN',
        role: nasabahRecord.user.role as UserRole,
      },
    };

    return new NextResponse(JSON.stringify(responseData), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(`[API ERROR] /api/nasabah/${id}:`, error);
    return new NextResponse(JSON.stringify({ error: 'Terjadi kesalahan internal saat mengambil data nasabah.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
