
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

export async function POST(request: NextRequest) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in the environment variables');
    return NextResponse.json(
      { error: 'Konfigurasi server tidak lengkap' },
      { status: 500 }
    );
  }
  try {
    const { email, password, name, phone, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, dan nama diperlukan' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    let qrCode = ""
    let accountNo = ""

    if (role === 'NASABAH') {
      accountNo = 'NSB' + Date.now().toString().slice(-8) + Math.random().toString().slice(-2)
      qrCode = accountNo
    }

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: role || 'NASABAH',
        status: role === 'UNIT' ? 'DITANGGUHKAN' : 'AKTIF',
        qrCode,
        unitId: null,
      },
      include: {
        unit: true,
        nasabah: true
      }
    })

    if (role === 'NASABAH') {
      await db.nasabah.create({
        data: {
          accountNo: accountNo!,
          user: {
            connect: { id: user.id }
          },
          createdBy: { 
            connect: { id: user.id } 
          }
        }
      })

      user.nasabah = await db.nasabah.findUnique({
        where: { userId: user.id },
        include: { unit: true }
      })
    }

    const { password: _, ...userWithoutPassword } = user

    if (user.role === 'UNIT') {
      return NextResponse.json({
        message: 'Registrasi unit berhasil. Akun Anda perlu diverifikasi oleh Admin sebelum dapat digunakan.',
        user: userWithoutPassword,
      })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      message: 'Registrasi berhasil. Akun Anda akan dihubungkan dengan Unit Bank Sampah saat transaksi pertama.',
      user: userWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
