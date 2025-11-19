
'use client'

import { useState } from 'react'
import { 
  Users, 
  Building,
  TrendingUp, 
  Scale,
  Home,
  CreditCard,
  Settings
} from 'lucide-react'
import UnitsManagement from '@/components/admin/UnitsManagement'
import UsersManagement from '@/components/admin/UsersManagement'
import TransactionsMonitoring from '@/components/admin/TransactionsMonitoring'
import WasteTypesManagement from '@/components/admin/WasteTypesManagement'
import WithdrawalRequestsManagement from '@/components/admin/WithdrawalRequestsManagement'
import Overview from '@/components/admin/Overview'
import AccountSettings from '@/components/admin/AccountSettings'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import Sidebar from '@/components/ui/sidebar'
import BottomBar from '@/components/ui/bottom-bar'
import FloatingAddButton from '@/components/ui/FloatingAddButton';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardData {
  totalUnits: number
  totalNasabah: number
  totalTransactions: number
  totalDepositAmount: number
  totalWithdrawalAmount: number
  totalActiveBalance: number
  totalWasteCollected: number
  topNasabah: any[]
  recentTransactions: any[]
}

const AdminDashboardSkeleton = () => (
    <div className="p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-40 rounded-lg" />
            </div>
            <div>
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-40 rounded-lg" />
            </div>
        </div>
  </div>
);


export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { data: dashboardData, loading, refetch } = useRealtimeData<DashboardData>({endpoint: '/api/dashboard', refreshInterval: 30000})
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  const navItems = [
    { name: 'Iktisar', value: 'overview', icon: Home },
    { name: 'Unit', value: 'units', icon: Building },
    { name: 'Transaksi', value: 'transactions', icon: TrendingUp },
    { name: 'Pengguna', value: 'users', icon: Users },
    { name: 'Harga Sampah', value: 'waste-types', icon: Scale },
    { name: 'Penarikan', value: 'withdrawals', icon: CreditCard },
    { name: 'Pengaturan', value: 'settings', icon: Settings },
  ]

  const handleRefresh = async () => {
    await refetch();
  };

  const renderContent = () => {
    if (loading && !dashboardData) {
        return <AdminDashboardSkeleton />;
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }}>
                {activeTab === 'overview' && dashboardData && (
                    <Overview user={user} dashboardData={dashboardData} />
                )}
                {activeTab === 'units' && <UnitsManagement isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} />}
                {activeTab === 'transactions' && <TransactionsMonitoring />}
                {activeTab === 'users' && <UsersManagement isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} />}
                {activeTab === 'waste-types' && <WasteTypesManagement isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} />}
                {activeTab === 'withdrawals' && <WithdrawalRequestsManagement />}
                {activeTab === 'settings' && <AccountSettings user={user} />}
            </motion.div>
        </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar user={user} navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 overflow-hidden h-screen">
        <PullToRefresh onRefresh={handleRefresh} loading={loading}>
            <div className="p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
                {renderContent()}
            </div>
        </PullToRefresh>
      </main>

      <BottomBar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />

      {['units', 'users', 'waste-types'].includes(activeTab) && (
          <FloatingAddButton onClick={() => setIsFormOpen(true)} />
      )}
    </div>
  )
}
