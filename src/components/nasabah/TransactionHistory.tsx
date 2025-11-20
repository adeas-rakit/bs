'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { toast } from 'sonner'
import { subDays } from 'date-fns'
import { DatePicker } from '@/components/ui/date-picker'
import useDebounce from '@/hooks/useDebounce'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Combobox } from '@/components/ui/combobox'
import TransactionAccordion, { Transaction } from '@/components/common/TransactionAccordion'

interface ApiResponse {
  transactions: Transaction[];
  totalPages: number;
  totalTransactions: number;
}

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    totalPages: 1,
    totalTransactions: 0,
  })

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
      if (dateTo) params.append('dateTo', dateTo.toISOString());
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Gagal memuat riwayat transaksi')

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
  }, [pagination.page, pagination.limit, debouncedSearchTerm, dateFrom, dateTo, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const SkeletonCard = () => (
    <div className="border rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/4" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Transaksi</CardTitle>
        <CardDescription>Lihat semua transaksi yang pernah Anda lakukan.</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
          <Input
              placeholder="Cari No. Transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-2"
          />
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Dari tanggal" />
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="Sampai tanggal" />
          <Combobox 
            options={[
                { label: "Semua Tipe", value: "all" },
                { label: "Deposit", value: "DEPOSIT" },
                { label: "Penarikan", value: "WITHDRAWAL" },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder='Pilih Tipe'
            className="md:col-span-4"
          />
        </div>

        <div className="space-y-3 min-h-[450px]">
          {loading ? (
            [...Array(pagination.limit)].map((_, i) => <SkeletonCard key={i} />)
          ) : transactions.length > 0 ? (
            <TransactionAccordion transactions={transactions} />
          ) : (
            <div className="h-96 flex items-center justify-center">
              <EmptyState
                icon={<History className="h-12 w-12 text-gray-400"/>}
                title="Tidak Ada Data"
                description="Tidak ada riwayat transaksi yang cocok dengan filter atau pencarian Anda."
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

export default TransactionHistory;
