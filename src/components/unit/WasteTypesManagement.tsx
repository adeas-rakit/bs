'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { 
  Trash2 as TrashIcon,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { WasteTypeForm } from './WasteTypeForm'
import { InfoCard } from '@/components/ui/InfoCard'
import Popup from '@/components/ui/Popup'
import { useAlert } from '@/hooks/use-alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { WasteType } from '@/types'

interface WasteTypesManagementProps {
  isFormOpen: boolean;
  setIsFormOpen: (isOpen: boolean) => void;
  editingWasteType: Partial<WasteType> | null;
  setEditingWasteType: (wasteType: Partial<WasteType> | null) => void;
}

const WasteTypesManagementSkeleton = () => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="md:col-span-1">
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
                </div>
            </div>
        ))}
    </div>
);

export default function WasteTypesManagement({ 
  isFormOpen, 
  setIsFormOpen, 
  editingWasteType,
  setEditingWasteType 
}: WasteTypesManagementProps) {
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { showAlert } = useAlert()

  const fetchWasteTypes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/waste-types',
       { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error('Gagal memuat data jenis sampah');
      const data = await response.json()
      setWasteTypes(data.wasteTypes)
    } catch (error: any) {
      toast.error("Error", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWasteTypes()
  }, [])

  const handleFormSubmit = async (formData: Partial<WasteType>) => {
    const isEditing = editingWasteType && editingWasteType.id;
    const method = isEditing ? 'PUT' : 'POST';
    const endpoint = isEditing ? `/api/waste-types/${editingWasteType.id}` : '/api/waste-types';

    const loadingToast = toast.loading("Menyimpan data...")
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData),
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.message || 'Gagal menyimpan data');
        
        toast.success("Sukses", { id: loadingToast, description: `Jenis sampah berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}.` });
        setIsFormOpen(false);
        setEditingWasteType(null);
        await fetchWasteTypes();
    } catch (error: any) {
        toast.error("Error", { id: loadingToast, description: error.message });
    }
  };

  const handleEdit = (wasteType: WasteType) => {
    setEditingWasteType(wasteType);
    setIsFormOpen(true);
  }

  const handleDelete = (id: string) => {
    showAlert({
        type: 'warning',
        title: 'Hapus Jenis Sampah',
        message: 'Apakah Anda yakin ingin menghapus jenis sampah ini?',
        onConfirm: async () => {
            const loadingToast = toast.loading("Menghapus data...")
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/waste-types/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Gagal menghapus data');
                }
                toast.success("Sukses", { id: loadingToast, description: "Jenis sampah berhasil dihapus." });
                await fetchWasteTypes();
            } catch (error: any) {
                toast.error("Error", { id: loadingToast, description: error.message });
            }
        },
        onCancel: () => {},
        confirmText: 'Hapus',
        cancelText: 'Batal'
    });
  }

  const statusOptions = [
    { label: "Semua Status", value: "all" },
    { label: "Aktif", value: "AKTIF" },
    { label: "Tidak Aktif", value: "TIDAK_AKTIF" },
  ];

  const filteredWasteTypes = wasteTypes.filter(wt => 
      wt.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || wt.status === statusFilter)
  );
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (loading) return <WasteTypesManagementSkeleton />;

  return (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="md:col-span-1">
                <Input placeholder="Cari nama jenis sampah..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="md:col-span-1">
                 <Combobox
                    options={statusOptions}
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
                    setEditingWasteType(null);
                }
                setIsFormOpen(isOpen);
            }} 
            title={editingWasteType ? 'Edit Jenis Sampah' : 'Tambah Jenis Sampah'}
        >
            <WasteTypeForm
                setIsOpen={setIsFormOpen} 
                onSubmit={handleFormSubmit} 
                initialData={editingWasteType} 
            />
        </Popup>

        <div className="space-y-4">
            {filteredWasteTypes.length > 0 ? filteredWasteTypes.map(wt => (
                <InfoCard
                    key={wt.id}
                    id={wt.id}
                    title={wt.name}
                    subtitle={formatCurrency(wt.pricePerKg) + ' / kg'}
                    icon={<TrashIcon className="w-6 h-6 text-gray-500"/>}
                    initialInfo={
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                            <div className="font-semibold text-gray-500 flex items-center">{wt.status === 'AKTIF' ? <CheckCircle className="w-3 h-3 mr-2 text-green-500"/> : <XCircle className="w-3 h-3 mr-2 text-red-500"/>} Status</div>
                            <div>{wt.status === 'AKTIF' ? 'Aktif' : 'Tidak Aktif'}</div>
                        </div>
                    }
                    actionButtons={
                        <>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(wt)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(wt.id)}>Hapus</Button>
                        </>
                    }
                />
            )) : (
              <EmptyState
                icon={<TrashIcon />}
                title="Tidak Ada Jenis Sampah"
                description="Belum ada jenis sampah yang ditambahkan untuk unit Anda."
              />
            )}
        </div>
    </div>
  )
}