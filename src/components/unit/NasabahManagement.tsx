'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Search,
  User,
  Phone,
  CreditCard,
  Edit,
  Users
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
}

interface NasabahManagementProps {
  onUpdate: () => void
}

export default function NasabahManagement({ onUpdate }: NasabahManagementProps) {
  const [nasabah, setNasabah] = useState<Nasabah[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null)
  const { toast } = useToast()

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
      
      const response = await fetch(`/api/nasabah?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNasabah(data.nasabah)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data nasabah",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNasabah()
  }, [searchTerm, statusFilter])

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNasabah) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/nasabah', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: selectedNasabah.id,
          ...formData
        })
      })
      
      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Nasabah berhasil diperbarui",
        })
        setIsEditDialogOpen(false)
        setSelectedNasabah(null)
        setFormData({ name: '', phone: '', status: 'AKTIF' })
        fetchNasabah()
        onUpdate()
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
        description: "Gagal memperbarui nasabah",
        variant: "destructive",
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
      currency: 'IDR'
    }).format(amount)
  }

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)} kg`
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
          <h2 className="text-xl font-semibold">Manajemen Nasabah</h2>
          <p className="text-gray-600">Kelola data nasabah unit</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nasabah..."
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
            <SelectItem value="DITANGGUHKAN">Ditangguhkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-96">
        <div className="grid gap-4">
          {nasabah.map((nasabahItem) => (
            <Card key={nasabahItem.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">{nasabahItem.user.name}</h3>
                      <Badge variant={nasabahItem.user.status === 'AKTIF' ? 'default' : 'secondary'}>
                        {nasabahItem.user.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
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
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{formatCurrency(nasabahItem.balance)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{formatWeight(nasabahItem.totalWeight)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">{nasabahItem.depositCount}x menabung</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(nasabahItem)}
                    >
                      <Edit className="h-4 w-4" />
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
            <DialogTitle>Edit Nasabah</DialogTitle>
            <DialogDescription>
              Perbarui data nasabah
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
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="DITANGGUHKAN">Ditangguhkan</SelectItem>
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