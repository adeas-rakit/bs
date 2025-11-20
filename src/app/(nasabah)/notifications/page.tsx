
'use client'
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Notification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
    link?: string;
}

const NotificationSkeleton = () => (
    <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                <Skeleton className="h-6 w-6 mt-1 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
        ))}
    </div>
);

export default function AllNotificationsPage() {
    const { data, loading, error } = useRealtimeData<{ notifications: Notification[] }>({ 
        endpoint: '/api/notifications?all=true' 
    });

    const notifications = data?.notifications || [];

    const getErrorMessage = (err: any): string => {
        if (err instanceof Error) return err.message;
        if (typeof err === 'object' && err !== null && 'error' in err) return String(err.error);
        return "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi nanti.";
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell />
                    Semua Notifikasi
                </CardTitle>
                <CardDescription>
                    Lihat semua riwayat notifikasi Anda di sini.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading && <NotificationSkeleton />}
                {error && (
                    <EmptyState
                        icon={<AlertCircle className="h-12 w-12 text-red-500" />}
                        title="Gagal Memuat Notifikasi"
                        description={getErrorMessage(error)}
                    />
                )}
                {!loading && !error && notifications.length === 0 && (
                    <EmptyState
                        icon={<Bell className="h-12 w-12 text-gray-400" />}
                        title="Tidak Ada Notifikasi"
                        description="Anda belum memiliki notifikasi apa pun saat ini."
                    />
                )}
                {!loading && !error && notifications.length > 0 && (
                    <div className="space-y-3">
                        {notifications.map((notif) => (
                            <Link 
                                href={notif.link || '#'} 
                                key={notif.id} 
                                className={`block p-4 border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!notif.read ? 'border-blue-300 dark:border-blue-700' : ''}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{notif.title}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
