'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Unit {
  id: string
  name: string
  address: string
  phone: string
  status: 'AKTIF' | 'DITANGGUHKAN'
}

interface UnitFormProps {
  setIsOpen: (isOpen: boolean) => void
  onSubmit: (data: Partial<Unit>) => void
  initialData: Partial<Unit> | null
}

export function UnitForm({ setIsOpen, onSubmit, initialData }: UnitFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    status: 'AKTIF' as 'AKTIF' | 'DITANGGUHKAN'
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        phone: initialData.phone || '',
        status: initialData.status || 'AKTIF'
      })
    } else {
      setFormData({ name: '', address: '', phone: '', status: 'AKTIF' })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Unit</label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
            <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
          </div>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
        <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <Select value={formData.status} onValueChange={(value: 'AKTIF' | 'DITANGGUHKAN') => setFormData({ ...formData, status: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="AKTIF">Aktif</SelectItem>
            <SelectItem value="DITANGGUHKAN">Ditangguhkan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
        <Button type="submit">Simpan</Button>
      </div>
    </form>
  )
}
