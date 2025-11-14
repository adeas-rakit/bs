'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  LogOut,
  Home,
  Building,
  UserCheck,
  Trash2,
  CreditCard
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import UnitsManagement from '@/components/admin/UnitsManagement'
import UsersManagement from '@/components/admin/UsersManagement'
import TransactionsMonitoring from '@/components/admin/TransactionsMonitoring'
import WasteTypesManagement from '@/components/admin/WasteTypesManagement'

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

import BottomNavigation from '@/components/common/BottomNavigation'

import { useRealtimeData } from '@/hooks/useRealtimeData'

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()
  
  const { data: dashboardData, loading, refetch } = useRealtimeData<DashboardData>('/api/dashboard', 30000)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-gray-600">Selamat datang, {user.name}</p>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Iktisar</TabsTrigger>
            <TabsTrigger value="units">Unit</TabsTrigger>
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="users">Pengguna</TabsTrigger>
            <TabsTrigger value="waste-types">Harga</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {dashboardData && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Unit</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.totalUnits}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Nasabah</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.totalNasabah}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.totalTransactions}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sampah Ditabung</CardTitle>
                      <Scale className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatWeight(dashboardData.totalWasteCollected)}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Tabungan</CardTitle>
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(dashboardData.totalDepositAmount)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Penarikan Berhasil</CardTitle>
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(dashboardData.totalWithdrawalAmount)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Saldo Aktif</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(dashboardData.totalActiveBalance)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Nasabah</CardTitle>
                      <CardDescription>Nasabah dengan tabungan terbanyak</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {dashboardData.topNasabah.map((nasabah, index) => (
                            <div key={nasabah.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline">{index + 1}</Badge>
                                <div>
                                  <p className="font-medium">{nasabah.user.name}</p>
                                  <p className="text-sm text-gray-500">{nasabah.user.phone}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatWeight(nasabah.totalWeight)}</p>
                                <p className="text-sm text-gray-500">{nasabah.depositCount}x</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Transaksi Terakhir</CardTitle>
                      <CardDescription>Aktivitas transaksi terkini</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {dashboardData.recentTransactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{transaction.transactionNo}</p>
                                <p className="text-sm text-gray-500">
                                  {transaction.nasabah.user.name} - {transaction.unit.name}
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
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="units">
            <UnitsManagement />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsMonitoring />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="waste-types">
            <WasteTypesManagement />
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