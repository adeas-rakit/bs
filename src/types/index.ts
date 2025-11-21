
// This file is now aligned with prisma/schema.prisma

export type UserRole = 'ADMIN' | 'UNIT' | 'NASABAH';

export type UserStatus = 'AKTIF' | 'DITANGGUHKAN';

export type WasteStatus = 'AKTIF' | 'TIDAK_AKTIF';

export interface UserProfile {
    id: string;
    name: string;
    phone: string | null;
    status: UserStatus;
    role: UserRole;
}

// Aligned with the Prisma Nasabah Model
export interface Nasabah {
  id: string; // The ID of the Nasabah record itself
  accountNo: string;
  balance: number;
  totalWeight: number;
  depositCount: number;
  unitId: string | null;
  // The `user` relation is nested, providing the user's details
  user: UserProfile;
}

// Aligned with the Prisma WasteType Model
export interface WasteType {
  id: string;
  name: string;
  pricePerKg: number;
  status: WasteStatus;
  unitId: string; 
}

// Generic dashboard data structure
export interface DashboardData {
    totalBalance: number;
    totalWeight: number;
    nasabahCount: number;
    transactionCount: number;
}
