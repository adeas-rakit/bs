
'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/ui/sidebar';
import BottomBar from '@/components/ui/bottom-bar';
import DashboardStats from '@/components/nasabah/DashboardStats';
import RecentActivity from '@/components/nasabah/RecentActivity';
import TransactionHistory from '@/components/nasabah/TransactionHistory';
import WithdrawalHistory from '@/components/nasabah/WithdrawalHistory';
import DigitalCard from '@/components/nasabah/DigitalCard';
import AccountSettings from '@/components/nasabah/AccountSettings';
import { Home, TrendingUp, Landmark, QrCode, Settings } from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import PullToRefresh from '@/components/ui/PullToRefresh';

// Interfaces from API
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
  depositCount: number; // assuming this is still part of the data
  nasabahUnitBalances: any[];
}

interface Transaction {
  id: string;
  transactionNo: string;
  type: string;
  totalAmount: number;
  totalWeight: number;
  status: string;
  createdAt: string;
  unit: { name: string };
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  transactionId: string | null;
}

export default function NasabahDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { data: dashboardData, loading: loadingDashboard, refetch: refetchDashboard } = useRealtimeData<DashboardData>({ endpoint: '/api/dashboard' });
  const { data: transactionsData, loading: loadingTransactions, refetch: refetchTransactions } = useRealtimeData<{ transactions: Transaction[] }>({ endpoint: '/api/transactions' });
  const { data: withdrawalsData, loading: loadingWithdrawals, refetch: refetchWithdrawals } = useRealtimeData<{ withdrawals: WithdrawalRequest[] }>({ endpoint: '/api/withdrawals' });

  const transactions = transactionsData?.transactions || [];
  const withdrawalRequests = withdrawalsData?.withdrawals || [];
  const loading = loadingDashboard || loadingTransactions || loadingWithdrawals;

  const refetchAll = async () => {
    await Promise.all([
      refetchDashboard(),
      refetchTransactions(),
      refetchWithdrawals(),
    ]);
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const searchMatch = searchTerm ? t.transactionNo.toLowerCase().includes(searchTerm.toLowerCase()) : true;
        const typeMatch = typeFilter !== 'all' ? t.type === typeFilter : true;
        return searchMatch && typeMatch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, searchTerm, typeFilter]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleWithdrawalRequest = async (amount: number, unitId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount, unitId }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Gagal mengajukan penarikan');

      toast({ title: "Berhasil", description: "Pengajuan penarikan telah dikirim." });
      await refetchAll();
      setActiveTab('withdrawals');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const navItems = [
    { name: 'Iktisar', value: 'overview', icon: Home },
    { name: 'Transaksi', value: 'transactions', icon: TrendingUp },
    { name: 'Penarikan', value: 'withdrawals', icon: Landmark },
    { name: 'Kartu Digital', value: 'card', icon: QrCode },
    { name: 'Pengaturan', value: 'settings', icon: Settings },
  ];

  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } };

  if (loading && !dashboardData) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-20 h-20 border-8 border-t-green-600 border-gray-200 rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 h-screen overflow-hidden">
        <PullToRefresh onRefresh={refetchAll} loading={loading}>
          <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
                {activeTab === 'overview' && dashboardData && (
                  <motion.div variants={cardVariants} initial="hidden" animate="visible">
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold text-gray-800">Halo, {user.name}!</h1>
                      <p className="text-gray-500">Selamat datang kembali di dasbor Anda.</p>
                    </div>
                    <DashboardStats
                      overall={dashboardData.overall}
                      byUnit={dashboardData.byUnit}
                      units={dashboardData.units}
                      depositCount={dashboardData.depositCount}
                      nasabahUnitBalances={dashboardData.nasabahUnitBalances}
                      handleWithdrawalRequest={handleWithdrawalRequest}
                    />
                    <RecentActivity recentTransactions={dashboardData.recentTransactions} />
                  </motion.div>
                )}
                {activeTab === 'transactions' && (
                  <TransactionHistory
                    transactions={filteredTransactions}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                  />
                )}
                {activeTab === 'withdrawals' && (
                  <WithdrawalHistory withdrawalRequests={withdrawalRequests} />
                )}
                {activeTab === 'card' && dashboardData && (
                  <DigitalCard
                    user={user}
                    balance={dashboardData.overall.balance}
                    totalWeight={dashboardData.overall.totalWeight}
                  />
                )}
                {activeTab === 'settings' && <AccountSettings user={user} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </PullToRefresh>
      </main>
      <BottomBar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
}
