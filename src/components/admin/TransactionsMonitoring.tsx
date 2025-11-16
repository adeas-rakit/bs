'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  Building,
  User,
  Archive
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { InfoCard } from '@/components/ui/InfoCard'
import { Badge } from '@/components/ui/badge'

interface Transaction {
  id: string
  transactionNo: string
  type: 'DEPOSIT' | 'WITHDRAWAL'
  totalAmount: number
  totalWeight: number
  status: 'SUCCESS' | 'PENDING' | 'FAILED'
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

const statusMapping = {
    SUCCESS: { text: 'Success', variant: 'default' as const },
    PENDING: { text: 'Pending', variant: 'secondary' as const },
    FAILED: { text: 'Failed', variant: 'destructive' as const },
}

export default function TransactionsMonitoring() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    const fetchTransactions = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams()
            if (searchTerm) params.append('search', searchTerm)
            if (typeFilter !== 'all') params.append('type', typeFilter)
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (dateFrom) params.append('dateFrom', dateFrom)
            if (dateTo) params.append('dateTo', dateTo)
            
            const response = await fetch(`/api/transactions?${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
            if (!response.ok) throw new Error('Gagal memuat data');
            const data = await response.json()
            setTransactions(data.transactions)
        } catch (error) {
            toast({ title: "Error", description: "Gagal memuat data transaksi", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const delayDebounceFn = setTimeout(() => { fetchTransactions() }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, typeFilter, statusFilter, dateFrom, dateTo, toast])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  const formatWeight = (weight: number) => `${(weight || 0).toFixed(2)} kg`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Monitoring Transaksi</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 border rounded-lg bg-gray-50">
            <Input
                placeholder="Cari No. Transaksi/Nasabah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="col-span-2 lg:col-span-6"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Tipe" /></SelectTrigger>
                <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="WITHDRAWAL">Penarikan</SelectItem>
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="col-span-2"/>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
             <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-t-green-600 border-gray-200 rounded-full"/>
          </div>
        ) : (
            <div className="space-y-4">
              {transactions.length > 0 ? transactions.map((tx) => (
                <InfoCard
                    key={tx.id}
                    id={tx.id}
                    title={tx.transactionNo}
                    subtitle={tx.nasabah.user.name}
                    icon={tx.type === 'DEPOSIT' ? <TrendingUp className="w-6 h-6 text-green-600"/> : <TrendingDown className="w-6 h-6 text-red-600"/>}
                    initialInfo={
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold text-gray-500">Jumlah</p>
                                <p className="font-bold text-lg text-green-600">{formatCurrency(tx.totalAmount)}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-500">Status</p>
                                <Badge variant={statusMapping[tx.status].variant}>{statusMapping[tx.status].text}</Badge>
                            </div>
                        </div>
                    }
                    expandedInfo={
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><span className="font-semibold text-gray-500 flex items-center"><User className="w-3 h-3 mr-2"/>Nasabah</span> {tx.nasabah.user.name}</div>
                                <div><span className="font-semibold text-gray-500 flex items-center"><Building className="w-3 h-3 mr-2"/>Unit</span> {tx.unit?.name || '-'}</div>
                                <div><span className="font-semibold text-gray-500 flex items-center"><Calendar className="w-3 h-3 mr-2"/>Tanggal</span> {formatDate(tx.createdAt)}</div>
                                <div><span className="font-semibold text-gray-500 flex items-center"><User className="w-3 h-3 mr-2"/>Petugas</span> {tx.user.name}</div>
                                {tx.type === 'DEPOSIT' && <div><span className="font-semibold text-gray-500 flex items-center"><Scale className="w-3 h-3 mr-2"/>Total Berat</span> {formatWeight(tx.totalWeight)}</div>}
                            </div>
                            {tx.type === 'DEPOSIT' && tx.items.length > 0 && (
                                <div className="pt-2">
                                    <h4 className="font-semibold mb-2 flex items-center"><Archive className="w-4 h-4 mr-2"/>Rincian Sampah</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 border-l-2 pl-2 ml-1">
                                        {tx.items.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                                <div>
                                                    <p className="font-medium">{item.wasteType.name}</p>
                                                    <p className="text-xs text-gray-500">{formatWeight(item.weight)} @ {formatCurrency(item.wasteType.pricePerKg)}</p>
                                                </div>
                                                <p className="font-semibold text-green-600">{formatCurrency(item.amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                />
              )) : (
                <div className="text-center py-16 text-gray-500">
                  <p>Tidak ada transaksi yang cocok dengan filter Anda.</p>
                </div>
              )}
            </div>
        )}
    </div>
  )
}
