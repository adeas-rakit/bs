
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

interface Rank {
    rank: number;
    name: string;
    min: number;
}

// --- RANKING RULES DEFINITION ---
const WEIGHT_RANKS: Rank[] = [
    { rank: 8, name: 'Legenda Hijau', min: 1000 },
    { rank: 7, name: 'Pahlawan Nusantara', min: 500 },
    { rank: 6, name: 'Penjaga Bumi', min: 250 },
    { rank: 5, name: 'Ksatria Alam', min: 100 },
    { rank: 4, name: 'Ranger Lingkungan', min: 50 },
    { rank: 3, name: 'Pahlawan Hijau', min: 25 },
    { rank: 2, name: 'Pejuang', min: 10 },
    { rank: 1, name: 'Pemilah', min: 1 },
];

const ROUTINE_RANKS: Rank[] = [
    { rank: 8, name: 'Master Rutin', min: 12 },
    { rank: 7, name: 'Wira Setor', min: 10 },
    { rank: 6, name: 'Pahlawan Konsisten', min: 8 },
    { rank: 5, name: 'Ranger Rutin', min: 6 },
    { rank: 4, name: 'Penjaga Waktu', min: 4 },
    { rank: 3, name: 'Sahabat Setor', min: 3 },
    { rank: 2, name: 'Anak Rutin', min: 2 },
    { rank: 1, name: 'Si Rajin', min: 1 },
];

const BALANCE_RANKS: Rank[] = [
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
function calculateRank(value: number, ranks: Rank[]) {
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

// --- API HANDLER ---
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateUser(request);

        const userId = user.id;

        const nasabah = await db.nasabah.findUnique({
            where: { userId },
            select: { id: true, balance: true, totalWeight: true },
        });

        if (!nasabah) {
            return new NextResponse(JSON.stringify({ error: 'Profil nasabah tidak ditemukan.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
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

        return new NextResponse(JSON.stringify(rankingData), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('Error fetching ranking data:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return new NextResponse(JSON.stringify({ error: 'Otentikasi diperlukan: Token tidak valid atau kedaluwarsa.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        return new NextResponse(JSON.stringify({ error: 'Gagal mengambil data peringkat dari server.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
