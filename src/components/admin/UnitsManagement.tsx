'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { 
  Building2,
  Phone,
  MapPin,
  Users,
  TrendingUp,
  CheckCircle, 
  XCircle,
  Trash2 as TrashIcon
} from 'lucide-react'
import { UnitForm } from './UnitForm'
import { InfoCard } from '@/components/ui/InfoCard'
import Popup from '@/components/ui/Popup'
import WasteTypesPopup from './WasteTypesPopup' 
import { useAlert } from '@/hooks/use-alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

interface Unit {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: 'AKTIF' | 'DITANGGUHKAN';
  createdAt: string;
  officersCount: number;
  transactionsCount: number;
  registeredNasabahCount: number;
  activeNasabahCount: number;
  totalNasabahCount: number;
  wasteTypesCount: number;
}

interface UnitsManagementProps {
  isFormOpen: boolean;
  setIsFormOpen: (isOpen: boolean) => void;
}

const UnitsManagementSkeleton = () => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="md:col-span-1">
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
        {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg shadow-sm bg-white">
                <div className="flex items-center mb-4">
                    <Skeleton className="w-10 h-10 mr-4 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        ))}
    </div>
);

export default function UnitsManagement({ isFormOpen, setIsFormOpen }: UnitsManagementProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [isWastePopupOpen, setIsWastePopupOpen] = useState(false)
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
      toast.error("Error", { description: error.message })
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
    
    const loadingToast = toast.loading(`Menyimpan unit...`);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData),
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.message || 'Gagal menyimpan unit');
        
        toast.success("Sukses", { id: loadingToast, description: `Unit berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}.` });
        setIsFormOpen(false);
        setEditingUnit(null);
        await fetchUnits();
    } catch (error: any) {
        toast.error("Error", { id: loadingToast, description: error.message });
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsFormOpen(true);
  }
  
  const handleViewWaste = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsWastePopupOpen(true);
  }

  const handleDelete = (unitId: string) => {
    showAlert({
        type: 'warning',
        title: 'Hapus Unit',
        message: 'Apakah Anda yakin ingin menghapus unit ini? Ini akan menghapus semua data terkait.',
        onConfirm: async () => {
            const loadingToast = toast.loading("Menghapus unit...");
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
                toast.success("Sukses", { id: loadingToast, description: "Unit berhasil dihapus." });
                await fetchUnits();
            } catch (error: any) {
                toast.error("Error", { id: loadingToast, description: error.message });
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

  if (loading) return <UnitsManagementSkeleton />;
  
  return (
     <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
                <Input placeholder="Cari nama atau alamat unit..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="md:col-span-1">
                 <Combobox
                    options={[
                        { label: "Semua Status", value: "all" },
                        { label: "Aktif", value: "AKTIF" },
                        { label: "Ditangguhkan", value: "DITANGGUHKAN" },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="Filter Status"
                    searchPlaceholder="Cari status..."
                    emptyPlaceholder="Status tidak ditemukan."
                    className="w-full"
                 />
            </div>
        </div>

        <Popup 
            isOpen={isFormOpen} 
            setIsOpen={(isOpen) => {
                if (!isOpen) {
                    setEditingUnit(null);
                }
                setIsFormOpen(isOpen);
            }} 
            title={editingUnit ? 'Edit Unit' : 'Tambah Unit'}
        >
            <UnitForm 
                setIsOpen={setIsFormOpen} 
                onSubmit={handleFormSubmit} 
                initialData={editingUnit} 
            />
        </Popup>
        
        {selectedUnit && (
            <Popup isOpen={isWastePopupOpen} setIsOpen={setIsWastePopupOpen} title={`Jenis Sampah di ${selectedUnit.name}`}>
                <WasteTypesPopup unitId={selectedUnit.id} unitName={selectedUnit.name} />
            </Popup>
        )}

        <div className="space-y-4">
             {filteredUnits.length > 0 ? filteredUnits.map(unit => (
                <InfoCard
                    key={unit.id}
                    id={unit.id}
                    title={unit.name}
                    subtitle={unit.address}
                    icon={<Building2 className="w-6 h-6 text-gray-500"/>}
                    initialInfo={
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                            <div className="font-semibold text-gray-500 flex items-center"><Phone className="w-3 h-3 mr-2"/> Telepon</div><div>{unit.phone}</div>
                            <div className="font-semibold text-gray-500 flex items-center">{unit.status === 'AKTIF' ? <CheckCircle className="w-3 h-3 mr-2 text-green-500"/> : <XCircle className="w-3 h-3 mr-2 text-red-500"/>} Status</div><div>{unit.status}</div>
                        </div>
                    }
                    expandedInfo={
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                             <div className="font-semibold text-gray-500 flex items-center"><TrashIcon className="w-3 h-3 mr-2"/> Jenis Sampah</div><div>{unit.wasteTypesCount}</div>
                            <div className="font-semibold text-gray-500 flex items-center"><Users className="w-3 h-3 mr-2"/> Petugas</div><div>{unit.officersCount}</div>
                            <div className="font-semibold text-gray-500 flex items-center"><Users className="w-3 h-3 mr-2"/> Nasabah Terdaftar</div><div>{unit.registeredNasabahCount}</div>
                            <div className="font-semibold text-gray-500 flex items-center"><Users className="w-3 h-3 mr-2"/> Nasabah Aktif</div><div>{unit.activeNasabahCount}</div>
                            <div className="font-semibold text-gray-500 flex items-center"><Users className="w-3 h-3 mr-2"/> Total Nasabah</div><div>{unit.totalNasabahCount}</div>
                             <div className="font-semibold text-gray-500 flex items-center"><TrendingUp className="w-3 h-3 mr-2"/> Transaksi</div><div>{unit.transactionsCount}</div>
                             <div className="font-semibold text-gray-500 flex items-center"><MapPin className="w-3 h-3 mr-2"/> Alamat</div><div>{unit.address}</div>
                        </div>
                    }
                    actionButtons={
                        <>
                            <Button variant="outline" size="sm" onClick={() => handleViewWaste(unit)}>Lihat Sampah</Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(unit)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(unit.id)}>Hapus</Button>
                        </>
                    }
                />
            )) : (
              <EmptyState
                icon={<Building2 />}
                title="Tidak Ada Unit Ditemukan"
                description="Tidak ada unit yang cocok dengan filter atau pencarian Anda. Coba lagi atau tambahkan unit baru."
              />
            )}
        </div>
    </div>
  )
}
