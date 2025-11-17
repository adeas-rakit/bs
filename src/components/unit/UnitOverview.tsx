
'use client';

import { useState } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from './StatCard';
import InfoListCard from './InfoListCard';
import TopNasabahItem from './TopNasabahItem';
import RecentTransactionItem from './RecentTransactionItem';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DashboardData {
  totalNasabah: number;
  totalTransactions: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  totalActiveBalance: number;
  totalWasteCollected: number;
  topNasabah: {
    byUnit: any[];
    overall: any[];
  };
  recentTransactions: any[];
}

interface UnitOverviewProps {
  user: any;
  dashboardData: DashboardData;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};

const UnitOverview = ({ user, dashboardData }: UnitOverviewProps) => {
  const [topNasabahType, setTopNasabahType] = useState<'byUnit' | 'overall'>(
    'byUnit',
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard Unit {user.unit?.name}
        </h1>
        <p className="text-gray-500">Manajemen operasional unit Anda.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Nasabah"
          value={dashboardData.totalNasabah}
          icon={Users}
        />
        <StatCard
          title="Transaksi"
          value={dashboardData.totalTransactions}
          icon={TrendingUp}
        />
        <StatCard
          title="Sampah"
          value={formatWeight(dashboardData.totalWasteCollected)}
          icon={Scale}
        />
        <StatCard
          title="Pemasukan"
          value={formatCurrency(dashboardData.totalDepositAmount)}
          icon={ArrowUpRight}
          color="text-green-600"
        />
        <StatCard
          title="Penarikan"
          value={formatCurrency(dashboardData.totalWithdrawalAmount)}
          icon={ArrowDownRight}
          color="text-red-600"
        />
        <StatCard
          title="Saldo Aktif"
          value={formatCurrency(dashboardData.totalActiveBalance)}
          icon={DollarSign}
          color="text-indigo-600"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <InfoListCard title="Nasabah Teratas">
          <div className="flex justify-end mb-4">
            <Button
              variant={topNasabahType === 'byUnit' ? 'default' : 'outline'}
              onClick={() => setTopNasabahType('byUnit')}
              className="mr-2"
            >
              By Unit
            </Button>
            <Button
              variant={topNasabahType === 'overall' ? 'default' : 'outline'}
              onClick={() => setTopNasabahType('overall')}
            >
              Overall
            </Button>
          </div>
          {dashboardData.topNasabah[topNasabahType].map((n: any, i: number) => (
            <TopNasabahItem key={n.id} nasabah={n} index={i} />
          ))}
        </InfoListCard>
        <InfoListCard title="Aktivitas Terkini">
          {dashboardData.recentTransactions.map((t) => (
            <RecentTransactionItem key={t.id} transaction={t} />
          ))}
        </InfoListCard>
      </div>
    </motion.div>
  );
};

export default UnitOverview;
