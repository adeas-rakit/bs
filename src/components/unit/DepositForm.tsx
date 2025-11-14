'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search,
  QrCode,
  User,
  Scale,
  DollarSign,
  Camera,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import QRScanner from '@/components/common/QRScanner'

interface WasteType {
  id: string
  name: string
  pricePerKg: number
  status: string
}

interface Nasabah {
  id: string
  user: {
    name: string
    phone: string
    status: string
  }
  accountNo: string
  balance: number
  totalWeight: number
  depositCount: number
}

interface DepositFormProps {
  onSuccess: () => void
}

export default function DepositForm({ onSuccess }: DepositFormProps) {
  const [nasabah, setNasabah] = useState<Nasabah[]>([])
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([])
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null)
  const [depositItems, setDepositItems] = useState<Array<{wasteTypeId: string, weight: number}>>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false)
  const { toast } = useToast()

  const fetchNasabah = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/nasabah?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNasabah(data.nasabah.filter((n: Nasabah) => n.user.status === 'AKTIF'))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data nasabah",
        variant: "destructive",
      })
    }
  }

  const fetchWasteTypes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/waste-types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWasteTypes(data.wasteTypes.filter((wt: WasteType) => wt.status === 'AKTIF'))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data jenis sampah",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchNasabah()
    fetchWasteTypes()
  }, [searchTerm])

  const handleQRScan = async (qrData: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrData })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedNasabah(data.nasabah)
        setIsQRScannerOpen(false)
        toast({
          title: "Berhasil",
          description: `Nasabah ${data.nasabah.user.name} berhasil ditemukan`,
        })
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
        description: "Gagal memindai QR Code",
        variant: "destructive",
      })
    }
  }

  const addDepositItem = () => {
    setDepositItems([...depositItems, { wasteTypeId: '', weight: 0 }])
  }

  const updateDepositItem = (index: number, field: string, value: any) => {
    const updatedItems = [...depositItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setDepositItems(updatedItems)
  }

  const removeDepositItem = (index: number) => {
    setDepositItems(depositItems.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return depositItems.reduce((total, item) => {
      const wasteType = wasteTypes.find(wt => wt.id === item.wasteTypeId)
      if (wasteType) {
        return total + (item.weight * wasteType.pricePerKg)
      }
      return total
    }, 0)
  }

  const calculateTotalWeight = () => {
    return depositItems.reduce((total, item) => total + item.weight, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNasabah || depositItems.length === 0) {
      toast({
        title: "Error",
        description: "Pilih nasabah dan tambahkan minimal satu jenis sampah",
        variant: "destructive",
      })
      return
    }

    const validItems = depositItems.filter(item => item.wasteTypeId && item.weight > 0)
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Semua item harus memiliki jenis sampah dan berat yang valid",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nasabahId: selectedNasabah.id,
          type: 'DEPOSIT',
          items: validItems,
          notes: `Tabungan dari ${validItems.length} jenis sampah`
        })
      })
      
      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Tabungan berhasil dicatat",
        })
        setSelectedNasabah(null)
        setDepositItems([])
        onSuccess()
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
        description: "Gagal mencatat tabungan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Menabung Sampah</h2>
          <p className="text-gray-600">Catat tabungan sampah nasabah</p>
        </div>
        <Dialog open={isQRScannerOpen} onOpenChange={setIsQRScannerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Camera className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Scan QR Code Nasabah</DialogTitle>
              <DialogDescription>
                Arahkan kamera ke QR Code pada kartu nasabah
              </DialogDescription>
            </DialogHeader>
            <QRScanner onScan={handleQRScan} />
          </DialogContent>
        </Dialog>
      </div>

      {selectedNasabah && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{selectedNasabah.user.name}</h3>
                <p className="text-sm text-gray-600">{selectedNasabah.accountNo}</p>
                <p className="text-sm text-gray-600">{selectedNasabah.user.phone}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedNasabah(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedNasabah && (
        <Card>
          <CardHeader>
            <CardTitle>Pilih Nasabah</CardTitle>
            <CardDescription>Cari atau scan QR code nasabah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nasabah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {nasabah.map((nasabahItem) => (
                <div
                  key={nasabahItem.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedNasabah(nasabahItem)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{nasabahItem.user.name}</p>
                      <p className="text-sm text-gray-600">{nasabahItem.accountNo}</p>
                    </div>
                    <Badge variant="outline">{formatCurrency(nasabahItem.balance)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedNasabah && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Detail Tabungan</CardTitle>
                <CardDescription>Masukkan jenis dan berat sampah</CardDescription>
              </div>
              <Button onClick={addDepositItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {depositItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Jenis Sampah</Label>
                    <Select 
                      value={item.wasteTypeId} 
                      onValueChange={(value) => updateDepositItem(index, 'wasteTypeId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        {wasteTypes.map((wasteType) => (
                          <SelectItem key={wasteType.id} value={wasteType.id}>
                            {wasteType.name} - {formatCurrency(wasteType.pricePerKg)}/kg
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label>Berat (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.weight || ''}
                      onChange={(e) => updateDepositItem(index, 'weight', parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDepositItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {depositItems.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Berat</p>
                      <p className="font-semibold">{formatWeight(calculateTotalWeight())}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Nilai</p>
                      <p className="font-semibold text-green-600">{formatCurrency(calculateTotal())}</p>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Memproses..." : "Simpan Tabungan"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}