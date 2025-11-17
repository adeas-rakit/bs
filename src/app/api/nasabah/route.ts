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

export async function GET(request: NextRequest) {
  try {
    await authenticateUser(request)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let where: any = {}

    if (status) {
      where.user = {
        ...where.user,
        status: status
      }
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { accountNo: { contains: search } },
        { user: { phone: { contains: search } } }
      ]
    }

    const nasabah = await db.nasabah.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
            unitId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ nasabah })

  } catch (error: any) {
    console.error('Get nasabah error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    
    if (user.role !== 'ADMIN' && user.role !== 'UNIT') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { id, name, phone, status, unitId } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID nasabah diperlukan' }, { status: 400 })
    }

    if (unitId) {
        const unitExists = await db.unit.findUnique({ where: { id: unitId } });
        if (!unitExists) {
            return NextResponse.json({ error: 'Unit tidak ditemukan' }, { status: 404 });
        }
    }

    const nasabah = await db.nasabah.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!nasabah) {
      return NextResponse.json({ error: 'Nasabah tidak ditemukan' }, { status: 404 })
    }

    const userDataToUpdate: { name?: string; phone?: string; status?: string; unitId?: string } = {};
    if (name) userDataToUpdate.name = name;
    if (phone) userDataToUpdate.phone = phone;
    if (status) userDataToUpdate.status = status;
    if (unitId) userDataToUpdate.unitId = unitId; 

    await db.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: nasabah.userId },
            data: userDataToUpdate,
        });

        if (unitId) {
            await tx.nasabah.update({
                where: { id: nasabah.id },
                data: { unitId },
            });
        }
    });

    return NextResponse.json({ message: 'Nasabah berhasil diperbarui' })

  } catch (error: any) {
    console.error('Update nasabah error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}
