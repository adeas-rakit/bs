'use client'

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Building, CircleDollarSign, Loader2 } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

interface WithdrawalRequest {
    id: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    unit?: { 
        name: string;
    };
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

  const fetchWithdrawals = useCallback(async (newPage: number, isInitial: boolean) => {
    if (isInitial) setInitialLoading(true); else setLoading(true);

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");

        const response = await fetch(`/api/withdrawals?page=${newPage}&limit=10`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) throw new Error('Failed to fetch withdrawal history');

        const data: ApiResponse = await response.json();
        
        setWithdrawals(isInitial ? data.withdrawals : prev => [...prev, ...data.withdrawals]);
        setTotalPages(data.totalPages);
        setPage(data.currentPage);

    } catch (error) {
        console.error("Error fetching withdrawals:", error);
    } finally {
        if (isInitial) setInitialLoading(false); else setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals(1, true);
  }, [fetchWithdrawals]);

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      fetchWithdrawals(page + 1, false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penarikan</CardTitle>
        <CardDescription>Daftar pengajuan penarikan dana Anda.</CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        {initialLoading ? (
            <div className="space-y-4">
                <WithdrawalItemSkeleton />
                <WithdrawalItemSkeleton />
                <WithdrawalItemSkeleton />
            </div>
        ) : withdrawals.length > 0 ? (
          <div className="space-y-4">
            {withdrawals.map((req) => {
                const statusInfo = statusMap[req.status] || { text: 'Unknown', variant: 'secondary' };
                return (
                  <Card key={req.id}>
                    <CardContent className="p-4 flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="font-semibold text-lg">{formatCurrency(req.amount)}</p>
                        <p className="text-sm text-muted-foreground flex items-center"><Calendar className="inline h-3 w-3 mr-1.5"/>{formatDate(req.createdAt)}</p>
                        {req.unit && (
                          <p className="text-sm text-muted-foreground flex items-center"><Building className="inline h-3 w-3 mr-1.5"/>{req.unit.name}</p>
                        )}
                      </div>
                      <Badge variant={statusInfo.variant} className="capitalize text-sm">
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
            title="Belum Ada Riwayat Penarikan"
            description="Anda belum pernah melakukan permintaan penarikan dana."
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
