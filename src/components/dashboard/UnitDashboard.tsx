'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  UserPlus
} from 'lucide-react'
import NasabahManagement from '@/components/unit/NasabahManagement'
import DepositForm from '@/components/unit/DepositForm'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import Sidebar from '@/components/ui/sidebar'
import BottomBar from '@/components/ui/bottom-bar'

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

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  const formatWeight = (weight: number) => `${(weight || 0).toFixed(2)} kg`;

  const navItems = [
    { name: 'Iktisar', value: 'overview', icon: Home },
    { name: 'Nasabah', value: 'nasabah', icon: Users },
    { name: 'Menabung', value: 'deposit', icon: UserPlus },
  ];

  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

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
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              {activeTab === 'overview' && dashboardData && (
                <motion.div variants={cardVariants} initial="hidden" animate="visible">
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Unit {user.unit?.name}</h1>
                    <p className="text-gray-500">Manajemen operasional unit Anda.</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <motion.div variants={itemVariants}><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Nasabah</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardData.totalNasabah}</div></CardContent></Card></motion.div>
                    <motion.div variants={itemVariants}><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Transaksi</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardData.totalTransactions}</div></CardContent></Card></motion.div>
                    <motion.div variants={itemVariants}><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Sampah</CardTitle><Scale className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatWeight(dashboardData.totalWasteCollected)}</div></CardContent></Card></motion.div>
                    <motion.div variants={itemVariants}><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pemasukan</CardTitle><ArrowUpRight className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(dashboardData.totalDepositAmount)}</div></CardContent></Card></motion.div>
                    <motion.div variants={itemVariants}><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Penarikan</CardTitle><ArrowDownRight className="h-4 w-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData.totalWithdrawalAmount)}</div></CardContent></Card></motion.div>
                    <motion.div variants={itemVariants}><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Saldo Aktif</CardTitle><DollarSign className="h-4 w-4 text-indigo-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-indigo-600">{formatCurrency(dashboardData.totalActiveBalance)}</div></CardContent></Card></motion.div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <motion.div variants={itemVariants}><Card><CardHeader><CardTitle>Nasabah Teratas</CardTitle></CardHeader><CardContent><ScrollArea className="h-80"><div className="space-y-4 pr-4">{dashboardData.topNasabah.map((n, i) => (<div key={n.id} className="flex items-center"><div className="font-bold mr-4">#{i + 1}</div><div className="flex-grow"><p className="font-semibold">{n.user.name}</p><p className="text-sm text-muted-foreground">Total: {formatWeight(n.totalWeight)}</p></div><div className="text-right"><div className="font-medium">{n.depositCount}x</div><div className="text-sm text-muted-foreground">Nabung</div></div></div>))}</div></ScrollArea></CardContent></Card></motion.div>
                    <motion.div variants={itemVariants}><Card><CardHeader><CardTitle>Aktivitas Terkini</CardTitle></CardHeader><CardContent><ScrollArea className="h-80"><div className="space-y-4 pr-4">{dashboardData.recentTransactions.map(t => (<div key={t.id} className="flex items-center"><div className="flex-grow"><p className="font-semibold">{t.transactionNo}</p><p className="text-sm text-muted-foreground">{t.nasabah.user.name}</p></div><div className="text-right"><Badge variant={t.type === 'DEPOSIT' ? 'default' : 'destructive'}>{t.type}</Badge><p className="font-semibold text-sm mt-1">{formatCurrency(t.totalAmount)}</p></div></div>))}</div></ScrollArea></CardContent></Card></motion.div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'nasabah' && <NasabahManagement onUpdate={refetch} />}
              {activeTab === 'deposit' && <DepositForm onSuccess={() => { refetch(); setActiveTab('overview'); }} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomBar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
}
