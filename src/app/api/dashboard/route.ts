import { db } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Function to authenticate user from token
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

// Function to calculate nasabah balance in real-time
async function getNasabahBalance(nasabahId: string, unitId?: string) {
  const whereClause: any = { nasabahId };
  if (unitId) {
    whereClause.unitId = unitId;
  }

  const deposits = await db.transaction.aggregate({
    where: { ...whereClause, type: 'DEPOSIT' },
    _sum: { totalAmount: true },
  });

  const withdrawals = await db.transaction.aggregate({
    where: { ...whereClause, type: 'WITHDRAWAL', status: 'SUCCESS' },
    _sum: { totalAmount: true },
  });

  return (deposits._sum.totalAmount || 0) - (withdrawals._sum.totalAmount || 0);
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);

    let data: any = {};

    if (user.role === 'ADMIN') {
      const totalUnits = await db.unit.count();
      const totalNasabah = await db.nasabah.count();
      const totalTransactions = await db.transaction.count();

      const totalDepositAmountAgg = await db.transaction.aggregate({
        where: { type: 'DEPOSIT' },
        _sum: { totalAmount: true },
      });

      const totalWithdrawalAmountAgg = await db.transaction.aggregate({
        where: { type: 'WITHDRAWAL', status: 'SUCCESS' },
        _sum: { totalAmount: true },
      });

      const totalDepositAmount = totalDepositAmountAgg._sum.totalAmount || 0;
      const totalWithdrawalAmount = totalWithdrawalAmountAgg._sum.totalAmount || 0;

      const totalActiveBalance = totalDepositAmount - totalWithdrawalAmount;

      const totalWasteCollected = await db.nasabah.aggregate({
        _sum: { totalWeight: true },
      });

      const topNasabah = await db.nasabah.findMany({
        take: 10,
        orderBy: { totalWeight: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      });

      const recentTransactions = await db.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          nasabah: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          unit: {
            select: {
              name: true,
            },
          },
        },
      });

      data = {
        totalUnits,
        totalNasabah,
        totalTransactions,
        totalDepositAmount,
        totalWithdrawalAmount,
        totalActiveBalance,
        totalWasteCollected: totalWasteCollected._sum.totalWeight || 0,
        topNasabah,
        recentTransactions,
      };
    } else if (user.role === 'UNIT') {
      const unitId = user.unit!.id;

      const totalNasabah = await db.nasabah.count({
        where: {
          OR: [
            { unitId: unitId },
            { transactions: { some: { unitId: unitId } } },
          ],
        },
      });
      const totalTransactions = await db.transaction.count({
        where: { unitId },
      });

      const totalDepositAmountAgg = await db.transaction.aggregate({
        where: { unitId, type: 'DEPOSIT' },
        _sum: { totalAmount: true },
      });

      const totalWithdrawalAmountAgg = await db.transaction.aggregate({
        where: { unitId, type: 'WITHDRAWAL', status: 'SUCCESS' },
        _sum: { totalAmount: true },
      });

      const totalDepositAmount = totalDepositAmountAgg._sum.totalAmount || 0;
      const totalWithdrawalAmount = totalWithdrawalAmountAgg._sum.totalAmount || 0;

      const totalActiveBalance = totalDepositAmount - totalWithdrawalAmount;

      const totalWasteCollectedAgg = await db.transactionItem.aggregate({
        _sum: { weight: true },
        where: {
            transaction: {
                unitId: unitId,
                type: 'DEPOSIT'
            }
        }
      });
      const totalWasteCollected = totalWasteCollectedAgg._sum.weight || 0;

      const unitDepositTransactions = await db.transaction.findMany({
        where: {
            unitId: unitId,
            type: 'DEPOSIT',
        },
        select: {
            nasabahId: true,
            items: {
                select: {
                    weight: true
                }
            }
        }
      });

      const nasabahWeights = new Map<string, number>();
      const nasabahDepositCounts = new Map<string, number>();
      unitDepositTransactions.forEach(tx => {
          if (tx.nasabahId) {
              const txWeight = tx.items.reduce((sum, item) => sum + item.weight, 0);
              const currentWeight = nasabahWeights.get(tx.nasabahId) || 0;
              nasabahWeights.set(tx.nasabahId, currentWeight + txWeight);

              const currentCount = nasabahDepositCounts.get(tx.nasabahId) || 0;
              nasabahDepositCounts.set(tx.nasabahId, currentCount + 1);
          }
      });
      
      const sortedNasabahByWeight = Array.from(nasabahWeights.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

      const topNasabahIds = sortedNasabahByWeight.map(entry => entry[0]);

      let topNasabahByUnit = [];
      if (topNasabahIds.length > 0) {
          const nasabahDetails = await db.nasabah.findMany({
              where: { id: { in: topNasabahIds } },
              include: {
                  user: { select: { name: true, phone: true } },
              }
          });
          
          topNasabahByUnit = nasabahDetails.map(nasabah => ({
              ...nasabah,
              totalWeight: nasabahWeights.get(nasabah.id) || 0,
              depositCount: nasabahDepositCounts.get(nasabah.id) || 0,
          })).sort((a, b) => (nasabahWeights.get(b.id) || 0) - (nasabahWeights.get(a.id) || 0));
      }

      const recentTransactions = await db.transaction.findMany({
        where: { unitId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          nasabah: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      data = {
        totalNasabah,
        totalTransactions,
        totalDepositAmount,
        totalWithdrawalAmount,
        totalActiveBalance,
        totalWasteCollected,
        topNasabah: { byUnit: topNasabahByUnit },
        recentTransactions,
      };
    } else if (user.role === 'NASABAH') {
      const nasabah = await db.nasabah.findUnique({
        where: { userId: user.id },
      });

      if (!nasabah) {
        return NextResponse.json(
          { error: 'Data nasabah tidak ditemukan' },
          { status: 404 }
        );
      }

      const memberUnits = await db.unitNasabah.findMany({
        where: { nasabahId: nasabah.id },
        select: { unitId: true }
      });
      const memberUnitIds = memberUnits.map(mu => mu.unitId);
  
      const transactionUnits = await db.transaction.groupBy({
        by: ['unitId'],
        where: { nasabahId: nasabah.id },
      });
      const transactionUnitIds = transactionUnits.map(tu => tu.unitId).filter(id => id !== null) as string[];
      
      const allUnitIds = [...new Set([...memberUnitIds, ...transactionUnitIds])];
  
      const allInteractedUnits = await db.unit.findMany({
        where: { id: { in: allUnitIds } },
        select: { id: true, name: true }
      });

      const overallBalance = await getNasabahBalance(nasabah.id);
      const overallDepositCount = await db.transaction.count({
        where: { nasabahId: nasabah.id, type: 'DEPOSIT' },
      });
      const overallTotalWeightAgg = await db.transactionItem.aggregate({
        _sum: { weight: true },
        where: { transaction: { nasabahId: nasabah.id, type: 'DEPOSIT' } },
      });

      const overallStats = {
        balance: overallBalance,
        totalWeight: overallTotalWeightAgg._sum.weight || 0,
        depositCount: overallDepositCount,
        totalWithdrawals: (
          await db.transaction.aggregate({
            where: { nasabahId: nasabah.id, type: 'WITHDRAWAL', status: 'SUCCESS' },
            _sum: { totalAmount: true },
          })
        )._sum.totalAmount || 0,
      };

      const byUnitStats: any = {};
      const nasabahUnitBalances: { unitId: string; unitName: string; balance: number; }[] = [];

      for (const unit of allInteractedUnits) {
        const unitBalance = await getNasabahBalance(nasabah.id, unit.id);
        const unitDepositCount = await db.transaction.count({
            where: { nasabahId: nasabah.id, unitId: unit.id, type: 'DEPOSIT' },
        });

        const unitWeightAgg = await db.transactionItem.aggregate({
            _sum: { weight: true },
            where: {
                transaction: { nasabahId: nasabah.id, unitId: unit.id, type: 'DEPOSIT' },
            },
        });

        const unitTotalWithdrawalsAgg = await db.transaction.aggregate({
            where: {
                nasabahId: nasabah.id,
                unitId: unit.id,
                type: 'WITHDRAWAL',
                status: 'SUCCESS',
            },
            _sum: { totalAmount: true },
        });

        const unitStats = {
            unitId: unit.id,
            unitName: unit.name,
            balance: unitBalance,
            totalWeight: unitWeightAgg._sum.weight || 0,
            depositCount: unitDepositCount,
            totalWithdrawals: unitTotalWithdrawalsAgg._sum.totalAmount || 0,
        };

        byUnitStats[unit.id] = unitStats;
        nasabahUnitBalances.push({
            unitId: unit.id,
            unitName: unit.name,
            balance: unitBalance,
        });
      }

      const recentTransactions = await db.transaction.findMany({
        where: { nasabahId: nasabah.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { unit: { select: { name: true } }, items: { include: { wasteType: true } } },
      });

      data = {
        overall: overallStats,
        byUnit: byUnitStats,
        units: allInteractedUnits,
        recentTransactions,
        nasabahUnitBalances,
      };
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: error.message.includes('Token') ? 401 : 500 }
    );
  }
}
