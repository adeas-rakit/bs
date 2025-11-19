'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { Building, Users as UsersIcon } from 'lucide-react'
import { UserForm } from './UserForm'
import { InfoCard } from '@/components/ui/InfoCard'
import Popup from '@/components/ui/Popup'
import { useAlert } from '@/hooks/use-alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'UNIT' | 'NASABAH';
  unit?: { id: string; name: string };
  nasabah?: { accountNo: string; balance: number };
}

interface Unit {
  id: string;
  name: string;
}

const roleMapping: { [key in User['role']]: string } = {
    ADMIN: 'Admin',
    UNIT: 'Petugas Unit',
    NASABAH: 'Nasabah',
};

interface UsersManagementProps {
  isFormOpen: boolean;
  setIsFormOpen: (isOpen: boolean) => void;
}

const UsersManagementSkeleton = () => (
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
                </div>
            </div>
        ))}
    </div>
);

export default function UsersManagement({ isFormOpen, setIsFormOpen }: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const { showAlert } = useAlert()

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error('Gagal memuat pengguna');
      const data = await response.json()
      setUsers(data.users)
    } catch (error: any) {
      toast.error("Error", { description: error.message })
    }
  }

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/units', { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error('Gagal memuat unit');
      const data = await response.json()
      setUnits(data.units)
    } catch (error: any) { /* Fail silently */ }
  }

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchUsers(), fetchUnits()])
    setLoading(false)
  }

  useEffect(() => {
    fetchData();
  }, [])

  const handleFormSubmit = async (userData: Partial<User>) => {
    const method = editingUser ? 'PUT' : 'POST';
    const endpoint = editingUser ? `/api/users?id=${editingUser.id}` : '/api/users';
    const loadingToast = toast.loading("Menyimpan pengguna...")
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(userData),
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.message || 'Gagal menyimpan pengguna');
        
        toast.success("Sukses", { id: loadingToast, description: `Pengguna berhasil ${editingUser ? 'diperbarui' : 'ditambahkan'}.` });
        setIsFormOpen(false);
        setEditingUser(null);
        await fetchUsers(); // Re-fetch users
    } catch (error: any) {
        toast.error("Error", { id: loadingToast, description: error.message });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  }

  const handleDelete = (userId: string) => {
    showAlert({
        type: 'warning',
        title: 'Hapus Pengguna',
        message: 'Apakah Anda yakin ingin menghapus pengguna ini?',
        onConfirm: async () => {
            const loadingToast = toast.loading("Menghapus pengguna...")
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/users?id=${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Gagal menghapus pengguna');
                }
                toast.success("Sukses", { id: loadingToast, description: "Pengguna berhasil dihapus." });
                await fetchUsers();
            } catch (error: any) {
                toast.error("Error", { id: loadingToast, description: error.message });
            }
        },
        onCancel: () => {},
        confirmText: 'Hapus',
        cancelText: 'Batal'
    });
  }

  const roleOptions = [
    { label: "Semua Role", value: "all" },
    { label: "Admin", value: "ADMIN" },
    { label: "Petugas Unit", value: "UNIT" },
    { label: "Nasabah", value: "NASABAH" },
  ];

  const filteredUsers = users.filter(user => 
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === 'all' || user.role === roleFilter)
  );

  if (loading) return <UsersManagementSkeleton />;

  return (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
                <Input placeholder="Cari nama atau email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
            </div>
            <div className="md:col-span-1">
                 <Combobox
                    options={roleOptions}
                    value={roleFilter}
                    onChange={setRoleFilter}
                    placeholder="Filter Role"
                    searchPlaceholder="Cari role..."
                    emptyPlaceholder="Role tidak ditemukan."
                    className="w-full"
                 />
            </div>
        </div>

        <Popup 
            isOpen={isFormOpen} 
            setIsOpen={(isOpen) => {
                if (!isOpen) {
                    setEditingUser(null);
                }
                setIsFormOpen(isOpen);
            }} 
            title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
        >
            <UserForm 
                setIsOpen={setIsFormOpen} 
                onSubmit={handleFormSubmit} 
                initialData={editingUser} 
                units={units} 
            />
        </Popup>

        <div className="space-y-4">
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                <InfoCard
                    key={user.id}
                    id={user.id}
                    title={user.name}
                    subtitle={roleMapping[user.role]}
                    icon={user.role === 'UNIT' ? <Building className="w-6 h-6 text-gray-500"/> : <UsersIcon className="w-6 h-6 text-gray-500"/>}
                    initialInfo={
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                            <div className="font-semibold text-gray-500">Email</div><div>{user.email}</div>
                            {user.unit && <><div className="font-semibold text-gray-500">Unit</div><div>{user.unit.name}</div></>}
                        </div>
                    }
                    expandedInfo={
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                            {user.nasabah && <><div className="font-semibold text-gray-500">No. Rekening</div><div>{user.nasabah.accountNo}</div></>}
                            {user.nasabah && <><div className="font-semibold text-gray-500">Saldo</div><div>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(user.nasabah.balance)}</div></>}
                        </div>
                    }
                    actionButtons={
                        <>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>Hapus</Button>
                        </>
                    }
                />
            )) : (
              <EmptyState
                icon={<UsersIcon />}
                title="Tidak Ada Pengguna Ditemukan"
                description="Tidak ada pengguna yang cocok dengan filter atau pencarian Anda. Coba lagi atau tambahkan pengguna baru."
              />
            )}
        </div>
    </div>
  )
}
