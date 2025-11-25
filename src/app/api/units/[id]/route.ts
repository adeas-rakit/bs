import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return request.cookies.get('token')?.value
}

async function authenticateUser(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) throw new Error('Token tidak ditemukan')
  
  const decoded = jwt.verify(token, JWT_SECRET) as any
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    include: { unit: true }
  })
  
  if (!user) throw new Error('User tidak ditemukan')
  return user
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    const { name, address, phone, status, minWithdrawal } = await request.json();

    let unitIdToUpdate = params.id;
    let dataToUpdate: any = {};

    if (user.role === 'UNIT') {
      // Jika pengguna adalah UNIT, paksa update ke unit mereka sendiri dan abaikan params.id
      if (!user.unitId) {
        return NextResponse.json(
          { error: 'Pengguna unit tidak memiliki unit terkait.' },
          { status: 400 }
        );
      }
      unitIdToUpdate = user.unitId;
      // Pengguna UNIT hanya boleh mengubah minWithdrawal
      if (minWithdrawal !== undefined) {
        dataToUpdate.minWithdrawal = Number(minWithdrawal);
      } else {
        // Jika tidak ada data yang relevan untuk diupdate oleh UNIT, kembalikan error
        return NextResponse.json(
          { error: 'Tidak ada data yang valid untuk diperbarui.' },
          { status: 400 }
        );
      }
    } else if (user.role === 'ADMIN') {
      // Admin dapat mengupdate semua field yang diizinkan
      dataToUpdate = {
        ...(name && { name }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(status && { status }),
        ...(minWithdrawal !== undefined && { minWithdrawal: Number(minWithdrawal) }),
      };
    } else {
      // Jika bukan ADMIN atau UNIT, tolak akses
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      );
    }

    // Pastikan ada sesuatu untuk diupdate
    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json(
            { error: 'Tidak ada data yang valid untuk diperbarui.' },
            { status: 400 }
        );
    }

    const unit = await db.unit.update({
      where: { id: unitIdToUpdate },
      data: dataToUpdate
    });

    return NextResponse.json({
      message: 'Unit berhasil diperbarui',
      unit
    });

  } catch (error: any) {
    console.error('Update unit error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    await db.unit.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Unit berhasil dihapus'
    })

  } catch (error: any) {
    console.error('Delete unit error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}