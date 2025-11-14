'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  DollarSign,
  TrendingUp,
  Trash2 as TrashIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WasteType {
  id: string
  name: string
  pricePerKg: number
  status: string
  createdAt: string
  _count: {
    transactionItems: number
  }
}

export default function WasteTypesManagement() {
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedWasteType, setSelectedWasteType] = useState<WasteType | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    pricePerKg: 0,
    status: 'AKTIF'
  })

  const fetchWasteTypes = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/waste-types?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWasteTypes(data.wasteTypes)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data jenis sampah",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWasteTypes()
  }, [searchTerm, statusFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/waste-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Jenis sampah berhasil dibuat",
        })
        setIsCreateDialogOpen(false)
        setFormData({ name: '', pricePerKg: 0, status: 'AKTIF' })
        fetchWasteTypes()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat jenis sampah",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWasteType) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/waste-types/${selectedWasteType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Jenis sampah berhasil diperbarui",
        })
        setIsEditDialogOpen(false)
        setSelectedWasteType(null)
        setFormData({ name: '', pricePerKg: 0, status: 'AKTIF' })
        fetchWasteTypes()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui jenis sampah",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jenis sampah ini?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/waste-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Jenis sampah berhasil dihapus",
        })
        fetchWasteTypes()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus jenis sampah",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (wasteType: WasteType) => {
    setSelectedWasteType(wasteType)
    setFormData({
      name: wasteType.name,
      pricePerKg: wasteType.pricePerKg,
      status: wasteType.status
    })
    setIsEditDialogOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Manajemen Harga Sampah</h2>
          <p className="text-gray-600">Atur harga jenis sampah terkini</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jenis
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Jenis Sampah</DialogTitle>
              <DialogDescription>
                Masukkan data jenis sampah baru
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Jenis Sampah</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pricePerKg">Harga per Kg</Label>
                <Input
                  id="pricePerKg"
                  type="number"
                  value={formData.pricePerKg}
                  onChange={(e) => setFormData({ ...formData, pricePerKg: parseInt(e.target.value) })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Simpan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari jenis sampah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="AKTIF">Aktif</SelectItem>
            <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-96">
        <div className="grid gap-4">
          {wasteTypes.map((wasteType) => (
            <Card key={wasteType.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrashIcon className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">{wasteType.name}</h3>
                      <Badge variant={wasteType.status === 'AKTIF' ? 'default' : 'secondary'}>
                        {wasteType.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">{formatCurrency(wasteType.pricePerKg)}</span>
                        <span className="text-gray-500">/kg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-gray-500">{wasteType._count.transactionItems} transaksi</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(wasteType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(wasteType.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Jenis Sampah</DialogTitle>
            <DialogDescription>
              Perbarui data jenis sampah
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nama Jenis Sampah</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-pricePerKg">Harga per Kg</Label>
              <Input
                id="edit-pricePerKg"
                type="number"
                value={formData.pricePerKg}
                onChange={(e) => setFormData({ ...formData, pricePerKg: parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Perbarui
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}