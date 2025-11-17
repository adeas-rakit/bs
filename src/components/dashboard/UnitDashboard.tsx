'use client'

import { useState } from 'react'
import { 
  Users,
  Home,
  UserPlus,
  Settings
} from 'lucide-react'
import NasabahManagement from '@/components/unit/NasabahManagement'
import DepositForm from '@/components/unit/DepositForm'
import UnitOverview from '@/components/unit/UnitOverview'
import AccountSettings from '@/components/unit/AccountSettings'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import Sidebar from '@/components/ui/sidebar'
import BottomBar from '@/components/ui/bottom-bar'
import PullToRefresh from '@/components/ui/PullToRefresh'

interface DashboardData {
  totalNasabah: number;
  totalTransactions: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  totalActiveBalance: number;
  totalWasteCollected: number;
  topNasabah: any[];
  recentTransactions: any[];
}

export default function UnitDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: dashboardData, loading, refetch } = useRealtimeData<DashboardData>({endpoint: '/api/dashboard', refreshInterval: 30000});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const navItems = [
    { name: 'Iktisar', value: 'overview', icon: Home },
    { name: 'Nasabah', value: 'nasabah', icon: Users },
    { name: 'Menabung', value: 'deposit', icon: UserPlus },
    { name: 'Pengaturan', value: 'settings', icon: Settings },
  ];

  const handleRefresh = async () => {
    await refetch();
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-20 h-20 border-8 border-t-green-600 border-gray-200 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 h-screen overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh} loading={loading}>
            <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
                {activeTab === 'overview' && dashboardData && (
                    <UnitOverview user={user} dashboardData={dashboardData} />
                )}
                {activeTab === 'nasabah' && <NasabahManagement onUpdate={refetch} />}
                {activeTab === 'deposit' && <DepositForm onSuccess={() => { refetch(); setActiveTab('overview'); }} />}
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
