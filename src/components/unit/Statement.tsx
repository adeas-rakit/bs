'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Calendar, User, Weight } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { addDays } from 'date-fns'
import { DatePicker } from '@/components/ui/date-picker'
import useDebounce from '@/hooks/useDebounce'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Combobox } from '@/components/ui/combobox'

interface TransactionItem {
  id: string;
  wasteType: {
    name: string;
  };
  weight: number;
  amount: number;
}

interface Transaction {
  id: string;
  nasabah: {
    id: string;
    user: { name: string };
  };
  user: { name: string };
  totalAmount: number;
  totalWeight: number;
  createdAt: string;
  items: TransactionItem[];
  type: 'DEPOSIT' | 'WITHDRAWAL';
}

interface NasabahData {
  id: string;
  user: {
    name: string;
  };
}

interface NasabahOption {
  value: string;
  label: string;
}

interface ApiResponse {
  transactions: Transaction[];
  totalPages: number;
  totalTransactions: number;
}

const Statement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [nasabahList, setNasabahList] = useState<NasabahData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(addDays(new Date(), -30));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [selectedNasabah, setSelectedNasabah] = useState<string>()

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalTransactions: 0,
  })

  const fetchNasabah = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/nasabah', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Gagal mengambil data nasabah');
      }
      const data = await response.json();
      setNasabahList(data.nasabah);
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    }
  };

  const fetchTransactions = async () => {
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
      if (selectedNasabah && selectedNasabah !== 'all') {
        params.append('nasabahId', selectedNasabah);
      }

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Gagal memuat laporan transaksi')

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
  }

  useEffect(() => {
    fetchNasabah();
  }, [])

  useEffect(() => {
    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, debouncedSearchTerm, dateFrom, dateTo, selectedNasabah])

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const nasabahOptions: NasabahOption[] = useMemo(() => [
    { value: 'all', label: 'Semua Nasabah' },
    ...nasabahList.map(n => ({ value: n.id, label: n.user.name }))
  ], [nasabahList]);

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
        <CardTitle>Laporan Transaksi</CardTitle>
        <CardDescription>Lihat semua transaksi yang pernah dilakukan.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama nasabah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Dari tanggal" />
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="Sampai tanggal" />
          <Combobox 
            options={nasabahOptions}
            value={selectedNasabah}
            onChange={setSelectedNasabah}
            placeholder='Pilih Nasabah'
            searchPlaceholder='Cari nasabah...'
            emptyPlaceholder='Nasabah tidak ditemukan'
            className="col-span-1 md:col-span-4"
          />
        </div>

        <div className="space-y-3">
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
                          <div className={`flex items-center gap-2 font-semibold ${trx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}> 
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

export default Statement
