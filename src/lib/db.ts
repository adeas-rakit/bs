import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// Deklarasi global agar tidak terjadi "Too many connections" saat development (Next.js Hot Reload)
declare global {
  var prisma: PrismaClient | undefined;
}

let prismaClient: PrismaClient;

// Opsi logging (opsional, berguna untuk debugging di Vercel Logs)
const prismaConfig = {
  log: ['query', 'error', 'warn'] as any[], // 'info' dihapus agar tidak terlalu berisik
};

if (process.env.JENIS_DB === 'postgresql') {
  console.log('Using Postgresql database (Standard Client)');
  
  // SOLUSI UTAMA:
  // Kita inisialisasi standar tanpa adapter.
  // Ini memungkinkan Prisma membaca flag "?pgbouncer=true" di URL Supabase Anda.
  // Pastikan DATABASE_URL di Vercel berakhiran: ...:6543/postgres?pgbouncer=true
  prismaClient = new PrismaClient(prismaConfig);
  
} else if (process.env.JENIS_DB === 'mysql') {
  console.log('Using MySQL database');
  
  // Standard initialization
  prismaClient = new PrismaClient(prismaConfig);

} else {
  console.log('Using SQLite database');
  
  // Standard initialization
  // (Pastikan schema.prisma Anda provider-nya sesuai jika run lokal pakai sqlite)
  prismaClient = new PrismaClient(prismaConfig);
}

// Pattern Singleton untuk Next.js
export const db = global.prisma || prismaClient;

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}