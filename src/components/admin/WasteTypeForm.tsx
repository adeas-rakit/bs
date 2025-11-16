'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign } from 'lucide-react'

interface WasteType {
  id: string
  name: string
  pricePerKg: number
  status: 'AKTIF' | 'TIDAK_AKTIF'
}

interface WasteTypeFormProps {
  onSubmit: (data: Partial<WasteType>) => void
  initialData: Partial<WasteType> | null
  setIsOpen: (isOpen: boolean) => void
}

export function WasteTypeForm({ onSubmit, initialData, setIsOpen }: WasteTypeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    pricePerKg: 0,
    status: 'AKTIF' as 'AKTIF' | 'TIDAK_AKTIF'
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        pricePerKg: initialData.pricePerKg || 0,
        status: initialData.status || 'AKTIF'
      })
    } else {
      setFormData({ name: '', pricePerKg: 0, status: 'AKTIF' })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...formData, pricePerKg: Number(formData.pricePerKg) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Jenis Sampah</label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="pricePerKg" className="block text-sm font-medium text-gray-700 mb-1">Harga per Kg</label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="pricePerKg" type="number" value={formData.pricePerKg} onChange={(e) => setFormData({ ...formData, pricePerKg: Number(e.target.value) })} required className="pl-8"/>
                </div>
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={formData.status} onValueChange={(value: 'AKTIF' | 'TIDAK_AKTIF') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AKTIF">Aktif</SelectItem>
                        <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
        </div>
    </form>
  )
}
