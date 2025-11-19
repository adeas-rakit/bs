'use client';
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
import { UserHeader } from '@/components/ui/user-header';
import { DashboardData } from '@/types';

interface UnitOverviewProps {
  user: any;
  dashboardData: DashboardData;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};

const UnitOverview = ({ user, dashboardData }: UnitOverviewProps) => {

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <UserHeader user={user} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Nasabah"
          value={dashboardData.totalNasabah}
          icon={Users}
          tooltipText="Jumlah nasabah yang terdaftar di unit Anda atau pernah bertransaksi di sini."
        />
        <StatCard
          title="Total Transaksi"
          value={dashboardData.totalTransactions}
          icon={TrendingUp}
          tooltipText="Jumlah seluruh transaksi (setoran dan penarikan) di unit Anda."
        />
        <StatCard
          title="Total Sampah"
          value={formatWeight(dashboardData.totalWasteCollected)}
          icon={Scale}
          tooltipText="Total berat sampah yang telah disetorkan nasabah ke unit Anda."
        />
        <StatCard
          title="Total Setoran"
          value={formatCurrency(dashboardData.totalDepositAmount)}
          icon={ArrowUpRight}
          color="text-green-600"
          tooltipText="Total nominal dari semua setoran sampah di unit Anda."
        />
        <StatCard
          title="Total Penarikan"
          value={formatCurrency(dashboardData.totalWithdrawalAmount)}
          icon={ArrowDownRight}
          color="text-red-600"
          tooltipText="Total nominal dari semua penarikan saldo yang berhasil di unit Anda."
        />
        <StatCard
          title="Saldo di Unit"
          value={formatCurrency(dashboardData.totalActiveBalance)}
          icon={DollarSign}
          color="text-indigo-600"
          tooltipText="Total saldo gabungan semua nasabah yang tersimpan di unit Anda."
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <InfoListCard title="Nasabah Teratas di Unit Ini">
          {dashboardData.topNasabah.byUnit.map((n: any, i: number) => (
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
