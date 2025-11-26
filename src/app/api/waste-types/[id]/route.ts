
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

async function authenticateUser(request: NextRequest) {
  
  const token = request.headers.get('authorization')?.split(' ')[1] || request.cookies.get('token')?.value;
  if (!token) {
    throw new Error('Token tidak ditemukan');
  }
  const user = await getUserFromToken(token);
  if (!user) {
    throw new Error('User tidak ditemukan');
  }
  return user;
}

const extractIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1];
};

export async function PUT(
  request: NextRequest,
) {
  try {
    const id = extractIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'Gagal mengekstrak ID dari URL.' }, { status: 400 });
    }

    const user = await authenticateUser(request);

    if (!['ADMIN', 'UNIT'].includes(user.role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { name, pricePerKg, status } = body;

    if (user.role === 'UNIT') {
      const existingWasteType = await db.wasteType.findUnique({ where: { id } });
      if (!existingWasteType || existingWasteType.unitId !== user.unitId) {
        return NextResponse.json({ error: 'Anda tidak berhak mengubah jenis sampah ini' }, { status: 403 });
      }
    }

    const dataToUpdate: { [key: string]: any } = {};
    if (name) dataToUpdate.name = name;
    if (status) dataToUpdate.status = status;
    if (pricePerKg !== null && pricePerKg !== undefined) {
      const price = parseFloat(pricePerKg);
      if (!isNaN(price)) {
        dataToUpdate.pricePerKg = price;
      }
    }

    const wasteType = await db.wasteType.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      message: 'Jenis sampah berhasil diperbarui',
      wasteType,
    });

  } catch (error: any) {
    console.error('Update waste type error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
) {
  try {
    const id = extractIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'Gagal mengekstrak ID dari URL.' }, { status: 400 });
    }
    
    const user = await authenticateUser(request);

    if (!['ADMIN', 'UNIT'].includes(user.role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    if (user.role === 'UNIT') {
      const wasteType = await db.wasteType.findUnique({ where: { id } });
      if (!wasteType || wasteType.unitId !== user.unitId) {
        return NextResponse.json({ error: 'Anda tidak berhak menghapus jenis sampah ini' }, { status: 403 });
      }
    }

    await db.wasteType.delete({ where: { id } });

    return NextResponse.json({ message: 'Jenis sampah berhasil dihapus' });

  } catch (error: any) {
    console.error('Delete waste type error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
