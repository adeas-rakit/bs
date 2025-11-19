'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Calendar, User, Weight } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { subDays } from 'date-fns'
import useDebounce from '../../hooks/useDebounce'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useUnitDashboard } from '@/context/UnitDashboardContext'

interface Transaction {
  id: string;
  nasabah: {
    user: {
      name: string;
    };
  };
  user: {
    name: string;
  };
  totalAmount: number;
  totalWeight: number;
  createdAt: string;
  items: {
    id: string;
    wasteType: {
      name: string;
    };
    weight: number;
    amount: number;
  }[];
}

interface ApiResponse {
  transactions: Transaction[];
  totalPages: number;
  totalTransactions: number;
}

const DepositHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    totalPages: 1,
    totalTransactions: 0,
  })
  const { refreshHistory, setRefreshHistory } = useUnitDashboard();

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        type: 'DEPOSIT',
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (startDate) params.append('dateFrom', startDate.toISOString());
      if (endDate) params.append('dateTo', endDate.toISOString());

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Gagal memuat riwayat tabungan')

      const data: ApiResponse = await response.json()
      setTransactions(data.transactions)
      setPagination(prev => ({ 
        ...prev, 
        totalPages: data.totalPages, 
        totalTransactions: data.totalTransactions 
      }))
    } catch (error: any) {
      toast.error('Error', { description: error.message })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, startDate, endDate]);

  // Effect for filter-based fetching
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Effect for refresh signal
  useEffect(() => {
    if (refreshHistory) {
      fetchTransactions();
      setRefreshHistory(false); // Reset the flag
    }
  }, [refreshHistory, setRefreshHistory, fetchTransactions]);


  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const SkeletonCard = () => (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
         <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penabungan</CardTitle>
        <CardDescription>Lihat semua transaksi tabungan yang pernah dilakukan.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DatePicker value={startDate} onChange={setStartDate} />
            <DatePicker value={endDate} onChange={setEndDate} />
          </div>
        </div>

        <div className="space-y-3 min-h-98 max-h-[calc(100vh-200px)] overflow-y-auto">
            {loading ? (
                [...Array(pagination.limit)].map((_, i) => <SkeletonCard key={i} />)
            ) : transactions.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-2">
                {transactions.map((trx) => (
                <AccordionItem value={trx.id} key={trx.id} className="border rounded-lg">
                    <AccordionTrigger className="p-3 text-sm hover:bg-gray-50 transition-colors rounded-lg">
                    <div className="w-full">
                        <div className="flex justify-between items-start">
                        <div className="font-medium flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>{trx.nasabah.user.name}</span>
                        </div>
                        <div className="text-gray-600 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{new Date(trx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center text-gray-600 pl-6">
                            <div className="flex items-center gap-2">
                                <Weight className="h-4 w-4 text-gray-500" />
                                <span>{formatWeight(trx.totalWeight)}</span>
                            </div>
                            <div className="flex items-center gap-2 font-semibold text-green-600">
                                <span>{formatCurrency(trx.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t bg-gray-50 rounded-b-lg">
                        <div className="space-y-3">
                        <h4 className="font-semibold">Detail Sampah:</h4>
                        <ul className="space-y-2">
                            {trx.items.map(item => (
                            <li key={item.id} className="flex justify-between items-center text-sm">
                                <div>
                                    <span className="font-medium">{item.wasteType.name}</span>
                                    <span className="text-gray-500 ml-2">({formatWeight(item.weight)})</span>
                                </div>
                                <span className="font-medium text-gray-800">{formatCurrency(item.amount)}</span>
                            </li>
                            ))}
                        </ul>
                        <div className="border-t pt-3 mt-3">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-gray-500"/>
                                <span className="text-gray-600">Dicatat oleh:</span>
                                <span className="font-medium">{trx.user.name}</span>
                            </div>
                        </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
            ) : (
                <div className="h-48">
                <EmptyState
                    icon={<Search className="h-12 w-12 text-gray-400"/>}
                    title="Tidak Ada Data"
                    description="Tidak ada riwayat tabungan yang cocok dengan filter atau pencarian Anda."
                />
                </div>
            )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 text-sm text-gray-500">
            <div>
                Menampilkan {transactions.length} dari {pagination.totalTransactions} data
            </div>
            <div className="flex items-center gap-4">
                <span>Halaman {pagination.page} dari {pagination.totalPages}</span>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                    >
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                    >
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DepositHistory
