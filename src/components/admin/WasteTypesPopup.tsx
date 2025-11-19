'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { InfoCard } from '@/components/ui/InfoCard'
import { Trash2 as TrashIcon, CheckCircle, XCircle } from 'lucide-react'

interface WasteType {
  id: string
  name: string
  pricePerKg: number
  status: 'AKTIF' | 'TIDAK_AKTIF'
}

interface WasteTypesPopupProps {
  unitId: string
  unitName: string
}

export default function WasteTypesPopup({ unitId, unitName }: WasteTypesPopupProps) {
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWasteTypes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/waste-types?unitId=${unitId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error('Gagal memuat data jenis sampah')
      }
      const data = await response.json()
      setWasteTypes(data.wasteTypes)
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (unitId) {
      fetchWasteTypes()
    }
  }, [unitId])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-8 h-8 border-4 border-t-green-600 border-gray-200 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {wasteTypes.length > 0 ? (
        wasteTypes.map((wt) => (
          <InfoCard
            key={wt.id}
            id={wt.id}
            title={wt.name}
            subtitle={formatCurrency(wt.pricePerKg) + ' / kg'}
            icon={<TrashIcon className="w-6 h-6 text-gray-500" />}
            expandedInfo={
              <div className="flex justify-center items-center gap-2 text-xs">
              id: {wt.id}
              </div>
            }
            initialInfo={
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-semibold text-gray-500 flex items-center">
                  {wt.status === 'AKTIF' ? (
                    <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-2 text-red-500" />
                  )}
                  Status
                </div>
                <div>{wt.status === 'AKTIF' ? 'Aktif' : 'Tidak Aktif'}</div>
              </div>
            }
          />
        ))
      ) : (
        <p className="text-center text-gray-500">
          Tidak ada jenis sampah yang terdaftar untuk unit ini.
        </p>
      )}
    </div>
  )
}
