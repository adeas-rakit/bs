
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { WithdrawalRequestForm } from './WithdrawalRequestForm';
import { ArrowDownRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface DashboardStatsProps {
  overall: Stats;
  byUnit: { [key: string]: Stats & { unitName: string } };
  units: { id: string; name: string }[];
  depositCount: number;
  nasabahUnitBalances: NasabahUnitBalance[];
  handleWithdrawalRequest: (amount: number, unitId: string) => Promise<void>;
}

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function DashboardStats({ 
  overall,
  byUnit,
  units,
  depositCount,
  nasabahUnitBalances,
  handleWithdrawalRequest 
}: DashboardStatsProps) {
  const [selectedUnit, setSelectedUnit] = useState('overall');

  // Determine which stats to display based on the filter
  const displayStats = selectedUnit === 'overall' || !byUnit[selectedUnit] ? overall : byUnit[selectedUnit];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Select onValueChange={setSelectedUnit} defaultValue="overall">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">Keseluruhan</SelectItem>
            {units.map(unit => (
              <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-lg h-full">
            <CardHeader><CardTitle>Saldo Aktif</CardTitle></CardHeader>
            <CardContent>
              <p className="text-4xl font-bold mb-4">{formatCurrency(displayStats.balance)}</p>
              <WithdrawalRequestForm nasabahUnitBalances={nasabahUnitBalances} onSubmit={handleWithdrawalRequest} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sampah</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatWeight(displayStats.totalWeight)}</p>
              {selectedUnit === 'overall' && 
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
              <div className="text-2xl font-bold">{formatCurrency(displayStats.totalWithdrawals)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
