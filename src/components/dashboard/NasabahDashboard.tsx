'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign, 
  Scale,
  TrendingUp,
  Calendar,
  Settings,
  LogOut,
  Home,
  CreditCard,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  Search
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

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
  items: Array<{
    wasteType: {
      name: string
      pricePerKg: number
    }
    weight: number
    amount: number
  }>
}

import BottomNavigation from '@/components/common/BottomNavigation'

export default function NasabahDashboard({ user }: { user: any }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data.data)
        setTransactions(data.data.recentTransactions)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      
      const response = await fetch(`/api/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data transaksi",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [searchTerm, typeFilter, dateFrom, dateTo])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)} kg`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Nasabah</h1>
            <p className="text-gray-600">Selamat datang, {user.name}</p>
            {user.nasabah && (
              <p className="text-sm text-green-600 font-medium">No. {user.nasabah.accountNo}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Pengaturan
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Iktisar</TabsTrigger>
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="card">Kartu</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {dashboardData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white">Saldo Aktif</CardTitle>
                      <DollarSign className="h-4 w-4 text-white" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {formatCurrency(dashboardData.balance)}
                      </div>
                      <p className="text-xs text-green-100">
                        Tersedia untuk penarikan
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white">Total Sampah</CardTitle>
                      <Scale className="h-4 w-4 text-white" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {formatWeight(dashboardData.totalWeight)}
                      </div>
                      <p className="text-xs text-blue-100">
                        Dari {dashboardData.depositCount} kali menabung
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Tabungan</CardTitle>
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.totalDeposits} kali
                      </div>
                      <p className="text-xs text-gray-500">
                        Jumlah transaksi menabung
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Penarikan</CardTitle>
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {dashboardData.totalWithdrawals} kali
                      </div>
                      <p className="text-xs text-gray-500">
                        Jumlah transaksi penarikan
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Transaksi Terakhir</CardTitle>
                    <CardDescription>Aktivitas tabungan Anda</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {dashboardData.recentTransactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{transaction.transactionNo}</p>
                              <p className="text-sm text-gray-500">
                                {transaction.unit?.name} • {formatDate(transaction.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={transaction.type === 'DEPOSIT' ? 'default' : 'secondary'}>
                                {transaction.type === 'DEPOSIT' ? 'Tabung' : 'Tarik'}
                              </Badge>
                              <p className="font-medium">{formatCurrency(transaction.totalAmount)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari transaksi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="DEPOSIT">Tabung</SelectItem>
                  <SelectItem value="WITHDRAWAL">Tarik</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Dari tanggal"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full md:w-40"
              />
              <Input
                type="date"
                placeholder="Sampai tanggal"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full md:w-40"
              />
            </div>

            <ScrollArea className="h-96">
              <div className="grid gap-4">
                {transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{transaction.transactionNo}</h3>
                            <Badge 
                              variant={transaction.type === 'DEPOSIT' ? 'default' : 'secondary'}
                              className={transaction.type === 'DEPOSIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {transaction.type === 'DEPOSIT' ? 'Tabung' : 'Tarik'}
                            </Badge>
                            <Badge variant={transaction.status === 'SUCCESS' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(transaction.createdAt)}
                            </div>
                            {transaction.unit && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{transaction.unit.name}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium">{formatCurrency(transaction.totalAmount)}</span>
                            </div>
                            {transaction.totalWeight > 0 && (
                              <div className="flex items-center gap-1">
                                <Scale className="h-4 w-4" />
                                <span className="font-medium">{formatWeight(transaction.totalWeight)}</span>
                              </div>
                            )}
                          </div>
                          {transaction.items && transaction.items.length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <div className="font-medium mb-1">Detail:</div>
                              {transaction.items.map((item, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{item.wasteType.name}</span>
                                  <span>{formatWeight(item.weight)} × {formatCurrency(item.wasteType.pricePerKg)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="card" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kartu Bank Sampah Digital</CardTitle>
                <CardDescription>QR Code untuk identifikasi nasabah</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  {user.qrCode ? (
                    <div className="relative">
                      <img 
                        src={user.qrCode} 
                        alt="QR Code" 
                        className="w-48 h-48 border-4 border-green-500 rounded-lg"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2">
                        <QrCode className="h-6 w-6" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold">{user.name}</h3>
                    <p className="text-lg text-green-600 font-mono">{user.nasabah?.accountNo}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.phone && (
                      <p className="text-sm text-gray-600">{user.phone}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Saldo Aktif</p>
                      <p className="text-xl font-bold text-green-600">
                        {dashboardData ? formatCurrency(dashboardData.balance) : formatCurrency(0)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Sampah</p>
                      <p className="text-xl font-bold text-blue-600">
                        {dashboardData ? formatWeight(dashboardData.totalWeight) : formatWeight(0)}
                      </p>
                    </div>
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    <p>Tunjukkan QR Code ini kepada petugas Unit Bank Sampah</p>
                    <p>saat ingin menabung sampah</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation 
        userRole={user.role} 
        currentTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}