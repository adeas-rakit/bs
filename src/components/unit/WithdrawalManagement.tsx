'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { toast } from 'sonner'
import { Check, X, Loader2, Landmark, Calendar, CircleDollarSign, Info } from 'lucide-react'
import { InfoCard } from '@/components/ui/InfoCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface WithdrawalRequest {
  id: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string | null;
  createdAt: string
  nasabah: {
    id: string
    accountNo: string
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
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
  const [statusFilter, setStatusFilter] = useState('PENDING') // Default to PENDING
  
  const [isRejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isApproveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentRequest, setCurrentRequest] = useState<WithdrawalRequest | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/units/withdrawals?status=${statusFilter}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat permintaan penarikan');
      }
      const data = await response.json()
      setRequests(data.withdrawals || [])
    } catch (error: any) {
      toast.error("Error memuat data", { description: error.message })
      setRequests([]);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

  const processWithdrawalRequest = async (action: 'approve' | 'reject') => {
    if (!currentRequest) return;

    setActionLoading(prev => ({...prev, [currentRequest.id]: true}))
    const loadingToast = toast.loading(`Memproses permintaan...`)
    
    try {
      const token = localStorage.getItem('token')
      const url = '/api/units/withdrawals';
      
      let payload: any = { id: currentRequest.id, action };
      if (action === 'reject') {
        payload.rejectionReason = rejectionReason;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Gagal memproses permintaan");

      toast.success("Sukses", { id: loadingToast, description: resData.message })
      
      if (action === 'approve') setApproveDialogOpen(false);
      if (action === 'reject') setRejectDialogOpen(false);

      fetchRequests();

    } catch (error: any) {
      toast.error("Gagal", { id: loadingToast, description: error.message })
    } finally {
      if (currentRequest) {
        setActionLoading(prev => ({...prev, [currentRequest.id]: false}))
      }
    }
  }

  const handleOpenDialog = (request: WithdrawalRequest, type: 'approve' | 'reject') => {
    setCurrentRequest(request);
    if (type === 'approve') {
      setApproveDialogOpen(true);
    } else {
      setRejectionReason("");
      setRejectDialogOpen(true);
    }
  };

  const handleConfirmRejection = () => {
    if (rejectionReason.trim().length >= 5) {
      processWithdrawalRequest('reject');
    } else {
        toast.warning("Alasan Diperlukan", { description: "Mohon isi alasan penolakan (minimal 5 karakter)."});
    }
  };

  const handleConfirmApprove = () => {
    processWithdrawalRequest('approve');
  };

  const filteredRequests = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    const filtered = requests.filter(req => {
      const name = req.nasabah?.user?.name?.toLowerCase() || '';
      const accountNo = req.nasabah?.accountNo?.toLowerCase() || '';
      return name.includes(lowercasedSearchTerm) || accountNo.includes(lowercasedSearchTerm);
    });

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, searchTerm]);
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Kelola Penarikan Saldo</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
          <Input
            placeholder="Cari Nama/No. Rekening..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:col-span-2"
          />
          <Combobox
            options={[
              { label: "Tertunda", value: "PENDING" },
              { label: "Disetujui", value: "APPROVED" },
              { label: "Ditolak", value: "REJECTED" },
              { label: "Semua Status", value: "all" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter Status"
          />
        </div>

        {loading ? (
          <WithdrawalRequestsManagementSkeleton />
        ) : (
          <div className="space-y-4">
              {filteredRequests.length > 0 ? filteredRequests.map((req) => (
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
                                <Badge variant={statusMapping[req.status]?.variant || 'default'}>{statusMapping[req.status]?.text || req.status}</Badge>
                            </div>
                        </div>
                    }
                    expandedInfo={
                        <div className="text-sm space-y-2 pt-2">
                          <div><span className="font-semibold text-gray-500 flex items-center"><Calendar className="w-3 h-3 mr-2"/>Tgl. Permintaan</span> {formatDate(req.createdAt)}</div>
                          {req.status === 'REJECTED' && req.rejectionReason && (
                            <div className='flex items-start'><span className="font-semibold text-gray-500 flex items-center flex-shrink-0"><Info className="w-3 h-3 mr-2"/>Alasan Ditolak</span> <span className='text-red-600'>{req.rejectionReason}</span></div>
                          )}
                        </div>
                    }
                    actionButtons={
                        req.status === 'PENDING' ? (
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleOpenDialog(req, 'approve')} disabled={actionLoading[req.id]}>
                                    {actionLoading[req.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Setuju</>}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleOpenDialog(req, 'reject')} disabled={actionLoading[req.id]}>
                                    {actionLoading[req.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-2" /> Tolak</>}
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

      <Dialog open={isApproveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Permintaan Penarikan?</DialogTitle>
            <DialogDescription>
              Anda akan menyetujui penarikan untuk <strong>{currentRequest?.nasabah.user.name}</strong> sebesar <strong>{formatCurrency(currentRequest?.amount ?? 0)}</strong>. Saldo nasabah akan langsung dipotong. Aksi ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button 
              onClick={handleConfirmApprove} 
              disabled={actionLoading[currentRequest?.id || '']}
            >
              {actionLoading[currentRequest?.id || ''] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ya, Setujui'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Permintaan Penarikan</DialogTitle>
            <DialogDescription>Anda akan menolak permintaan penarikan dari <strong>{currentRequest?.nasabah.user.name}</strong>.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason" className="pb-2 block">Alasan Penolakan</Label>
            <Textarea 
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Saldo nasabah di unit ini tidak mencukupi."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleConfirmRejection} 
              disabled={actionLoading[currentRequest?.id || ''] || rejectionReason.trim().length < 5}
            >
              {actionLoading[currentRequest?.id || ''] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Konfirmasi Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
