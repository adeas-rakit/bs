import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import qrcode from 'qrcode'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, role, unitId } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, dan nama diperlukan' },
        { status: 400 }
      )
    }

    if (role === 'NASABAH' && !unitId) {
        return NextResponse.json(
            { error: 'ID Unit diperlukan untuk mendaftarkan nasabah' },
            { status: 400 }
        );
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

    let qrCode = null
    let accountNo = null

    if (role === 'NASABAH') {
      accountNo = 'NSB' + Date.now().toString().slice(-8)
      qrCode = await qrcode.toDataURL(accountNo)
    }

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: role || 'NASABAH',
        qrCode,
        unitId: role === 'NASABAH' ? unitId : null,
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
          unit: {
            connect: { id: unitId }
          }
        }
      })

      user.nasabah = await db.nasabah.findUnique({
        where: { userId: user.id }
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

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Registrasi berhasil',
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
