
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Archive
} from 'lucide-react'
import { InfoCard } from '@/components/ui/InfoCard'
import { Badge } from '@/components/ui/badge'
import StatCard from './StatCard';
import { formatCurrency, formatWeight } from '@/lib/utils'
import { UserHeader } from '@/components/ui/user-header';

interface DashboardData {
  totalUnits: number
  totalNasabah: number
  totalTransactions: number
  totalDepositAmount: number
  totalWithdrawalAmount: number
  totalActiveBalance: number
  totalWasteCollected: number
  topNasabah: any[]
  recentTransactions: any[]
}

interface OverviewProps {
    user: any;
    dashboardData: DashboardData;
}

const Overview = ({ user, dashboardData }: OverviewProps) => {
    return (
        <div className="space-y-4">
            <UserHeader user={user} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard title="Saldo Aktif Nasabah" value={formatCurrency(dashboardData.totalActiveBalance)} icon={DollarSign} />
                <StatCard title="Total Pemasukan" value={formatCurrency(dashboardData.totalDepositAmount)} icon={ArrowUpRight} />
                <StatCard title="Total Penarikan" value={formatCurrency(dashboardData.totalWithdrawalAmount)} icon={ArrowDownRight} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <InfoCard
                    id="top-nasabah"
                    title="Nasabah Teratas"
                    subtitle={`${dashboardData.topNasabah.length} Nasabah`}
                    icon={<Users/>}
                    isCollapsible={true}
                    initialInfo={
                        <div className="text-sm text-gray-500">Nasabah dengan total deposit sampah terberat.</div>
                    }
                    expandedInfo={
                        <div className="space-y-2 pt-2 pr-2 max-h-52 overflow-y-auto">
                            {dashboardData.topNasabah.map((n, i) => (
                                <div key={n.id} className="flex items-center p-2 rounded-lg">
                                    <div className="font-bold mr-3 text-gray-400">#{i+1}</div>
                                    <div className="flex-grow">
                                        <p className="font-semibold  text-foreground text-sm">{n.user.name}</p>
                                        <p className="text-xs text-muted-foreground">Total: {formatWeight(n.totalWeight)} ({n.depositCount}x)</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                />
                <InfoCard
                    id="recent-transactions"
                    title="Aktivitas Terkini"
                    subtitle={`${dashboardData.recentTransactions.length} Transaksi`}
                    icon={<TrendingUp/>}
                    isCollapsible={true}
                    initialInfo={
                        <div className="text-sm text-gray-500">Transaksi terbaru di semua unit.</div>
                    }
                    expandedInfo={
                        <div className="space-y-2 pt-2 pr-2 max-h-52 overflow-y-auto">
                            {dashboardData.recentTransactions.map(t => (
                                <div key={t.id} className="flex items-center p-2 rounded-lg">
                                    <div className="flex-grow">
                                        <p className="font-semibold  text-foreground text-xs">{t.transactionNo}</p>
                                        <p className="text-xs text-muted-foreground">{t.nasabah.user.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={t.type === 'DEPOSIT' ? 'default' : 'destructive'}>{t.type}</Badge>
                                        <p className="font-semibold text-sm mt-1">{formatCurrency(t.totalAmount)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                />
            </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="Total Unit" value={`${dashboardData.totalUnits}`} icon={Building2} />
                <StatCard title="Total Nasabah" value={`${dashboardData.totalNasabah}`} icon={Users} />
                <StatCard title="Jml. Transaksi" value={`${dashboardData.totalTransactions}`} icon={TrendingUp} />
                <StatCard title="Total Sampah" value={formatWeight(dashboardData.totalWasteCollected)} icon={Archive} />
            </div>
        </div>
    )
}

export default Overview;
