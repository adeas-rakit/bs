'use client'

import { useState } from 'react'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Building,
  CreditCard,
  Archive
} from 'lucide-react'
import UnitsManagement from '@/components/admin/UnitsManagement'
import UsersManagement from '@/components/admin/UsersManagement'
import TransactionsMonitoring from '@/components/admin/TransactionsMonitoring'
import WasteTypesManagement from '@/components/admin/WasteTypesManagement'
import WithdrawalRequestsManagement from '@/components/admin/WithdrawalRequestsManagement'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import Sidebar from '@/components/ui/sidebar'
import BottomBar from '@/components/ui/bottom-bar'
import { InfoCard } from '@/components/ui/InfoCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FloatingAddButton from '@/components/ui/FloatingAddButton';

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

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { data: dashboardData, loading } = useRealtimeData<DashboardData>({endpoint: '/api/dashboard', refreshInterval: 30000})
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)
  const formatWeight = (weight: number) => `${(weight || 0).toFixed(2)} kg`

  const navItems = [
    { name: 'Iktisar', value: 'overview', icon: Home },
    { name: 'Unit', value: 'units', icon: Building },
    { name: 'Transaksi', value: 'transactions', icon: TrendingUp },
    { name: 'Pengguna', value: 'users', icon: Users },
    { name: 'Harga Sampah', value: 'waste-types', icon: Scale },
    { name: 'Penarikan', value: 'withdrawals', icon: CreditCard },
  ]

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-20 h-20 border-8 border-t-green-600 border-gray-200 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1">
         <div className="p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
            <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }}>
                {activeTab === 'overview' && dashboardData && (
                <div className="space-y-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Iktisar</h1>
                        <p className="text-sm text-gray-500">Selamat datang, {user.name}. Pantau semua aktivitas bank sampah.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatCard title="Saldo Aktif Nasabah" value={formatCurrency(dashboardData.totalActiveBalance)} icon={DollarSign} />
                        <StatCard title="Total Pemasukan" value={formatCurrency(dashboardData.totalDepositAmount)} icon={ArrowUpRight} />
                        <StatCard title="Total Penarikan" value={formatCurrency(dashboardData.totalWithdrawalAmount)} icon={ArrowDownRight} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <InfoCard
                            id="top-nasabah"
                            title="Nasabah Teratas"
                            subtitle={`${dashboardData.topNasabah.length} Nasabah`}
                            icon={<Users/>}
                            isCollapsible={true}
                            initialInfo={
                                <div className="text-sm text-gray-600">Nasabah dengan total deposit sampah terberat.</div>
                            }
                            expandedInfo={
                                <div className="space-y-2 pt-2 pr-2 max-h-52 overflow-y-auto">
                                    {dashboardData.topNasabah.map((n, i) => (
                                        <div key={n.id} className="flex items-center bg-gray-50 p-2 rounded-lg">
                                            <div className="font-bold mr-3 text-gray-400">#{i+1}</div>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-gray-800 text-sm">{n.user.name}</p>
                                                <p className="text-xs text-muted-foreground">Total: {formatWeight(n.totalWeight)} ({n.depositCount}x)</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }
                        />
                        <InfoCard
                            id="recent-transactions"
                            title="Aktivitas Terkini"
                            subtitle={`${dashboardData.recentTransactions.length} Transaksi`}
                            icon={<TrendingUp/>}
                            isCollapsible={true}
                            initialInfo={
                                <div className="text-sm text-gray-600">Transaksi terbaru di semua unit.</div>
                            }
                            expandedInfo={
                                <div className="space-y-2 pt-2 pr-2 max-h-52 overflow-y-auto">
                                    {dashboardData.recentTransactions.map(t => (
                                        <div key={t.id} className="flex items-center bg-gray-50 p-2 rounded-lg">
                                            <div className="flex-grow">
                                                <p className="font-semibold text-gray-800 text-xs">{t.transactionNo}</p>
                                                <p className="text-xs text-muted-foreground">{t.nasabah.user.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={t.type === 'DEPOSIT' ? 'default' : 'destructive'}>{t.type}</Badge>
                                                <p className="font-semibold text-sm mt-1">{formatCurrency(t.totalAmount)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }
                        />
                    </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard title="Total Unit" value={`${dashboardData.totalUnits}`} icon={Building2} />
                        <StatCard title="Total Nasabah" value={`${dashboardData.totalNasabah}`} icon={Users} />
                        <StatCard title="Jml. Transaksi" value={`${dashboardData.totalTransactions}`} icon={TrendingUp} />
                        <StatCard title="Total Sampah" value={formatWeight(dashboardData.totalWasteCollected)} icon={Archive} />
                    </div>
                </div>
                )}
                {activeTab === 'units' && <UnitsManagement isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} />}
                {activeTab === 'transactions' && <TransactionsMonitoring />}
                {activeTab === 'users' && <UsersManagement isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} />}
                {activeTab === 'waste-types' && <WasteTypesManagement isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} />}
                {activeTab === 'withdrawals' && <WithdrawalRequestsManagement />}
            </motion.div>
            </AnimatePresence>
        </div>
      </main>

      <BottomBar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />

      {['units', 'users', 'waste-types'].includes(activeTab) && (
          <FloatingAddButton onClick={() => setIsFormOpen(true)} />
      )}
    </div>
  )
}
