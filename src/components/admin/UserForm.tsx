'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'UNIT' | 'NASABAH';
  unitId?: string;
  unit?: Unit;
}

interface Unit {
  id: string;
  name: string;
}

interface UserFormProps {
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: Partial<User & { password?: string }>) => void;
  initialData: Partial<User> | null;
  units: Unit[];
}

export function UserForm({ setIsOpen, onSubmit, initialData, units }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || 'NASABAH',
    unitId: initialData?.unit?.id || initialData?.unitId || ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '',
        role: initialData.role || 'NASABAH',
        unitId: initialData.unit?.id || initialData.unitId || '',
      });
    } else {
      setFormData({ name: '', email: '', password: '', role: 'NASABAH', unitId: '' });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: any = { ...formData };
    if (initialData && !dataToSubmit.password) {
        delete dataToSubmit.password;
    }
    if (dataToSubmit.role !== 'UNIT') {
        dataToSubmit.unitId = null;
    }
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <Select value={formData.role} onValueChange={(value: 'ADMIN' | 'UNIT' | 'NASABAH') => setFormData({ ...formData, role: value, unitId: '' })}>
                <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="NASABAH">Nasabah</SelectItem>
                    <SelectItem value="UNIT">Petugas Unit</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
            </Select>
        </div>
          {formData.role === 'UNIT' && (
            <div>
                <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <Select value={formData.unitId} onValueChange={(value) => setFormData({ ...formData, unitId: value })} required={formData.role === 'UNIT'}>
                    <SelectTrigger><SelectValue placeholder="Pilih Unit" /></SelectTrigger>
                    <SelectContent>
                        {units.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            {initialData ? 'Password Baru (opsional)' : 'Password'}
        </label>
        <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!initialData} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
        <Button type="submit">Simpan</Button>
      </div>
    </form>
  );
}
