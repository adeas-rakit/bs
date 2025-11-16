'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, Users as UsersIcon } from 'lucide-react'
import { UserForm } from './UserForm'
import { InfoCard } from '@/components/ui/InfoCard'
import Popup from '@/components/ui/Popup'
import { useAlert } from '@/hooks/use-alert'

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

export default function UsersManagement({ isFormOpen, setIsFormOpen }: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const { toast } = useToast()
  const { showAlert } = useAlert();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error('Gagal memuat pengguna');
      const data = await response.json()
      setUsers(data.users)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
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
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(userData),
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.message || 'Gagal menyimpan pengguna');
        
        toast({ title: "Sukses", description: `Pengguna berhasil ${editingUser ? 'diperbarui' : 'diperbarui'}.` });
        setIsFormOpen(false);
        setEditingUser(null);
        await fetchUsers(); // Re-fetch users
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
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
                toast({ title: "Sukses", description: "Pengguna berhasil dihapus." });
                await fetchUsers();
            } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            }
        },
        onCancel: () => {},
        confirmText: 'Hapus',
        cancelText: 'Batal'
    });
  }

  const filteredUsers = users.filter(user => 
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === 'all' || user.role === roleFilter)
  );

  if (loading) return <div className="flex justify-center items-center h-40"><div className="w-8 h-8 border-4 border-t-green-600 border-gray-200 rounded-full animate-spin"></div></div>;

  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full md:w-1/2 lg:w-1/3">
                <Input placeholder="Cari nama atau email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                 <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter Role" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Role</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="UNIT">Petugas Unit</SelectItem>
                        <SelectItem value="NASABAH">Nasabah</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Popup isOpen={isFormOpen} setIsOpen={setIsFormOpen} title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}>
            <UserForm 
                setIsOpen={setIsFormOpen} 
                onSubmit={handleFormSubmit} 
                initialData={editingUser} 
                units={units} 
            />
        </Popup>

        <div className="space-y-4">
            {filteredUsers.map(user => (
                <InfoCard
                    key={user.id}
                    id={user.id}
                    title={user.name}
                    subtitle={roleMapping[user.role]}
                    icon={user.role === 'UNIT' ? <Building className="w-6 h-6 text-gray-600"/> : <UsersIcon className="w-6 h-6 text-gray-600"/>}
                    initialInfo={
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="font-semibold text-gray-500">Email</div><div>{user.email}</div>
                            {user.unit && <><div className="font-semibold text-gray-500">Unit</div><div>{user.unit.name}</div></>}
                        </div>
                    }
                    expandedInfo={
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
            ))}
        </div>
        {filteredUsers.length === 0 && (
            <div className="text-center py-10 text-gray-500">
                <p>Tidak ada pengguna yang cocok dengan kriteria pencarian.</p>
            </div>
        )}
    </div>
  )
}
