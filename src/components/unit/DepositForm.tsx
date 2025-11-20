'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Combobox } from '@/components/ui/combobox'
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
import { toast } from 'sonner'
import QRScanner from '@/components/common/QRScanner'
import { Skeleton } from '@/components/ui/skeleton'

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
  unitId: string | null
}

interface DepositFormProps {
  onSuccess: (transactionId: string) => void
}

const NasabahSelectionSkeleton = () => (
    <Card>
      <CardHeader>
        <CardTitle>Pilih Nasabah</CardTitle>
        <CardDescription>Cari atau scan QR code nasabah</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 border rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

export default function DepositForm({ onSuccess }: DepositFormProps) {
  const [nasabah, setNasabah] = useState<Nasabah[]>([])
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([])
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null)
  const [depositItems, setDepositItems] = useState<Array<{wasteTypeId: string, weight: number}>>([])
  const [loading, setLoading] = useState(false)
  const [isFetchingNasabah, setIsFetchingNasabah] = useState(true);
  const [searchTerm, setSearchTerm] = useState('')
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false)

  const fetchNasabah = async () => {
    setIsFetchingNasabah(true);
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
      } else {
        const data = await response.json()
        toast.error("Error", { 
          description: data.error || "Gagal memuat data nasabah", 
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: "Gagal memuat data nasabah",
      })
    } finally {
        setIsFetchingNasabah(false);
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
      } else {
        toast.error("Error", {
          description: "Gagal memuat data jenis sampah",
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: "Gagal memuat data jenis sampah",
      })
    }
  }

  useEffect(() => {
    fetchNasabah()
  }, [searchTerm])

  useEffect(() => {
    fetchWasteTypes()
  }, [])

  const handleQRScan = async (qrData: string) => {
    const loadingToast = toast.loading("Memindai QR Code...");
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
        toast.success("Berhasil", {
          id: loadingToast,
          description: `Nasabah ${data.nasabah.user.name} berhasil ditemukan`,
        })
      } else {
        const data = await response.json()
        toast.error("Error", {
          id: loadingToast,
          description: data.error,
        })
      }
    } catch (error) {
      toast.error("Error", {
        id: loadingToast,
        description: "Gagal memindai QR Code",
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
      toast.error("Error", {
        description: "Pilih nasabah dan tambahkan minimal satu jenis sampah",
      })
      return
    }

    const validItems = depositItems.filter(item => item.wasteTypeId && item.weight > 0)
    if (validItems.length === 0) {
      toast.error("Error", {
        description: "Semua item harus memiliki jenis sampah dan berat yang valid",
      })
      return
    }

    setLoading(true)
    const loadingToast = toast.loading("Menyimpan tabungan...");
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
        const data = await response.json();
        toast.success("Berhasil", {
          id: loadingToast,
          description: "Tabungan berhasil dicatat",
        })
        setSelectedNasabah(null)
        setDepositItems([])
        onSuccess(data.transaction.id)
      } else {
        const data = await response.json()
        toast.error("Error", {
          id: loadingToast,
          description: data.error,
        })
      }
    } catch (error) {
      toast.error("Error", {
        id: loadingToast,
        description: "Gagal mencatat tabungan",
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

  const wasteTypeOptions = wasteTypes.map(wasteType => ({
    value: wasteType.id,
    label: `${wasteType.name} - ${formatCurrency(wasteType.pricePerKg)}/kg`
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Menabung</h2>
          <p className="text-gray-500">Catat tabungan sampah</p>
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
                <p className="text-sm text-gray-500">{selectedNasabah.accountNo}</p>
                <p className="text-sm text-gray-500">{selectedNasabah.user.phone}</p>
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
          isFetchingNasabah ? (
            <NasabahSelectionSkeleton />
          ) : (
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
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {nasabah.map((nasabahItem) => (
                    <div
                      key={nasabahItem.id}
                      className="p-3 border rounded-lg cursor-pointer"
                      onClick={() => setSelectedNasabah(nasabahItem)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{nasabahItem.user.name}</p>
                          <p className="text-sm text-gray-500">{nasabahItem.accountNo}</p>
                        </div>
                        <Badge variant="outline">{formatCurrency(nasabahItem.balance)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
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
                    <Label className="mb-1">Jenis Sampah</Label>
                    <Combobox
                      options={wasteTypeOptions}
                      value={item.wasteTypeId}
                      onChange={(value) => updateDepositItem(index, 'wasteTypeId', value)}
                      placeholder="Pilih jenis"
                      searchPlaceholder="Cari jenis sampah..."
                      emptyPlaceholder="Jenis sampah tidak ditemukan."
                    />
                  </div>
                  <div className="w-32">
                    <Label className="mb-1">Berat (kg)</Label>
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
                      <p className="text-sm text-gray-500">Total Berat</p>
                      <p className="font-semibold">{formatWeight(calculateTotalWeight())}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Nilai</p>
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
