'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAlert } from '@/hooks/use-alert'
import { Check, X, Loader2, Landmark, Calendar, CircleDollarSign } from 'lucide-react'
import { InfoCard } from '@/components/ui/InfoCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

export default function WithdrawalRequestsManagement() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { toast } = useToast()
  const { showAlert } = useAlert();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/withdrawals', { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error('Gagal memuat permintaan penarikan');
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat data", variant: "destructive" })
      setRequests([]);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

  const processWithdrawalRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(prev => ({...prev, [requestId]: true}))
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: requestId, action }),
      })
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Gagal memproses permintaan");
      toast({ title: "Sukses", description: resData.message })
      fetchRequests()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setActionLoading(prev => ({...prev, [requestId]: false}))
    }
  }

  const handleActionConfirmation = (req: WithdrawalRequest, action: 'APPROVE' | 'REJECT') => {
    const actionText = action === 'APPROVE' ? 'menyetujui' : 'menolak';
    const title = action === 'APPROVE' ? 'Setujui Penarikan?' : 'Tolak Penarikan?';
    const confirmButtonText = action === 'APPROVE' ? 'Ya, Setujui' : 'Ya, Tolak';

    if (action === 'APPROVE' && req.nasabah.balance < req.amount) {
        toast({
            title: "Saldo Tidak Cukup",
            description: "Saldo nasabah tidak mencukupi untuk melakukan penarikan ini.",
            variant: "destructive",
        });
        return;
    }

    const message = action === 'APPROVE'
      ? `Anda akan menyetujui penarikan sebesar ${formatCurrency(req.amount)} untuk ${req.nasabah.user.name}. Aksi ini tidak dapat dibatalkan.`
      : `Anda akan menolak permintaan penarikan ini. Aksi ini tidak dapat dibatalkan.`;

    showAlert({
        type: 'warning',
        title: title,
        message: message,
        onConfirm: () => processWithdrawalRequest(req.id, action),
        confirmText: confirmButtonText,
        cancelText: 'Batal',
        onCancel: () => {}
    });
  }

  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
        (req.nasabah?.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) || req.nasabah?.accountNo.includes(searchTerm)) &&
        (statusFilter === 'all' || req.status === statusFilter)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, searchTerm, statusFilter])
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Permintaan Penarikan</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
          <Input
            placeholder="Cari Nama/No. Rekening..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:col-span-2"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Filter Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PENDING">Tertunda</SelectItem>
              <SelectItem value="APPROVED">Disetujui</SelectItem>
              <SelectItem value="REJECTED">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-green-600" /></div>
        ) : (
          <div className="space-y-4">
              {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                <InfoCard
                    key={req.id}
                    id={req.id}
                    title={req.nasabah?.user?.name || 'Nama Tidak Tersedia'}
                    subtitle={`No. Rek: ${req.nasabah?.accountNo || 'N/A'}`}
                    icon={<Landmark className="w-6 h-6 text-gray-600"/>}
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
                <div className="text-center py-16 text-gray-500">
                    <p>Tidak ada permintaan penarikan yang cocok.</p>
                </div>
              )}
            </div>
        )}
    </div>
  )
}
