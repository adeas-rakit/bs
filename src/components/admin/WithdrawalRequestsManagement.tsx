'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { toast } from 'sonner'
import { Check, X, Loader2, Landmark, Calendar, CircleDollarSign } from 'lucide-react'
import { InfoCard } from '@/components/ui/InfoCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import useDebounce from '@/hooks/useDebounce'

interface WithdrawalRequest {
  id: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  nasabah: {
    id: string
    accountNo: string
    balance: number
    user: {
      name: string
    }
  }
}

const statusMapping = {
    PENDING: { text: 'Tertunda', variant: 'secondary' as const },
    APPROVED: { text: 'Disetujui', variant: 'default' as const },
    REJECTED: { text: 'Ditolak', variant: 'destructive' as const },
}

const WithdrawalRequestsManagementSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg shadow-sm bg-white">
                <div className="flex items-start mb-4">
                    <Skeleton className="w-10 h-10 mr-4 rounded-lg" />
                    <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <Skeleton className="h-4 w-12 mb-2" />
                        <Skeleton className="h-7 w-28" />
                    </div>
                    <div>
                        <Skeleton className="h-4 w-12 mb-2" />
                        <Skeleton className="h-7 w-20" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>
            </div>
        ))}
    </div>
);

export default function WithdrawalRequestsManagement() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/admin/withdrawals?${params.toString()}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      if (!response.ok) throw new Error('Gagal memuat permintaan penarikan');
      const data = await response.json();
      setRequests(data.withdrawals || []);
    } catch (error) {
      toast.error("Error", { description: "Gagal memuat data" })
      setRequests([]);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchRequests() 
  }, [debouncedSearchTerm, statusFilter])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

  const processWithdrawalRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(prev => ({...prev, [requestId]: true}))
    const loadingToast = toast.loading(`Memproses permintaan...`)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: requestId, action }),
      })
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Gagal memproses permintaan");
      toast.success("Sukses", { id: loadingToast, description: resData.message })
      fetchRequests()
    } catch (error: any) {
      toast.error("Error", { id: loadingToast, description: error.message })
    } finally {
      setActionLoading(prev => ({...prev, [requestId]: false}))
    }
  }

  const handleActionConfirmation = (req: WithdrawalRequest, action: 'APPROVE' | 'REJECT') => {
    const actionText = action === 'APPROVE' ? 'menyetujui' : 'menolak';
    const title = action === 'APPROVE' ? 'Setujui Penarikan?' : 'Tolak Penarikan?';
    const confirmButtonText = action === 'APPROVE' ? 'Ya, Setujui' : 'Ya, Tolak';

    if (action === 'APPROVE' && req.nasabah.balance < req.amount) {
        toast.error("Saldo Tidak Cukup", {
            description: "Saldo nasabah tidak mencukupi untuk melakukan penarikan ini.",
        });
        return;
    }

    const message = action === 'APPROVE'
      ? `Anda akan menyetujui penarikan sebesar ${formatCurrency(req.amount)} untuk ${req.nasabah.user.name}. Aksi ini tidak dapat dibatalkan.`
      : `Anda akan menolak permintaan penarikan ini. Aksi ini tidak dapat dibatalkan.`;

    toast.warning(title, {
        description: message,
        action: {
            label: confirmButtonText,
            onClick: () => processWithdrawalRequest(req.id, action),
        },
        cancel: {
            label: 'Batal',
            onClick: () => {}
        }
    });
  }
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
        <h1 className="text-2xl font-bold  text-foreground">Permintaan Penarikan</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
          <Input
            placeholder="Cari Nama/No. Rekening..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:col-span-2"
          />
          <Combobox
            options={[
              { label: "Semua Status", value: "all" },
              { label: "Tertunda", value: "PENDING" },
              { label: "Disetujui", value: "APPROVED" },
              { label: "Ditolak", value: "REJECTED" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter Status"
            searchPlaceholder="Cari status..."
            emptyPlaceholder="Status tidak ditemukan."
          />
        </div>

        {loading ? (
          <WithdrawalRequestsManagementSkeleton />
        ) : (
          <div className="space-y-4">
              {requests.length > 0 ? requests.map((req) => (
                <InfoCard
                    key={req.id}
                    id={req.id}
                    title={req.nasabah?.user?.name || 'Nama Tidak Tersedia'}
                    subtitle={`No. Rek: ${req.nasabah?.accountNo || 'N/A'}`}
                    icon={<Landmark className="w-6 h-6 text-gray-500"/>}
                    initialInfo={
                        <div className="grid grid-cols-2 gap-4 text-sm">
                             <div>
                                <p className="font-semibold text-gray-500">Jumlah</p>
                                <p className="font-bold text-lg text-green-600">{formatCurrency(req.amount)}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-500">Status</p>
                                <Badge variant={statusMapping[req.status].variant}>{statusMapping[req.status].text}</Badge>
                            </div>
                        </div>
                    }
                    expandedInfo={
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="font-semibold text-gray-500 flex items-center"><CircleDollarSign className="w-3 h-3 mr-2"/>Saldo Saat Ini</span> {formatCurrency(req.nasabah.balance)}</div>
                            <div><span className="font-semibold text-gray-500 flex items-center"><Calendar className="w-3 h-3 mr-2"/>Tgl. Permintaan</span> {formatDate(req.createdAt)}</div>
                        </div>
                    }
                    actionButtons={
                        req.status === 'PENDING' ? (
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleActionConfirmation(req, 'APPROVE')} disabled={actionLoading[req.id]}>
                                    {actionLoading[req.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Setuju
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleActionConfirmation(req, 'REJECT')} disabled={actionLoading[req.id]}>
                                    {actionLoading[req.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-2" />} Tolak
                                </Button>
                            </div>
                        ) : null
                    }
                />
              )) : (
                <EmptyState
                  icon={<CircleDollarSign />}
                  title="Tidak Ada Permintaan Penarikan"
                  description="Saat ini tidak ada permintaan penarikan yang cocok dengan filter Anda."
                />
              )}
            </div>
        )}
    </div>
  )
}
