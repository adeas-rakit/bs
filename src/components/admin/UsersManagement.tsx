'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { Building, Users as UsersIcon, TrendingUp } from 'lucide-react'
import { UserForm } from './UserForm'
import { InfoCard } from '@/components/ui/InfoCard'
import Popup from '@/components/ui/Popup'
import { useAlert } from '@/hooks/use-alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency } from '@/lib/utils'

interface DepositDetail {
  unitName: string;
  count: number;
}

interface User {
  id: string; // User ID
  name: string;
  email: string;
  role: 'ADMIN' | 'UNIT' | 'NASABAH';
  unit?: { id: string; name: string };
  nasabah?: {
    id: string; // Nasabah ID
    accountNo: string;
    balance: number;
    totalDepositCount?: number;
    depositsByUnit?: DepositDetail[];
  };
  // Merged from nasabah.user for consistent structure
  status?: string;
  createdAt?: string;
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
            <div className="md:col-span-2"><Skeleton className="h-10 w-full" /></div>
            <div className="md:col-span-1"><Skeleton className="h-10 w-full" /></div>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>
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

  const fetchUsersAndNasabah = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch admins and units
      const usersResponse = await fetch('/api/users', { headers });
      if (!usersResponse.ok) throw new Error('Gagal memuat pengguna');
      const usersData = await usersResponse.json();
      const nonNasabahUsers = usersData.users.filter((u: User) => u.role !== 'NASABAH');

      // Fetch nasabah with detailed data
      const nasabahResponse = await fetch('/api/nasabah', { headers });
      if (!nasabahResponse.ok) throw new Error('Gagal memuat nasabah');
      const nasabahData = await nasabahResponse.json();
      
      const transformedNasabah: User[] = nasabahData.nasabah.map((n: any) => ({
        id: n.user.id,
        name: n.user.name,
        email: n.user.email,
        role: 'NASABAH',
        status: n.user.status,
        createdAt: n.user.createdAt,
        unit: n.unit, // Home unit
        nasabah: {
          id: n.id,
          accountNo: n.accountNo,
          balance: n.balance,
          totalDepositCount: n.totalDepositCount,
          depositsByUnit: n.depositsByUnit,
        }
      }));

      setUsers([...nonNasabahUsers, ...transformedNasabah]);
    } catch (error: any) {
      toast.error("Error Memuat Data", { description: error.message })
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
    await Promise.all([fetchUsersAndNasabah(), fetchUnits()])
    setLoading(false)
  }

  useEffect(() => {
    fetchData();
  }, [])

  const handleFormSubmit = async (userData: Partial<User>) => {
    const method = editingUser ? 'PUT' : 'POST';
    const endpoint = `/api/users${editingUser ? `?id=${editingUser.id}` : ''}`;
    const loadingToast = toast.loading("Menyimpan pengguna...")
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(userData),
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || 'Gagal menyimpan pengguna');
        
        toast.success("Sukses", { id: loadingToast, description: `Pengguna berhasil ${editingUser ? 'diperbarui' : 'ditambahkan'}.` });
        setIsFormOpen(false);
        setEditingUser(null);
        await fetchUsersAndNasabah(); // Re-fetch all data
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
                  throw new Error(errorData.error || 'Gagal menghapus pengguna');
                }
                toast.success("Sukses", { id: loadingToast, description: "Pengguna berhasil dihapus." });
                await fetchUsersAndNasabah(); // Re-fetch all data
            } catch (error: any) {
                toast.error("Error", { id: loadingToast, description: error.message });
            }
        },
        confirmText: 'Hapus',
    });
  }

  const roleOptions = [
    { label: "Semua Role", value: "all" },
    { label: "Admin", value: "ADMIN" },
    { label: "Petugas Unit", value: "UNIT" },
    { label: "Nasabah", value: "NASABAH" },
  ];

  const filteredUsers = users.filter(user => 
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (roleFilter === 'all' || user.role === roleFilter)
  ).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

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
                 />
            </div>
        </div>

        <Popup 
            isOpen={isFormOpen} 
            setIsOpen={(isOpen) => {
                if (!isOpen) setEditingUser(null);
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
                            <div className="font-semibold text-gray-500">Email</div><div>{user.email || '-'}</div>
                            {user.unit && <><div className="font-semibold text-gray-500">Unit Induk</div><div>{user.unit.name}</div></>}
                        </div>
                    }
                    expandedInfo={
                      user.role === 'NASABAH' && user.nasabah ? (
                        <div className="text-sm text-gray-700 space-y-3 pt-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                              <div className="font-semibold text-gray-500">No. Rekening</div><div>{user.nasabah.accountNo}</div>
                              <div className="font-semibold text-gray-500">Total Saldo</div><div>{formatCurrency(user.nasabah.balance)}</div>
                          </div>
                          {user.nasabah.totalDepositCount !== undefined && (
                            <div className="pt-2 border-t">
                              <div className="flex items-center font-semibold text-gray-500 mb-2">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Riwayat Menabung
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                                <div className="font-semibold text-gray-500">Total Transaksi</div>
                                <div>{user.nasabah.totalDepositCount} kali</div>
                                {user.nasabah.depositsByUnit && user.nasabah.depositsByUnit.length > 0 && (
                                  <div className="col-span-full sm:col-span-2 sm:col-start-3">
                                      <div className="font-semibold text-gray-500">Rincian per Unit:</div>
                                      <ul className="list-disc list-inside pl-2">
                                          {user.nasabah.depositsByUnit.map(detail => (
                                              <li key={detail.unitName}>{detail.unitName}: {detail.count} kali</li>
                                          ))}
                                      </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null
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
