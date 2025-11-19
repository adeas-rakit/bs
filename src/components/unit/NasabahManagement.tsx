'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Search,
  User,
  Phone,
  CreditCard,
  Edit,
  Building,
  Home
} from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Combobox } from '@/components/ui/combobox'
import { EmptyState } from '@/components/ui/empty-state'

interface Nasabah {
  id: string
  user: {
    id: string
    name: string
    email: string
    phone: string
    status: string
  }
  accountNo: string
  balance: number
  totalWeight: number
  depositCount: number
  unit: {
    id: string;
    name: string;
  } | null;
}

interface NasabahManagementProps {
  onUpdate: () => void
}

const NasabahManagementSkeleton = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
                 <Skeleton className="h-10 w-full" />
            </div>
            <div className="md:col-span-1">
                 <Skeleton className="h-10 w-full" />
            </div>
        </div>
        <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 w-full">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5 rounded-full" />
                                    <Skeleton className="h-6 w-3/5" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-28" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-9 w-9" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);

export default function NasabahManagement({ onUpdate }: NasabahManagementProps) {
  const [nasabah, setNasabah] = useState<Nasabah[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    status: 'AKTIF'
  })

  const fetchNasabah = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/nasabah?${params}` , {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNasabah(data.nasabah)
      } else {
        throw new Error("Gagal memuat data nasabah")
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
        fetchNasabah()
        setLoading(true);
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [searchTerm, statusFilter])

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNasabah) return
    
    const loadingToast = toast.loading("Memperbarui nasabah...")
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/nasabah', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: selectedNasabah.user.id,
          ...formData
        })
      })
      
      const data = await response.json()
      if (response.ok) {
        toast.success("Berhasil", {
          id: loadingToast,
          description: "Nasabah berhasil diperbarui",
        })
        setIsEditDialogOpen(false)
        setSelectedNasabah(null)
        setFormData({ name: '', phone: '', status: 'AKTIF' })
        fetchNasabah()
        onUpdate()
      } else {
        throw new Error(data.message || "Gagal memperbarui nasabah")
      }
    } catch (error: any) {
      toast.error("Error", {
        id: loadingToast,
        description: error.message,
      })
    }
  }

  const openEditDialog = (nasabahItem: Nasabah) => {
    setSelectedNasabah(nasabahItem)
    setFormData({
      name: nasabahItem.user.name,
      phone: nasabahItem.user.phone,
      status: nasabahItem.user.status
    })
    setIsEditDialogOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatWeight = (weight: number) => {
    return `${(weight || 0).toFixed(2)} kg`
  }

  if (loading) {
    return <NasabahManagementSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Manajemen Nasabah</h2>
          <p className="text-sm text-gray-500">Kelola data nasabah yang terdaftar atau pernah bertransaksi di unit Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama, no. rekening, atau no. telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
        </div>
        <div className="md:col-span-1">
            <Combobox
              options={[
                { label: "Semua Status", value: "all" },
                { label: "Aktif", value: "AKTIF" },
                { label: "Ditangguhkan", value: "DITANGGUHKAN" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter Status"
              searchPlaceholder="Cari status..."
              emptyPlaceholder="Status tidak ditemukan."
              className="w-full"
            />
        </div>
      </div>

      <ScrollArea className="h-full pb-10">
        <div className="grid gap-4">
          {nasabah.length > 0 ? nasabah.map((nasabahItem) => (
            <Card key={nasabahItem.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">{nasabahItem.user.name}</h3>
                      <Badge variant={nasabahItem.user.status === 'AKTIF' ? 'success' : 'destructive'}>
                        {nasabahItem.user.status === 'AKTIF' ? 'Aktif' : 'Ditangguhkan'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        {nasabahItem.accountNo}
                      </div>
                      {nasabahItem.user.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {nasabahItem.user.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        {nasabahItem.unit ? nasabahItem.unit.name : 'Belum Terikat'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 font-medium">
                        {formatCurrency(nasabahItem.balance)}
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        {formatWeight(nasabahItem.totalWeight)}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        ({nasabahItem.depositCount}x menabung)
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(nasabahItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <EmptyState 
              icon={<User />} 
              title="Tidak Ada Nasabah Ditemukan" 
              description="Tidak ada nasabah yang cocok dengan filter atau pencarian Anda. Coba lagi."
            />
          )}
        </div>
      </ScrollArea>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nasabah</DialogTitle>
            <DialogDescription>
              Perbarui data nasabah. ID Pengguna: {selectedNasabah?.user.id}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nama</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">No. Telepon</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Combobox
                options={[
                  { label: "Aktif", value: "AKTIF" },
                  { label: "Ditangguhkan", value: "DITANGGUHKAN" },
                ]}
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value })}
                placeholder="Pilih status"
                searchPlaceholder="Cari status..."
                emptyPlaceholder="Status tidak ditemukan."
              />
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">
                    Simpan Perubahan
                </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
