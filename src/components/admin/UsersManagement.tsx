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
  User,
  Mail,
  Phone,
  Building,
  CreditCard,
  Users
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  unit?: {
    name: string
  }
  nasabah?: {
    accountNo: string
    balance: number
    totalWeight: number
  }
  _count: {
    transactions: number
  }
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    status: 'AKTIF',
    unitId: ''
  })

  const [units, setUnits] = useState<any[]>([])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/units', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUnits(data.units)
      }
    } catch (error) {
      console.error('Failed to fetch units:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchUnits()
  }, [searchTerm, roleFilter, statusFilter])

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: selectedUser.id,
          ...formData
        })
      })
      
      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Pengguna berhasil diperbarui",
        })
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        setFormData({ name: '', phone: '', status: 'AKTIF', unitId: '' })
        fetchUsers()
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
        description: "Gagal memperbarui pengguna",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      phone: user.phone,
      status: user.status,
      unitId: user.unit?.name || ''
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
          <h2 className="text-xl font-semibold">Manajemen Pengguna</h2>
          <p className="text-gray-600">Kelola data pengguna sistem</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="UNIT">Unit</SelectItem>
            <SelectItem value="NASABAH">Nasabah</SelectItem>
          </SelectContent>
        </Select>
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
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">{user.name}</h3>
                      <Badge variant={user.status === 'AKTIF' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                      <Badge variant="outline">
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                    {user.unit && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        {user.unit.name}
                      </div>
                    )}
                    {user.nasabah && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          {user.nasabah.accountNo}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{formatCurrency(user.nasabah.balance)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{formatWeight(user.nasabah.totalWeight)}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{user._count.transactions}</span>
                        transaksi
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
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
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui data pengguna
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
            {selectedUser?.role === 'UNIT' && (
              <div>
                <Label htmlFor="edit-unit">Unit</Label>
                <Select value={formData.unitId} onValueChange={(value) => setFormData({ ...formData, unitId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full">
              Perbarui
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}