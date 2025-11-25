'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { Calendar, Building, CircleDollarSign, Loader2, Info, Search } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import useDebounce from '@/hooks/useDebounce';

interface WithdrawalRequest {
    id: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    unit?: { 
        name: string;
    };
    rejectionReason?: string;
}

interface ApiResponse {
    withdrawals: WithdrawalRequest[];
    totalPages: number;
    currentPage: number;
}

const statusMap: { [key in WithdrawalRequest['status']]: { text: string; variant: 'secondary' | 'default' | 'destructive' } } = {
    PENDING: { text: 'Pending', variant: 'secondary' },
    APPROVED: { text: 'Berhasil', variant: 'default' },
    REJECTED: { text: 'Ditolak', variant: 'destructive' },
};

const statusOptions = [
    { value: "ALL", label: "Semua Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Berhasil" },
    { value: "REJECTED", label: "Ditolak" }
];

const WithdrawalItemSkeleton = () => (
    <Card>
        <CardContent className="p-4 flex items-start justify-between">
            <div className="space-y-2">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
        </CardContent>
    </Card>
);

export default function WithdrawalHistory() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false); 
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchWithdrawals = useCallback(async (newPage: number, isInitialLoad: boolean, search: string, status: string) => {
    if (isInitialLoad) setInitialLoading(true); else setLoading(true);

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");

        const params = new URLSearchParams({
            page: newPage.toString(),
            limit: '10',
            ...(search && { search }),
            ...(status && { status }),
        });

        const response = await fetch(`/api/withdrawals?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) throw new Error('Failed to fetch withdrawal history');

        const data: ApiResponse = await response.json();
        
        setWithdrawals(newPage === 1 ? data.withdrawals : prev => [...prev, ...data.withdrawals]);
        setTotalPages(data.totalPages);
        setPage(data.currentPage);

    } catch (error) {
        console.error("Error fetching withdrawals:", error);
    } finally {
        if (isInitialLoad) setInitialLoading(false); else setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals(1, true, debouncedSearchTerm, filterStatus);
  }, [debouncedSearchTerm, filterStatus, fetchWithdrawals]);

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      fetchWithdrawals(page + 1, false, debouncedSearchTerm, filterStatus);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penarikan</CardTitle>
        <CardDescription>Daftar pengajuan penarikan dana Anda.</CardDescription>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari berdasarkan jumlah..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:w-full"
                />
            </div>
            <Combobox
                options={statusOptions}
                value={filterStatus || 'ALL'}
                onChange={(value) => setFilterStatus(value === 'ALL' ? '' : value)}
                placeholder="Filter status"
                searchPlaceholder="Cari status..."
                emptyPlaceholder="Status tidak ditemukan."
                className="w-full sm:w-[180px]"
            />
        </div>
      </CardHeader>
      <CardContent className="px-6">
        {initialLoading ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <WithdrawalItemSkeleton key={i} />)}
            </div>
        ) : withdrawals.length > 0 ? (
          <div className="space-y-4">
            {withdrawals.map((req) => {
                const statusInfo = statusMap[req.status] || { text: 'Unknown', variant: 'secondary' };
                return (
                  <Card key={req.id}>
                    <CardContent className="p-4 flex items-start justify-between">
                      <div className="space-y-2 flex-grow">
                        <p className="font-semibold text-lg">{formatCurrency(req.amount)}</p>
                        <p className="text-sm text-muted-foreground flex items-center"><Calendar className="inline h-3 w-3 mr-1.5"/>{formatDate(req.createdAt)}</p>
                        {req.unit && (
                          <p className="text-sm text-muted-foreground flex items-center"><Building className="inline h-3 w-3 mr-1.5"/>{req.unit.name}</p>
                        )}
                        {req.status === 'REJECTED' && req.rejectionReason && (
                             <p className="text-xs text-red-500 flex items-center mt-2 p-2 bg-red-50 rounded-md">
                                <Info className="inline h-3 w-3 mr-1.5 flex-shrink-0"/>
                                <span className='break-words'>Alasan: {req.rejectionReason}</span>
                            </p>
                        )}
                      </div>
                      <Badge variant={statusInfo.variant} className="capitalize text-sm ml-4 whitespace-nowrap">
                        {statusInfo.text}
                      </Badge>
                    </CardContent>
                  </Card>
                )
            })}
          </div>
        ) : (
          <EmptyState
            icon={<CircleDollarSign />}
            title="Tidak Ada Hasil Ditemukan"
            description="Coba ubah kata kunci pencarian atau filter status Anda."
          />
        )}

        <div className="mt-6 flex justify-center">
            {page < totalPages && (
                <Button onClick={handleLoadMore} variant="outline" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
                </Button>
            )}
            {!initialLoading && page >= totalPages && withdrawals.length > 10 && (
                <p className="text-sm text-gray-400">Anda telah mencapai akhir daftar.</p>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
