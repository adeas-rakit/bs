'use client';

import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

// --- RANKING RULES DEFINITION ---
const WEIGHT_RANKS = [
    { rank: 8, name: 'Legenda Hijau', min: 1000 },
    { rank: 7, name: 'Pahlawan Nusantara', min: 500 },
    { rank: 6, name: 'Penjaga Bumi', min: 250 },
    { rank: 5, name: 'Ksatria Alam', min: 100 },
    { rank: 4, name: 'Ranger Lingkungan', min: 50 },
    { rank: 3, name: 'Pahlawan Hijau', min: 25 },
    { rank: 2, name: 'Pejuang', min: 10 },
    { rank: 1, name: 'Pemilah', min: 1 },
];

const ROUTINE_RANKS = [
    { rank: 8, name: 'Master Rutin', min: 12 },
    { rank: 7, name: 'Wira Setor', min: 10 },
    { rank: 6, name: 'Pahlawan Konsisten', min: 8 },
    { rank: 5, name: 'Ranger Rutin', min: 6 },
    { rank: 4, name: 'Penjaga Waktu', min: 4 },
    { rank: 3, name: 'Sahabat Setor', min: 3 },
    { rank: 2, name: 'Anak Rutin', min: 2 },
    { rank: 1, name: 'Si Rajin', min: 1 },
];

const BALANCE_RANKS = [
    { rank: 8, name: 'Penabung Legenda', min: 1000000 },
    { rank: 7, name: 'Penabung Elite', min: 750000 },
    { rank: 6, name: 'Penabung Utama', min: 500000 },
    { rank: 5, name: 'Penabung Unggul', min: 350000 },
    { rank: 4, name: 'Penabung Hebat', min: 200000 },
    { rank: 3, name: 'Penabung Pintar', min: 100000 },
    { rank: 2, name: 'Penabung Rajin', min: 50000 },
    { rank: 1, name: 'Penabung Kecil', min: 10000 },
];

// --- CALCULATION LOGIC ---
function calculateRank(value, ranks) {
    const currentRank = ranks.find(r => value >= r.min) || { rank: 0, name: 'Pemula', min: 0 };
    const nextRank = ranks.find(r => r.rank === currentRank.rank + 1);

    let progress = 0;
    if (nextRank) {
        const prevMin = currentRank.min || 0;
        const range = nextRank.min - prevMin;
        progress = range > 0 ? ((value - prevMin) / range) * 100 : 0;
    } else {
        progress = 100; // Max rank reached
    }

    return {
        rank: currentRank.rank,
        name: currentRank.name,
        value,
        nextRank: nextRank ? { name: nextRank.name, target: nextRank.min } : null,
        progress: Math.min(100, Math.floor(progress)),
    };
}

// --- API HANDLER ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Otentikasi diperlukan: Token tidak ditemukan.' });
        }

        const token = authHeader.split(' ')[1];
        const user = await getUserFromToken(token);

        if (!user?.id) {
            return res.status(401).json({ error: 'Otentikasi diperlukan: Token tidak valid.' });
        }

        const userId = user.id;

        const nasabah = await db.nasabah.findUnique({
            where: { userId },
            select: { id: true, balance: true, totalWeight: true },
        });

        if (!nasabah) {
            return res.status(404).json({ error: 'Profil nasabah tidak ditemukan.' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const depositsLastMonth = await db.transaction.count({
            where: {
                nasabahId: nasabah.id,
                type: 'DEPOSIT',
                createdAt: { gte: thirtyDaysAgo },
            },
        });

        const stats = {
            totalWeight: nasabah.totalWeight ?? 0,
            depositsLastMonth: depositsLastMonth ?? 0,
            balance: nasabah.balance ?? 0,
        };

        const rankingData = {
            weight: calculateRank(stats.totalWeight, WEIGHT_RANKS),
            routine: calculateRank(stats.depositsLastMonth, ROUTINE_RANKS),
            balance: calculateRank(stats.balance, BALANCE_RANKS),
        };

        res.status(200).json(rankingData);

    } catch (error) {
        console.error('Error fetching ranking data:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Otentikasi diperlukan: Token tidak valid atau kedaluwarsa.' });
        }
        res.status(500).json({ error: 'Gagal mengambil data peringkat dari server.' });
    }
}
