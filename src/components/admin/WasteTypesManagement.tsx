'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign,
  TrendingUp,
  Trash2 as TrashIcon,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { WasteTypeForm } from './WasteTypeForm'
import { InfoCard } from '@/components/ui/InfoCard'
import Popup from '@/components/ui/Popup'
import { useAlert } from '@/hooks/use-alert'

interface WasteType {
  id: string
  name: string
  pricePerKg: number
  status: 'AKTIF' | 'TIDAK_AKTIF'
  createdAt: string
  _count: {
    transactionItems: number
  }
}

interface WasteTypesManagementProps {
  isFormOpen: boolean;
  setIsFormOpen: (isOpen: boolean) => void;
}

export default function WasteTypesManagement({ isFormOpen, setIsFormOpen }: WasteTypesManagementProps) {
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingWasteType, setEditingWasteType] = useState<Partial<WasteType> | null>(null)
  const { toast } = useToast()
  const { showAlert } = useAlert();

  const fetchWasteTypes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/waste-types', { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error('Gagal memuat data jenis sampah');
      const data = await response.json()
      setWasteTypes(data.wasteTypes)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
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
    const endpoint = isEditing ? `/api/waste-types?id=${editingWasteType.id}` : '/api/waste-types';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData),
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.message || 'Gagal menyimpan data');
        
        toast({ title: "Sukses", description: `Jenis sampah berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}.` });
        setIsFormOpen(false);
        setEditingWasteType(null);
        await fetchWasteTypes();
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
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
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/waste-types?id=${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Gagal menghapus data');
                }
                toast({ title: "Sukses", description: "Jenis sampah berhasil dihapus." });
                await fetchWasteTypes();
            } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            }
        },
        onCancel: () => {},
        confirmText: 'Hapus',
        cancelText: 'Batal'
    });
  }

  const filteredWasteTypes = wasteTypes.filter(wt => 
      wt.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || wt.status === statusFilter)
  );
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (loading) return <div className="flex justify-center items-center h-40"><div className="w-8 h-8 border-4 border-t-green-600 border-gray-200 rounded-full animate-spin"></div></div>

  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full md:w-1/2 lg:w-1/3">
                <Input placeholder="Cari nama jenis sampah..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="AKTIF">Aktif</SelectItem>
                        <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Popup isOpen={isFormOpen} setIsOpen={setIsFormOpen} title={editingWasteType ? 'Edit Jenis Sampah' : 'Tambah Jenis Sampah'}>
            <WasteTypeForm
                setIsOpen={setIsFormOpen} 
                onSubmit={handleFormSubmit} 
                initialData={editingWasteType} 
            />
        </Popup>

        <div className="space-y-4">
            {filteredWasteTypes.map(wt => (
                <InfoCard
                    key={wt.id}
                    id={wt.id}
                    title={wt.name}
                    subtitle={formatCurrency(wt.pricePerKg) + ' / kg'}
                    icon={<TrashIcon className="w-6 h-6 text-gray-600"/>}
                    initialInfo={
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="font-semibold text-gray-500 flex items-center">{wt.status === 'AKTIF' ? <CheckCircle className="w-3 h-3 mr-2 text-green-500"/> : <XCircle className="w-3 h-3 mr-2 text-red-500"/>} Status</div>
                            <div>{wt.status === 'AKTIF' ? 'Aktif' : 'Tidak Aktif'}</div>
                        </div>
                    }
                    expandedInfo={
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="font-semibold text-gray-500 flex items-center"><TrendingUp className="w-3 h-3 mr-2"/> Jml. Transaksi</div><div>{wt._count.transactionItems}</div>
                        </div>
                    }
                    actionButtons={
                        <>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(wt)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(wt.id)}>Hapus</Button>
                        </>
                    }
                />
            ))}
        </div>
        {filteredWasteTypes.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
                <p>Tidak ada jenis sampah yang ditemukan.</p>
            </div>
        )}
    </div>
  )
}
