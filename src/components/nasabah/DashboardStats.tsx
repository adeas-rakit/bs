'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { ArrowDownRight } from 'lucide-react';
import { BalanceCard } from './BalanceCard';

// Prop interfaces
interface NasabahUnitBalance {
  unitId: string;
  unitName: string;
  balance: number;
}

interface Stats {
  balance: number;
  totalWeight: number;
  totalWithdrawals: number;
}

interface WithdrawalRequest {
    id: string;
    unitId: string;
    status: string;
}

interface DashboardStatsProps {
  overall: Stats;
  byUnit: { [key: string]: Stats & { unitName: string } };
  units: { id: string; name: string; }[];
  depositCount: number;
  nasabahUnitBalances: NasabahUnitBalance[];
  handleWithdrawalRequest: (amount: number, unitId: string) => Promise<void>;
  withdrawalRequests: WithdrawalRequest[];
  onSwitchToWithdrawals: () => void;
}

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const colors = [
  "from-green-500 to-teal-500",
  "from-blue-500 to-indigo-500",
  "from-purple-500 to-pink-500",
  "from-red-500 to-orange-500",
  "from-yellow-500 to-lime-500",
];

const generateColor = (index: number) => colors[index % colors.length];

export default function DashboardStats({
  overall,
  byUnit,
  depositCount,
  nasabahUnitBalances,
  handleWithdrawalRequest,
  withdrawalRequests = [],
  onSwitchToWithdrawals,
}: DashboardStatsProps) {
  const allBalances = [{ unitId: 'overall', unitName: 'Keseluruhan', balance: overall.balance }, ...nasabahUnitBalances];
  const [activeIndex, setActiveIndex] = useState(0);

  const handleCardSwipe = () => {
    setActiveIndex((prev) => (prev + 1) % allBalances.length);
  };

  const selectedUnitId = allBalances[activeIndex]?.unitId || 'overall';
  const statsToDisplay = selectedUnitId === 'overall' ? overall : byUnit?.[selectedUnitId] || { balance: 0, totalWeight: 0, totalWithdrawals: 0 };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="h-64 flex flex-col justify-center items-center relative">
          <div className="relative w-full h-full flex justify-center sm:justify-start items-center">
            {allBalances.map((item, index) => {
              const stackPosition = (index - activeIndex + allBalances.length) % allBalances.length;
              if (stackPosition > 2) return null; // Only render top 3 cards

              const hasPendingWithdrawal = withdrawalRequests.some(
                  (req) => req.unitId === item.unitId && req.status === 'PENDING'
              );

              return (
                <motion.div
                  key={item.unitId}
                  animate={{
                    scale: 1 - stackPosition * 0.05,
                    y: -20 * stackPosition,
                    zIndex: allBalances.length - stackPosition,
                    opacity: stackPosition > 2 ? 0 : 1,
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  drag={stackPosition === 0 ? "y" : false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  onDragEnd={(event, { offset, velocity }) => {
                    if (stackPosition === 0 && (offset.y < -80 || velocity.y < -500)) {
                      handleCardSwipe();
                    }
                  }}
                  className={`absolute w-full max-w-lg h-56 bg-gradient-to-br ${generateColor(index)} rounded-2xl shadow-xl`}
                >
                  <BalanceCard
                    key={item.unitId} // Add key to ensure re-render
                    unitId={item.unitId}
                    unitName={item.unitName}
                    balance={item.balance}
                    isOverall={item.unitId === 'overall'}
                    nasabahUnitBalances={nasabahUnitBalances}
                    onWithdrawalRequest={(amount, unitId) => handleWithdrawalRequest(amount, unitId || item.unitId)}
                    onSwitchToWithdrawals={onSwitchToWithdrawals}
                    color="bg-transparent"
                    isActive={stackPosition === 0} // Pass isActive prop
                    hasPendingWithdrawal={hasPendingWithdrawal}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sampah</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatWeight(statsToDisplay.totalWeight)}</p>
              {selectedUnitId === 'overall' && 
                <p className="text-xs text-muted-foreground">dari {depositCount} kali menabung</p>
              }
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Penarikan</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statsToDisplay.totalWithdrawals)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
