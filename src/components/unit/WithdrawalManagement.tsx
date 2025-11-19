'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Check, 
  X, 
  User, 
  Calendar, 
  DollarSign, 
  CircleDollarSign,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

interface WithdrawalRequest {
  id: string
  nasabah: {
    id: string
    user: {
      name: string
    }
    accountNo: string
  }
  amount: number
  status: string
  createdAt: string
}

interface WithdrawalManagementProps {
  onUpdate: () => void
}

const WithdrawalManagementSkeleton = () => (
    <div className="space-y-4">
        <div>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-4 pr-4">
            {[...Array(2)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4 flex justify-between items-center">
                        <div className="space-y-2 w-full">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5 rounded-full" />
                                <Skeleton className="h-6 w-1/2" />
                            </div>
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);

export default function WithdrawalManagement({ onUpdate }: WithdrawalManagementProps) {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/units/withdrawals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRequests(data.withdrawals)
      } else {
        const data = await response.json()
        toast.error("Error", { description: data.error || "Gagal memuat permintaan." })
      }
    } catch (error) {
      toast.error("Error", { description: "Terjadi kesalahan saat memuat data." })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return

    setIsConfirming(true)
    const loadingToast = toast.loading("Memproses permintaan...")
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/withdrawals/${selectedRequest.id}/${actionType}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success("Berhasil", { id: loadingToast, description: data.message })
        fetchRequests()
        onUpdate() // This will trigger a refresh on the parent component if needed
      } else {
        toast.error("Gagal", { id: loadingToast, description: data.error })
      }
    } catch (error) {
      toast.error("Error", { id: loadingToast, description: "Terjadi kesalahan di sisi klien." })
    } finally {
      setIsConfirming(false)
      setSelectedRequest(null)
      setActionType(null)
    }
  }

  const openConfirmDialog = (request: WithdrawalRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setActionType(type)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) {
    return <WithdrawalManagementSkeleton />
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Permintaan Penarikan Saldo</h2>
        <p className="text-gray-500">Setujui atau tolak permintaan penarikan dari nasabah yang pernah menabung di unit Anda.</p>
      </div>
      <ScrollArea className="h-[60vh]">
        <div className="space-y-4 pr-4">
          {requests.length > 0 ? requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div className="space-y-1">
                    <span className="font-semibold flex items-center gap-2"><User className="h-5 w-5 text-green-600"/>{request.nasabah.user.name}</span>
                    <p className="text-sm text-gray-500">No. Rek: {request.nasabah.accountNo}</p>
                    <div className="text-sm  text-foreground font-bold flex items-center gap-2">
                        <DollarSign className="h-4 w-4"/>
                        <span>{formatCurrency(request.amount)}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4"/>
                        <span>Dibuat pada {formatDate(request.createdAt)}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => openConfirmDialog(request, 'approve')}><Check className="h-4 w-4 mr-2"/>Setujui</Button>
                  <Button size="sm" variant="destructive" onClick={() => openConfirmDialog(request, 'reject')}><X className="h-4 w-4 mr-2"/>Tolak</Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <EmptyState 
              icon={<CircleDollarSign />}
              title="Tidak Ada Permintaan Penarikan"
              description="Saat ini tidak ada permintaan penarikan yang menunggu persetujuan."
            />
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Tindakan</DialogTitle>
            <DialogDescription>
              Anda yakin ingin <strong>{actionType === 'approve' ? 'menyetujui' : 'menolak'}</strong> permintaan penarikan sebesar <strong>{selectedRequest && formatCurrency(selectedRequest.amount)}</strong> untuk <strong>{selectedRequest && selectedRequest.nasabah.user.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Batal</Button>
            <Button 
              onClick={handleAction} 
              disabled={isConfirming}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isConfirming ? 'Memproses...' : (actionType === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
