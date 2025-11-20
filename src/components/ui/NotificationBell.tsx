'use client'
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useTabContext } from '@/context/TabContext';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link: string;
}

interface NotificationsApiResponse {
    notifications: Notification[];
    totalPages: number;
    currentPage: number;
}

const NotificationSkeleton = () => (
  <div className="p-4 space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-start gap-3">
        <Skeleton className="h-5 w-5 mt-1 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

export default function NotificationBell() {
  const { data, loading, refetch } = useRealtimeData<NotificationsApiResponse>({ endpoint: '/api/notifications?limit=10' });
  const { setActiveTab } = useTabContext();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const notifications = useMemo(() => data?.notifications || [], [data]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
        // Refetch on open to ensure data is fresh
        refetch();
    }
    if (open && unreadCount > 0) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch('/api/notifications', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
              },
          });
          // Refetch after marking as read to update the UI
          refetch();
        }
      } catch (error) {
        console.error("Failed to mark notifications as read", error);
      }
    }
  };

  const handleNotificationClick = (link: string) => {
    if (link.startsWith('/')) {
      router.push(link);
    } else {
      setActiveTab(link);
    }
    setIsOpen(false);
  };

  const handleSeeAllClick = () => {
    setActiveTab('notifications');
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold">Notifikasi</h4>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {(loading && notifications.length === 0) ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">Tidak ada notifikasi baru.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map(notif => (
                    <div
                        key={notif.id}
                        className={`block p-3 transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                        onClick={() => handleNotificationClick(notif.link)}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{notif.title}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
        <div className="p-1 border-t border-gray-100 dark:border-gray-800">
            <Button asChild variant="link" size="sm" className="w-full cursor-pointer"  onClick={handleSeeAllClick}>
                <div>
                    Lihat Semua Notifikasi
                </div>
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
