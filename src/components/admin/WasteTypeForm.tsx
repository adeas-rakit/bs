'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { toast } from 'sonner'

interface WasteTypeSubmitData {
  name: string;
  pricePerKg: number;
  status: 'AKTIF' | 'TIDAK_AKTIF';
  unitId?: string;
  id?: string;
}

interface Unit {
  id: string;
  name: string;
}

interface WasteTypeInitialData {
  id: string
  name: string
  pricePerKg: number
  status: 'AKTIF' | 'TIDAK_AKTIF'
  unit?: {
    id: string;
    name: string;
  };
}

interface WasteTypeFormProps {
  onSubmit: (data: Partial<WasteTypeSubmitData>) => void
  initialData: Partial<WasteTypeInitialData> | null
  setIsOpen: (isOpen: boolean) => void
  units: Unit[]
}

export function WasteTypeForm({ onSubmit, initialData, setIsOpen, units }: WasteTypeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    pricePerKg: 0,
    status: 'AKTIF' as 'AKTIF' | 'TIDAK_AKTIF',
    unitId: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        pricePerKg: initialData.pricePerKg || 0,
        status: initialData.status || 'AKTIF',
        unitId: initialData.unit?.id || ''
      })
    } else {
      setFormData({ name: '', pricePerKg: 0, status: 'AKTIF', unitId: '' })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialData && !formData.unitId) {
        toast.error("Error", { description: "Silakan pilih unit bank sampah." });
        return;
    }
    
    const dataToSubmit: Partial<WasteTypeSubmitData> = {
        ...formData,
        pricePerKg: Number(formData.pricePerKg)
    };
    if (initialData) {
        delete dataToSubmit.unitId;
    }

    onSubmit(dataToSubmit);
  }

  const unitOptions = units.map(unit => ({ label: unit.name, value: unit.id }));
  const statusOptions = [
    { label: "Aktif", value: "AKTIF" },
    { label: "Tidak Aktif", value: "TIDAK_AKTIF" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-1">Unit Bank Sampah</label>
            {initialData ? (
                <>
                    <Input 
                        value={initialData.unit?.name || ''} 
                        disabled 
                    />
                    <p className="text-xs text-gray-500 mt-1">Unit tidak dapat diubah setelah dibuat.</p>
                </>
            ) : (
                <Combobox
                    options={unitOptions}
                    value={formData.unitId}
                    onChange={(value) => setFormData({ ...formData, unitId: value })}
                    placeholder="Pilih Unit"
                    searchPlaceholder="Cari unit..."
                    emptyPlaceholder={units.length > 0 ? "Unit tidak ditemukan." : "Memuat unit..."}
                />
            )}
        </div>

        <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Jenis Sampah</label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="pricePerKg" className="block text-sm font-medium text-gray-700 mb-1">Harga per Kg</label>
                <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 text-sm flex items-center">Rp</div>
                    <Input id="pricePerKg" type="number" value={formData.pricePerKg} onChange={(e) => setFormData({ ...formData, pricePerKg: Number(e.target.value) })} required className="pl-8"/>
                </div>
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Combobox
                    options={statusOptions}
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value as 'AKTIF' | 'TIDAK_AKTIF' })}
                    placeholder="Pilih Status"
                    searchPlaceholder="Cari status..."
                    emptyPlaceholder="Status tidak ditemukan."
                />
            </div>
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
        </div>
    </form>
  )
}
