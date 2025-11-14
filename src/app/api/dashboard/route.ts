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
    const user = await authenticateUser(request)
    
    let data: any = {}

    if (user.role === 'ADMIN') {
      const totalUnits = await db.unit.count()
      const totalNasabah = await db.nasabah.count()
      const totalTransactions = await db.transaction.count()
      const totalDepositAmount = await db.transaction.aggregate({
        where: { type: 'DEPOSIT' },
        _sum: { totalAmount: true }
      })
      const totalWithdrawalAmount = await db.transaction.aggregate({
        where: { type: 'WITHDRAWAL', status: 'SUCCESS' },
        _sum: { totalAmount: true }
      })
      const totalActiveBalance = await db.nasabah.aggregate({
        _sum: { balance: true }
      })
      const totalWasteCollected = await db.nasabah.aggregate({
        _sum: { totalWeight: true }
      })

      const topNasabah = await db.nasabah.findMany({
        take: 10,
        orderBy: { totalWeight: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              phone: true
            }
          }
        }
      })

      const recentTransactions = await db.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          nasabah: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          unit: {
            select: {
              name: true
            }
          }
        }
      })

      data = {
        totalUnits,
        totalNasabah,
        totalTransactions,
        totalDepositAmount: totalDepositAmount._sum.totalAmount || 0,
        totalWithdrawalAmount: totalWithdrawalAmount._sum.totalAmount || 0,
        totalActiveBalance: totalActiveBalance._sum.balance || 0,
        totalWasteCollected: totalWasteCollected._sum.totalWeight || 0,
        topNasabah,
        recentTransactions
      }
    } else if (user.role === 'UNIT') {
      const unitId = user.unit!.id
      
      const totalNasabah = await db.nasabah.count({
        where: {
          user: {
            unitId
          }
        }
      })
      
      const totalTransactions = await db.transaction.count({
        where: { unitId }
      })
      
      const totalDepositAmount = await db.transaction.aggregate({
        where: { unitId, type: 'DEPOSIT' },
        _sum: { totalAmount: true }
      })
      
      const totalWithdrawalAmount = await db.transaction.aggregate({
        where: { unitId, type: 'WITHDRAWAL', status: 'SUCCESS' },
        _sum: { totalAmount: true }
      })
      
      const totalActiveBalance = await db.nasabah.aggregate({
        where: {
          user: {
            unitId
          }
        },
        _sum: { balance: true }
      })
      
      const totalWasteCollected = await db.nasabah.aggregate({
        where: {
          user: {
            unitId
          }
        },
        _sum: { totalWeight: true }
      })

      const topNasabah = await db.nasabah.findMany({
        where: {
          user: {
            unitId
          }
        },
        take: 10,
        orderBy: { totalWeight: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              phone: true
            }
          }
        }
      })

      const recentTransactions = await db.transaction.findMany({
        where: { unitId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          nasabah: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      data = {
        totalNasabah,
        totalTransactions,
        totalDepositAmount: totalDepositAmount._sum.totalAmount || 0,
        totalWithdrawalAmount: totalWithdrawalAmount._sum.totalAmount || 0,
        totalActiveBalance: totalActiveBalance._sum.balance || 0,
        totalWasteCollected: totalWasteCollected._sum.totalWeight || 0,
        topNasabah,
        recentTransactions
      }
    } else if (user.role === 'NASABAH') {
      const nasabah = await db.nasabah.findUnique({
        where: { userId: user.id }
      })

      if (!nasabah) {
        return NextResponse.json(
          { error: 'Data nasabah tidak ditemukan' },
          { status: 404 }
        )
      }

      const transactions = await db.transaction.findMany({
        where: { nasabahId: nasabah.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          unit: {
            select: {
              name: true
            }
          },
          items: {
            include: {
              wasteType: true
            }
          }
        }
      })

      const totalDeposits = await db.transaction.count({
        where: { nasabahId: nasabah.id, type: 'DEPOSIT' }
      })

      const totalWithdrawals = await db.transaction.count({
        where: { nasabahId: nasabah.id, type: 'WITHDRAWAL' }
      })

      data = {
        balance: nasabah.balance,
        totalWeight: nasabah.totalWeight,
        depositCount: nasabah.depositCount,
        totalDeposits,
        totalWithdrawals,
        recentTransactions: transactions
      }
    }

    return NextResponse.json({ data })

  } catch (error: any) {
    console.error('Get dashboard error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    )
  }
}