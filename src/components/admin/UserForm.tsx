'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'

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

  const roleOptions = [
    { label: "Nasabah", value: "NASABAH" },
    { label: "Petugas Unit", value: "UNIT" },
    { label: "Admin", value: "ADMIN" },
  ];

  const unitOptions = units.map(unit => ({ label: unit.name, value: unit.id }));

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
            <Combobox
                options={roleOptions}
                value={formData.role}
                onChange={(value) => setFormData({ ...formData, role: value as 'ADMIN' | 'UNIT' | 'NASABAH', unitId: '' })}
                placeholder="Pilih Role"
                searchPlaceholder="Cari role..."
                emptyPlaceholder="Role tidak ditemukan."
            />
        </div>
          {formData.role === 'UNIT' && (
            <div>
                <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <Combobox
                    options={unitOptions}
                    value={formData.unitId}
                    onChange={(value) => setFormData({ ...formData, unitId: value })}
                    placeholder="Pilih Unit"
                    searchPlaceholder="Cari unit..."
                    emptyPlaceholder="Unit tidak ditemukan."
                />
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
