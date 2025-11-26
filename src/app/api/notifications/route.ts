
import { NextResponse, NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';

interface Notification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
    link: string;
}

const createNotificationId = (type: string, id: string, timestamp?: string, status?: string) => `${type}-${id}-${timestamp || ''}-${status || ''}`;

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

export async function GET(request: NextRequest) {
    try {
        const user = await authenticateUser(request);

        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const page = parseInt(searchParams.get('page') || '1', 10);

        const allNotifications: Notification[] = [];
        const lastRead = user.notificationsLastReadAt;

        if (user.role === 'NASABAH') {
            const nasabah = await db.nasabah.findUnique({ where: { userId: user.id }, select: { id: true } });
            if (!nasabah) return NextResponse.json({ notifications: [], totalPages: 0, currentPage: 1 });
            const nasabahId = nasabah.id;

            const transactions = await db.transaction.findMany({
                where: { nasabahId: nasabahId },
                include: { unit: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
            });
            transactions.forEach(tx => allNotifications.push({
                id: createNotificationId('tx-success', tx.id, tx.createdAt.toISOString()),
                title: 'Setoran Sampah Berhasil',
                message: `Setoran senilai ${formatCurrency(tx.totalAmount)} di ${tx.unit?.name ?? 'Bank Sampah'} telah dicatat.`,
                createdAt: tx.createdAt.toISOString(),
                read: !!(lastRead && tx.createdAt <= lastRead),
                link: 'transactions'
            }));

            const withdrawalRequests = await db.withdrawalRequest.findMany({
                where: { nasabahId: nasabahId },
                include: { unit: { select: { name: true } } },
                orderBy: { updatedAt: 'desc' },
            });
            withdrawalRequests.forEach(wr => {
                if (wr.status === 'PENDING') {
                    allNotifications.push({
                        id: createNotificationId('wr-pending', wr.id),
                        title: 'Menunggu Persetujuan Penarikan',
                        message: `Permohonan Anda sebesar ${formatCurrency(wr.amount)} di ${wr.unit?.name ?? 'Bank Sampah'} sedang diproses.`,
                        createdAt: wr.createdAt.toISOString(),
                        read: false,
                        link: 'withdrawals'
                    });
                } else {
                    const isApproved = wr.status === 'APPROVED';
                    allNotifications.push({
                        id: createNotificationId('wr-update', wr.id, wr.updatedAt.toISOString(), wr.status),
                        title: `Penarikan ${isApproved ? 'Berhasil' : 'Ditolak'}`,
                        message: `Penarikan Anda sebesar ${formatCurrency(wr.amount)} di ${wr.unit?.name ?? 'Bank Sampah'} telah ${isApproved ? 'disetujui' : 'ditolak'}.`,
                        createdAt: wr.updatedAt.toISOString(),
                        read: !!(lastRead && wr.updatedAt <= lastRead),
                        link: 'withdrawals'
                    });
                }
            });
        }

        if (user.role === 'UNIT' && user.unitId) {
            const unitPendingWithdrawals = await db.withdrawalRequest.findMany({
                where: { unitId: user.unitId, status: 'PENDING' },
                include: { nasabah: { include: { user: { select: { name: true } } } } },
                orderBy: { createdAt: 'desc' }
            });
            unitPendingWithdrawals.forEach(wr => allNotifications.push({
                id: createNotificationId('wr-unit-pending', wr.id, wr.createdAt.toISOString()),
                title: 'Permintaan Penarikan Baru',
                message: `${wr.nasabah.user.name} mengajukan penarikan sebesar ${formatCurrency(wr.amount)}. Segera proses.`,
                createdAt: wr.createdAt.toISOString(),
                read: !!(lastRead && wr.createdAt <= lastRead),
                link: 'withdrawals'
            }));
        }

        // Sort all notifications chronologically
        allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Filter notifications if a type is specified
        const filteredNotifications = typeFilter && typeFilter !== 'all'
            ? allNotifications.filter(n => n.link === typeFilter)
            : allNotifications;

        // Apply pagination
        const totalCount = filteredNotifications.length;
        const totalPages = Math.ceil(totalCount / limit);
        const startIndex = (page - 1) * limit;
        const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + limit);

        return NextResponse.json({ 
            notifications: paginatedNotifications,
            totalPages,
            currentPage: page
        });

    } catch (error: any) {
        console.error("GET /api/notifications Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await authenticateUser(request);

        await db.user.update({
            where: { id: user.id },
            data: { notificationsLastReadAt: new Date() }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("POST /api/notifications Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
