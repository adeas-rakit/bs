'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Scale,
  TrendingUp,
  Calendar,
  Home,
  CreditCard,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  Landmark
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WithdrawalRequestForm } from '@/components/nasabah/WithdrawalRequestForm'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/ui/sidebar'
import BottomBar from '@/components/ui/bottom-bar'

// Interfaces... (keep them as they are)
interface DashboardData {
  balance: number
  totalWeight: number
  depositCount: number
  totalDeposits: number
  totalWithdrawals: number
  recentTransactions: any[]
}

interface Transaction {
  id: string
  transactionNo: string
  type: string
  totalAmount: number
  totalWeight: number
  status: string
  createdAt: string
  unit: {
    name: string
  }
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  transactionId: string | null;
}


export default function NasabahDashboard({ user }: { user: any }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const { toast } = useToast()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const fetchAllData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem('token')
      const [dashboardRes, transactionsRes, withdrawalsRes] = await Promise.all([
        fetch('/api/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/withdrawals', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!dashboardRes.ok || !transactionsRes.ok || !withdrawalsRes.ok) throw new Error('Gagal memuat semua data');

      const dashboardJson = await dashboardRes.json();
      const transactionsJson = await transactionsRes.json();
      const withdrawalsJson = await withdrawalsRes.json();

      setDashboardData(dashboardJson.data);
      setTransactions(transactionsJson.transactions);
      setWithdrawalRequests(withdrawalsJson.withdrawals);

    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat data. Silakan refresh halaman.", variant: "destructive" })
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => { fetchAllData() }, []);

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
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }
  
  const handleWithdrawalRequest = async (amount: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Gagal mengajukan penarikan');
      
      toast({ title: "Berhasil", description: "Pengajuan penarikan telah dikirim." });
      await fetchAllData(false); // Refetch without main loading screen
      setActiveTab('withdrawals');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)
  const formatWeight = (weight: number) => `${(weight || 0).toFixed(2)} kg`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const navItems = [
    { name: 'Iktisar', value: 'overview', icon: Home },
    { name: 'Transaksi', value: 'transactions', icon: TrendingUp },
    { name: 'Penarikan', value: 'withdrawals', icon: Landmark },
    { name: 'Kartu Digital', value: 'card', icon: QrCode },
  ]

  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (loading || !dashboardData) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-20 h-20 border-8 border-t-green-600 border-gray-200 rounded-full" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              {activeTab === 'overview' && (
                <motion.div variants={cardVariants} initial="hidden" animate="visible">
                   <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Halo, {user.name}!</h1>
                    <p className="text-gray-500">Selamat datang kembali di dasbor Anda.</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div variants={itemVariants} className="lg:col-span-2"><Card className="bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-lg"><CardHeader><CardTitle>Saldo Aktif</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold mb-4">{formatCurrency(dashboardData.balance)}</p><WithdrawalRequestForm balance={dashboardData.balance} onSubmit={handleWithdrawalRequest} /></CardContent></Card></motion.div>
                    <motion.div variants={itemVariants} className="space-y-4"><Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Sampah</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatWeight(dashboardData.totalWeight)}</p><p className="text-xs text-muted-foreground">dari {dashboardData.depositCount} kali menabung</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Penarikan</CardTitle><ArrowDownRight className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardData.totalWithdrawals} kali</div></CardContent></Card></motion.div>
                  </div>
                  <motion.div variants={itemVariants} className="mt-6"><Card><CardHeader><CardTitle>Aktivitas Terkini</CardTitle></CardHeader><CardContent><ScrollArea className="h-60"><div className="space-y-4 pr-4">{dashboardData.recentTransactions.map(t => (<div key={t.id} className="flex items-center"><div className="flex-grow"><p className="font-semibold text-sm">{t.transactionNo}</p><p className="text-xs text-muted-foreground">{t.unit?.name} &bull; {formatDate(t.createdAt)}</p></div><div className="text-right"><Badge variant={t.type === 'DEPOSIT' ? 'default' : 'destructive'} className="capitalize text-xs">{t.type.toLowerCase()}</Badge><p className="font-semibold text-sm mt-1">{formatCurrency(t.totalAmount)}</p></div></div>))}</div></ScrollArea></CardContent></Card></motion.div>
                </motion.div>
              )}
              {activeTab === 'transactions' && (
                  <Card><CardHeader><CardTitle>Riwayat Transaksi</CardTitle><CardDescription>Cari dan filter riwayat transaksi Anda</CardDescription></CardHeader><CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <Input placeholder="Cari No. Transaksi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sm:col-span-2"/>
                          <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue placeholder="Tipe" /></SelectTrigger><SelectContent><SelectItem value="all">Semua Tipe</SelectItem><SelectItem value="DEPOSIT">Deposit</SelectItem><SelectItem value="WITHDRAWAL">Penarikan</SelectItem></SelectContent></Select>
                      </div>
                      <ScrollArea className="h-[60vh]"><div className="space-y-4 pr-4">{filteredTransactions.map((t) => (<Card key={t.id}><CardContent className="p-4 flex justify-between items-center"><div className="space-y-1"><h3 className="font-semibold text-sm">{t.transactionNo}</h3><p className="text-xs text-muted-foreground"><Landmark className="inline h-3 w-3 mr-1"/>{t.unit?.name}</p><p className="text-xs text-muted-foreground"><Calendar className="inline h-3 w-3 mr-1"/>{formatDate(t.createdAt)}</p></div><div className="text-right"><p className={`font-semibold text-base ${t.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.totalAmount)}</p><Badge variant={t.status === 'SUCCESS' ? 'default' : 'secondary'} className="capitalize text-xs mt-1">{t.status.toLowerCase()}</Badge></div></CardContent></Card>))}</div></ScrollArea>
                  </CardContent></Card>
              )}
              {activeTab === 'withdrawals' && (
                  <Card><CardHeader><CardTitle>Riwayat Penarikan</CardTitle><CardDescription>Daftar pengajuan penarikan dana Anda.</CardDescription></CardHeader><CardContent><ScrollArea className="h-[70vh]"><div className="space-y-4 pr-4">{withdrawalRequests.length > 0 ? (withdrawalRequests.map((req) => (<Card key={req.id}><CardContent className="p-4 flex items-center justify-between"><div className="space-y-1"><p className="font-semibold text-lg">{formatCurrency(req.amount)}</p><p className="text-sm text-muted-foreground"><Calendar className="inline h-3 w-3 mr-1"/>{formatDate(req.createdAt)}</p></div><Badge variant={req.status === 'PENDING' ? 'secondary' : req.status === 'APPROVED' ? 'default' : 'destructive'} className="capitalize text-sm">{req.status.replace('APPROVED', 'SUCCESS').toLowerCase()}</Badge></CardContent></Card>))) : (<div className="text-center text-gray-500 py-10"><p>Belum ada riwayat penarikan.</p></div>)}</div></ScrollArea></CardContent></Card>
              )}
              {activeTab === 'card' && (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center items-center h-full">
                    <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 text-white font-mono relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/20 rounded-full filter blur-xl"></div>
                        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500/20 rounded-full filter blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-2xl font-bold tracking-wider">E-SBM</span>
                                <img src="/logo.svg" alt="Logo" className="w-12 h-12 opacity-80"/>
                            </div>
                            <div className="text-center my-8">
                                <img src={user.qrCode} alt="QR Code" className="w-32 h-32 rounded-lg ring-4 ring-white/50 mx-auto" />
                            </div>
                            <div className="text-center mb-6">
                                <p className="text-2xl font-bold tracking-wider">{user.name}</p>
                                <p className="text-lg text-green-400 tracking-widest font-sans">{user.nasabah?.accountNo}</p>
                            </div>
                            <div className="flex justify-between items-end bg-black/20 p-4 rounded-lg">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-white/50">Saldo</p>
                                    <p className="text-xl font-bold tracking-wider">{formatCurrency(dashboardData.balance)}</p>
                                </div>
                                <div>
                                   <p className="text-xs uppercase tracking-wider text-white/50">Total Sampah</p>
                                   <p className="text-xl font-bold tracking-wider text-right">{formatWeight(dashboardData.totalWeight)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomBar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  )
}
