'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useTabContext } from '@/context/TabContext';

type UserRole = 'NASABAH' | 'UNIT' | 'ADMIN';

interface NotificationHistoryProps {
    userRole: UserRole;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link: string;
}

interface ApiResponse {
    notifications: Notification[];
    totalPages: number;
    currentPage: number;
}

const NotificationItemSkeleton = () => (
    <div className="flex items-start space-x-4 p-4">
        <Skeleton className="h-8 w-8 mt-1 rounded-full" />
        <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/4" />
        </div>
    </div>
);

export default function NotificationHistory({ userRole }: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false); 
  const [initialLoading, setInitialLoading] = useState(true);
  const { setActiveTab: setDashboardTab } = useTabContext();

  const TABS = useMemo(() => {
    if (userRole === 'NASABAH') {
        return [
            { label: 'Semua', value: 'all' },
            { label: 'Setoran', value: 'transactions' },
            { label: 'Penarikan', value: 'withdrawals' },
        ];
    }
    if (userRole === 'UNIT') {
        return [
            { label: 'Semua', value: 'all' },
            { label: 'Penarikan', value: 'withdrawals' },
        ];
    }
    return [{ label: 'Semua', value: 'all' }]; // Default for ADMIN or other roles
  }, [userRole]);

  const [activeTab, setActiveTab] = useState(TABS[0].value);

  const fetchNotifications = useCallback(async (newPage: number, type: string, isNewTab: boolean) => {
    if (isNewTab) setInitialLoading(true); else setLoading(true);
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token found");

        const response = await fetch(`/api/notifications?type=${type}&page=${newPage}&limit=15`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data: ApiResponse = await response.json();

        setNotifications(isNewTab ? data.notifications : prev => [...prev, ...data.notifications]);
        setTotalPages(data.totalPages);
        setPage(data.currentPage);
    } catch (error) {
        console.error("Error fetching notifications:", error);
    } finally {
        if (isNewTab) setInitialLoading(false); else setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Reset and fetch when tab changes
    fetchNotifications(1, activeTab, true);
  }, [activeTab, fetchNotifications]);

  // Reset active tab if TABS configuration changes (e.g. role change)
  useEffect(() => {
    setActiveTab(TABS[0].value);
  }, [TABS]);

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      fetchNotifications(page + 1, activeTab, false);
    }
  };

  const handleNotificationClick = (link: string) => {
      if (link) setDashboardTab(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'><Bell className='mr-2'/> Riwayat Notifikasi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 border-b mb-4">
            {TABS.map(tab => (
                <Button 
                    key={tab.value} 
                    variant={activeTab === tab.value ? 'default' : 'ghost'}
                    onClick={() => setActiveTab(tab.value)}
                    className='rounded-t-md rounded-b-none'
                >
                    {tab.label}
                </Button>
            ))}
        </div>

        {initialLoading ? (
          <div>
            {[...Array(3)].map((_, i) => <NotificationItemSkeleton key={i} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CheckCheck className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4">Tidak ada notifikasi dalam kategori ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 rounded-lg flex items-start space-x-4 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50 ${notif.read ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-blue-50 dark:bg-blue-900/20'}`}
                onClick={() => handleNotificationClick(notif.link)}
              >
                <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                <div className="flex-1">
                    <p className='font-semibold'>{notif.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                    </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center">
            {page < totalPages && (
                <Button onClick={handleLoadMore} variant="outline" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
                </Button>
            )}
            {!initialLoading && page >= totalPages && notifications.length > 0 && (
                <p className="text-sm text-gray-400">Anda telah mencapai akhir daftar.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
