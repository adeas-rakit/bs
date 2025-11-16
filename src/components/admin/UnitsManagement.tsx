'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building2,
  Phone,
  MapPin,
  Users,
  TrendingUp,
  CheckCircle, 
  XCircle
} from 'lucide-react'
import { UnitForm } from './UnitForm'
import { InfoCard } from '@/components/ui/InfoCard'
import Popup from '@/components/ui/Popup'
import { useAlert } from '@/hooks/use-alert'

interface Unit {
  id: string
  name: string
  address: string
  phone: string
  status: 'AKTIF' | 'DITANGGUHKAN'
  createdAt: string
  _count: {
    users: number
    transactions: number
  }
}

interface UnitsManagementProps {
  isFormOpen: boolean;
  setIsFormOpen: (isOpen: boolean) => void;
}

export default function UnitsManagement({ isFormOpen, setIsFormOpen }: UnitsManagementProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null)
  const { toast } = useToast()
  const { showAlert } = useAlert();

  const fetchUnits = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/units', { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error('Gagal memuat unit');
      const data = await response.json()
      setUnits(data.units)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  const handleFormSubmit = async (formData: Partial<Unit>) => {
    const isEditing = editingUnit && editingUnit.id;
    const method = isEditing ? 'PUT' : 'POST';
    const endpoint = isEditing ? `/api/units?id=${editingUnit.id}` : '/api/units';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData),
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.message || 'Gagal menyimpan unit');
        
        toast({ title: "Sukses", description: `Unit berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}.` });
        setIsFormOpen(false);
        setEditingUnit(null);
        await fetchUnits();
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsFormOpen(true);
  }

  const handleDelete = (unitId: string) => {
    showAlert({
        type: 'warning',
        title: 'Hapus Unit',
        message: 'Apakah Anda yakin ingin menghapus unit ini? Ini akan menghapus semua data terkait.',
        onConfirm: async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/units?id=${unitId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Gagal menghapus unit');
                }
                toast({ title: "Sukses", description: "Unit berhasil dihapus." });
                await fetchUnits();
            } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            }
        },
        onCancel: () => {},
        confirmText: 'Hapus',
        cancelText: 'Batal'
    });
  }
  
  const filteredUnits = units.filter(unit => 
      (unit.name.toLowerCase().includes(searchTerm.toLowerCase()) || unit.address.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || unit.status === statusFilter)
  );

  if (loading) return <div className="flex justify-center items-center h-40"><div className="w-8 h-8 border-4 border-t-green-600 border-gray-200 rounded-full animate-spin"></div></div>;
  
  return (
     <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full md:w-1/2 lg:w-1/3">
                <Input placeholder="Cari nama atau alamat unit..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="AKTIF">Aktif</SelectItem>
                        <SelectItem value="DITANGGUHKAN">Ditangguhkan</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Popup isOpen={isFormOpen} setIsOpen={setIsFormOpen} title={editingUnit ? 'Edit Unit' : 'Tambah Unit'}>
            <UnitForm 
                setIsOpen={setIsFormOpen} 
                onSubmit={handleFormSubmit} 
                initialData={editingUnit} 
            />
        </Popup>

        <div className="space-y-4">
             {filteredUnits.map(unit => (
                <InfoCard
                    key={unit.id}
                    id={unit.id}
                    title={unit.name}
                    subtitle={unit.address}
                    icon={<Building2 className="w-6 h-6 text-gray-600"/>}
                    initialInfo={
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="font-semibold text-gray-500 flex items-center"><Phone className="w-3 h-3 mr-2"/> Telepon</div><div>{unit.phone}</div>
                            <div className="font-semibold text-gray-500 flex items-center">{unit.status === 'AKTIF' ? <CheckCircle className="w-3 h-3 mr-2 text-green-500"/> : <XCircle className="w-3 h-3 mr-2 text-red-500"/>} Status</div><div>{unit.status}</div>
                        </div>
                    }
                    expandedInfo={
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="font-semibold text-gray-500 flex items-center"><Users className="w-3 h-3 mr-2"/> Petugas</div><div>{unit._count.users}</div>
                             <div className="font-semibold text-gray-500 flex items-center"><TrendingUp className="w-3 h-3 mr-2"/> Transaksi</div><div>{unit._count.transactions}</div>
                             <div className="font-semibold text-gray-500 flex items-center"><MapPin className="w-3 h-3 mr-2"/> Alamat</div><div>{unit.address}</div>
                        </div>
                    }
                    actionButtons={
                        <>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(unit)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(unit.id)}>Hapus</Button>
                        </>
                    }
                />
            ))}
        </div>
        {filteredUnits.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
                <p>Tidak ada unit yang ditemukan.</p>
            </div>
        )}
    </div>
  )
}
