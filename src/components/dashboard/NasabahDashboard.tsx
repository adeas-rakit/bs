'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/ui/sidebar';
import BottomBar from '@/components/ui/bottom-bar';
import DashboardStats from '@/components/nasabah/DashboardStats';
import RecentActivity from '@/components/nasabah/RecentActivity';
import TransactionHistory from '@/components/nasabah/TransactionHistory';
import WithdrawalHistory from '@/components/nasabah/WithdrawalHistory';
import NotificationHistory from '@/components/common/NotificationHistory';
import DigitalCard from '@/components/nasabah/DigitalCard';
import AccountSettings from '@/components/nasabah/AccountSettings';
import { Home, TrendingUp, Landmark, QrCode, Settings, AlertTriangle, Bell } from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserHeader } from '@/components/ui/user-header';
import { useTabContext } from '@/context/TabContext';

interface Stats {
  balance: number;
  totalWeight: number;
  totalWithdrawals: number;
}

interface UnitStat extends Stats {
  unitId: string;
  unitName: string;
}

interface DashboardData {
  overall: Stats;
  byUnit: { [key: string]: UnitStat };
  units: { id: string; name: string }[];
  recentTransactions: any[];
  depositCount: number;
  nasabahUnitBalances: any[];
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  transactionId: string | null;
  unitId: string;
  unit: { name: string };
}

interface User {
  id: string;
  name: string;
  unitId?: string | null;
  role: 'NASABAH' | 'UNIT' | 'ADMIN';
}

const NasabahDashboardSkeleton = () => (
  <div className="p-4 sm:p-6 lg:p-8">
    <div className="mb-6">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </div>
    <div>
      <Skeleton className="h-6 w-40 mb-4" />
      <Skeleton className="h-16 rounded-lg mb-2" />
      <Skeleton className="h-16 rounded-lg mb-2" />
      <Skeleton className="h-16 rounded-lg" />
    </div>
  </div>
);

export default function NasabahDashboard({ user }: { user: User | null }) {
  const { activeTab, setActiveTab } = useTabContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { data: dashboardData, loading: loadingDashboard, refetch: refetchDashboard } = useRealtimeData<DashboardData>({ endpoint: '/api/dashboard' });
  const { data: withdrawalsData, loading: loadingWithdrawals, refetch: refetchWithdrawals } = useRealtimeData<{ withdrawals: WithdrawalRequest[] }>({ endpoint: '/api/withdrawals' });

  const withdrawalRequests = withdrawalsData?.withdrawals || [];
  const loading = loadingDashboard || loadingWithdrawals;

  const refetchAll = async () => {
    await Promise.all([
      refetchDashboard(),
      refetchWithdrawals(),
    ]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleWithdrawalRequest = async (amount: number, unitId: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount, unitId }),
    });

    const resData = await response.json();

    if (!response.ok) {
        throw new Error(resData.error || 'Gagal mengajukan penarikan');
    }

    await refetchAll();
    setTimeout(() => {
        setActiveTab('withdrawals');
    }, 4000); 
  };

  const navItems = useMemo(() => [
    { name: 'Iktisar', value: 'overview', icon: Home },
    { name: 'Transaksi', value: 'transactions', icon: TrendingUp },
    { name: 'Penarikan', value: 'withdrawals', icon: Landmark },
    { name: 'Notifikasi', value: 'notifications', icon: Bell, hidden: true },
    { name: 'Kartu Digital', value: 'card', icon: QrCode },
    { name: 'Pengaturan', value: 'settings', icon: Settings },
  ], []);

  const availableNavItems = useMemo(() => {
    if (user?.unitId) {
      return navItems;
    }
    return navItems.filter(item => ['overview', 'card', 'settings'].includes(item.value));
  }, [user, navItems]);

  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } };

  const renderContent = () => {
    if (!user) {
      return <NasabahDashboardSkeleton />;
    }

    if (loading && !dashboardData && user.unitId) {
        return <NasabahDashboardSkeleton />;
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
            {activeTab === 'overview' && (
                <motion.div variants={cardVariants} initial="hidden" animate="visible">
                    {!user.unitId && (
                        <Alert variant="default" className="mb-6 bg-yellow-100 border-yellow-400 text-yellow-800">
                            <AlertTriangle className="h-4 w-4 text-yellow-800" />
                            <AlertTitle>Aktivasi Akun Diperlukan</AlertTitle>
                            <AlertDescription>
                            Untuk mengaktifkan semua fitur, silakan kunjungi unit terdekat dan tunjukkan QR Code dari menu 'Kartu Digital' untuk dipindai oleh petugas.
                            </AlertDescription>
                        </Alert>
                    )}
                    {user.unitId && dashboardData ? (
                        <>
                            <DashboardStats
                                overall={dashboardData.overall}
                                byUnit={dashboardData.byUnit}
                                units={dashboardData.units}
                                depositCount={dashboardData.depositCount}
                                nasabahUnitBalances={dashboardData.nasabahUnitBalances}
                                handleWithdrawalRequest={handleWithdrawalRequest}
                                withdrawalRequests={withdrawalRequests}
                                onSwitchToWithdrawals={() => setActiveTab('withdrawals')}
                            />
                            <RecentActivity recentTransactions={dashboardData.recentTransactions} />
                        </>
                    ) : !user.unitId ? (
                        <div className="text-center p-8 bg-gray-100 rounded-lg">
                            <Home className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Akun Belum Aktif</h3>
                            <p className="mt-1 text-sm text-gray-500">Semua fitur akan ditampilkan saat akun telah diaktifkan melalui Unit Bank Sampah Terdekat</p>
                        </div>
                    ) : null}
                </motion.div>
            )}
            {activeTab === 'transactions' && <TransactionHistory />}
            {activeTab === 'withdrawals' && <WithdrawalHistory />}
            {activeTab === 'notifications' && <NotificationHistory userRole={user.role} />} 
            {activeTab === 'card' && (
                <DigitalCard
                user={user}
                balance={dashboardData?.overall?.balance ?? 0}
                totalWeight={dashboardData?.overall?.totalWeight ?? 0}
                />
            )}
            {activeTab === 'settings' && <AccountSettings user={user} />}
            </motion.div>
        </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar user={user} navItems={availableNavItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 h-screen overflow-hidden">
        <PullToRefresh onRefresh={refetchAll} loading={loading}>
            <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
                <UserHeader user={user} />
                {renderContent()}
            </div>
        </PullToRefresh>
      </main>
      <BottomBar navItems={availableNavItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
}
