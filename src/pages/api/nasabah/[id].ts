import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { Nasabah } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Otentikasi diperlukan.' });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || (user.role !== 'UNIT' && user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa.' });
  }

  const { id } = req.query;

  if (req.method !== 'GET' || typeof id !== 'string') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Metode tidak diizinkan atau ID tidak valid.` });
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
          user: { select: { id: true, name: true, phone: true, status: true } },
        },
      });
    } else {
      nasabahRecord = await db.nasabah.findUnique({
        where: { id: identifier },
        select: {
          id: true, accountNo: true, balance: true, totalWeight: true, depositCount: true, unitId: true,
          user: { select: { id: true, name: true, phone: true, status: true } },
        },
      });
    }

    if (!nasabahRecord) {
      return res.status(404).json({ error: 'Nasabah tidak ditemukan dengan identifier yang diberikan.' });
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
      },
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`[API ERROR] /api/nasabah/${id}:`, error);
    res.status(500).json({ error: 'Terjadi kesalahan internal saat mengambil data nasabah.' });
  }
}
