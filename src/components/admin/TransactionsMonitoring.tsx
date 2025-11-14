'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  Building,
  User
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Transaction {
  id: string
  transactionNo: string
  type: string
  totalAmount: number
  totalWeight: number
  status: string
  createdAt: string
  nasabah: {
    user: {
      name: string
      phone: string
    }
  }
  unit?: {
    name: string
  }
  user: {
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

export default function TransactionsMonitoring() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { toast } = useToast()

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [searchTerm, typeFilter, statusFilter, dateFrom, dateTo])

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Monitoring Transaksi</h2>
          <p className="text-gray-600">Pantau semua transaksi bank sampah</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari transaksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="DEPOSIT">Tabung</SelectItem>
            <SelectItem value="WITHDRAWAL">Tarik</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="SUCCESS">Berhasil</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Gagal</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          placeholder="Dari tanggal"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          type="date"
          placeholder="Sampai tanggal"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
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
                        {transaction.type === 'DEPOSIT' ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Tabung
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Tarik
                          </>
                        )}
                      </Badge>
                      <Badge variant={transaction.status === 'SUCCESS' ? 'default' : transaction.status === 'PENDING' ? 'secondary' : 'destructive'}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {transaction.nasabah.user.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                    {transaction.unit && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        {transaction.unit.name} - {transaction.user.name}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">{formatCurrency(transaction.totalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Scale className="h-4 w-4" />
                        <span className="font-medium">{formatWeight(transaction.totalWeight)}</span>
                      </div>
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
    </div>
  )
}