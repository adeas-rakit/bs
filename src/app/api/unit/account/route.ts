
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

// Fungsi otentikasi yang sama persis seperti di endpoint lain
async function authenticateUser(request: NextRequest) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in the environment variables');
    return NextResponse.json(
      { error: 'Konfigurasi server tidak lengkap' },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get('authorization')
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : request.cookies.get('token')?.value

  if (!token) throw new Error('Token tidak ditemukan')
  
  const decoded = jwt.verify(token, JWT_SECRET) as any
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    include: { unit: true }
  })
  
  if (!user) throw new Error('User tidak ditemukan')
  return user
}

// Handler untuk metode PUT
export async function PUT(request: NextRequest) {
  try {
    // 1. Otentikasi pengguna dan dapatkan datanya
    const user = await authenticateUser(request);

    // 2. Otorisasi: Pastikan pengguna adalah peran 'UNIT' dan memiliki unitId terkait
    if (user.role !== 'UNIT' || !user.unitId) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya pengguna unit yang dapat melakukan tindakan ini.' },
        { status: 403 }
      );
    }

    // 3. Ambil data dari body request
    const { minWithdrawal } = await request.json();

    // 4. Validasi: Pastikan minWithdrawal disediakan
    if (minWithdrawal === undefined) {
        return NextResponse.json(
            { error: 'Data minimal penarikan diperlukan.' },
            { status: 400 }
        );
    }

    // 5. Update data unit di database menggunakan ID dari sesi pengguna
    const updatedUnit = await db.unit.update({
      where: { id: user.unitId }, // ID diambil dari server, bukan URL
      data: { 
        minWithdrawal: Number(minWithdrawal) 
      }
    });

    // 6. Kembalikan respons sukses
    return NextResponse.json({
      message: 'Pengaturan akun unit berhasil diperbarui',
      unit: updatedUnit
    });

  } catch (error: any) {
    console.error('Update Unit Account Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    );
  }
}
