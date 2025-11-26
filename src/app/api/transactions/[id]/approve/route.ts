import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return request.cookies.get('token')?.value
}

async function authenticateUser(request: NextRequest) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in the environment variables');
    throw new Error('Konfigurasi server tidak lengkap');
  }
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    
    if (user.role !== 'UNIT') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const transaction = await db.transaction.findUnique({
      where: { id: params.id },
      include: { nasabah: true }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (transaction.type !== 'WITHDRAWAL') {
      return NextResponse.json(
        { error: 'Hanya transaksi penarikan yang bisa disetujui' },
        { status: 400 }
      )
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Transaksi sudah diproses' },
        { status: 400 }
      )
    }

    if (transaction.unitId !== user.unit?.id) {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      )
    }

    if (transaction.nasabah.balance < transaction.totalAmount) {
      return NextResponse.json(
        { error: 'Saldo nasabah tidak mencukupi' },
        { status: 400 }
      )
    }

    await db.transaction.update({
      where: { id: params.id },
      data: { status: 'SUCCESS' }
    })

    await db.nasabah.update({
      where: { id: transaction.nasabahId },
      data: {
        balance: transaction.nasabah.balance - transaction.totalAmount
      }
    })

    return NextResponse.json({
      message: 'Transaksi penarikan berhasil disetujui'
    })

  } catch (error: any) {
    console.error('Approve transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}