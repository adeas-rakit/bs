'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'
import { subDays } from 'date-fns'
import useDebounce from '../../hooks/useDebounce'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import TransactionAccordion, { Transaction } from '@/components/common/TransactionAccordion'

interface ApiResponse {
  transactions: Transaction[];
  totalPages: number;
  totalTransactions: number;
}

interface DepositHistoryProps {
  newlyAddedTransactionId: string | null;
}

const DepositHistory = ({ newlyAddedTransactionId }: DepositHistoryProps) => {
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
  const [openAccordion, setOpenAccordion] = useState<string[] | undefined>();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (newlyAddedTransactionId) {
      if(pagination.page !== 1) {
        setPagination(prev => ({...prev, page: 1}));
      }
      setOpenAccordion([newlyAddedTransactionId]);
      setHighlightedId(newlyAddedTransactionId);
      const timer = setTimeout(() => {
        setHighlightedId(null);
      }, 15000); // Duration of the animation
      return () => clearTimeout(timer);
    }
  }, [newlyAddedTransactionId]);

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

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setOpenAccordion(undefined); // Close accordion when changing page
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
      <CardContent className="px-2">
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama nasabah..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOpenAccordion(undefined);
              }}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DatePicker value={startDate} onChange={(date) => { 
              setStartDate(date); 
              setOpenAccordion(undefined); 
            }} />
            <DatePicker value={endDate} onChange={(date) => { 
              setEndDate(date); 
              setOpenAccordion(undefined); 
            }} />
          </div>
        </div>

        <div className="space-y-3 min-h-98 max-h-[calc(100vh-200px)] overflow-y-auto">
            {loading ? (
                [...Array(pagination.limit)].map((_, i) => <SkeletonCard key={i} />)
            ) : transactions.length > 0 ? (
              <TransactionAccordion 
                transactions={transactions}
                openAccordion={openAccordion}
                onValueChange={setOpenAccordion}
                highlightedId={highlightedId}
              />
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
