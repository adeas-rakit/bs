'use client'

import { useState } from 'react'
import { 
  Users,
  Home,
  UserPlus,
  Settings,
  DollarSign,
  BookText,
  Bell
} from 'lucide-react'
import NasabahManagement from '@/components/unit/NasabahManagement'
import DepositForm from '@/components/unit/DepositForm'
import UnitOverview from '@/components/unit/UnitOverview'
import AccountSettings from '@/components/unit/AccountSettings'
import WithdrawalManagement from '@/components/unit/WithdrawalManagement'
import DepositHistory from '@/components/unit/DepositHistory'
import Statement from '@/components/unit/Statement'
import NotificationHistory from '@/components/common/NotificationHistory'
import QRScannerComponent from '@/components/common/QRScanner' // Import the new QR Scanner
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import Sidebar from '@/components/ui/sidebar'
import BottomBar from '@/components/ui/bottom-bar'
import PullToRefresh from '@/components/ui/PullToRefresh'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardData, Nasabah } from '@/types' // Assuming Nasabah type is in types
import { UnitDashboardProvider } from '@/context/UnitDashboardContext'
import { useTabContext } from '@/context/TabContext';
import { UserHeader } from '@/components/ui/user-header'

interface User {
  id: string;
  name: string;
  role: 'NASABAH' | 'UNIT' | 'ADMIN';
}

const UnitDashboardSkeleton = () => (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-40 rounded-lg" />
            </div>
            <div>
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-40 rounded-lg" />
            </div>
        </div>
    </div>
);

const UnitDashboardContent = ({ user }: { user: User }) => {
  const { activeTab, setActiveTab } = useTabContext();
  const [depositTab, setDepositTab] = useState('form');
  const [newlyAddedTransactionId, setNewlyAddedTransactionId] = useState<string | null>(null);
  const { data: dashboardData, loading, refetch } = useRealtimeData<DashboardData>({endpoint: '/api/dashboard', refreshInterval: 30000});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- QR Scanner State ---
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannedNasabah, setScannedNasabah] = useState<Nasabah | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const navItems = [
    { name: 'Iktisar', value: 'overview', icon: Home },
    { name: 'Nasabah', value: 'nasabah', icon: Users },
    { name: 'Menabung', value: 'deposit', icon: UserPlus },
    { name: 'Penarikan', value: 'withdrawals', icon: DollarSign },
    { name: 'Statement', value: 'statement', icon: BookText },
    { name: 'Notifikasi', value: 'notifications', icon: Bell },
    { name: 'Pengaturan', value: 'settings', icon: Settings },
  ];

  const handleRefresh = async () => {
    await refetch();
  };

  // --- QR Scanner Handlers ---
  const handleScanSuccess = (nasabahData: Nasabah) => {
    setScannedNasabah(nasabahData);
    setIsQRScannerOpen(false);
    setActiveTab('deposit'); // Switch to deposit tab on successful scan
    setDepositTab('form');
  };

  const handleScannerClose = () => {
    setIsQRScannerOpen(false);
  };

  const handleScanClick = () => {
    setIsQRScannerOpen(true);
  };
  
  const handleClearNasabah = () => {
    setScannedNasabah(null);
  };

  const renderContent = () => {
    if (loading && !dashboardData) {
        return <UnitDashboardSkeleton />;
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
            {activeTab === 'overview' && dashboardData && (
                <UnitOverview user={user} dashboardData={dashboardData} />
            )}
            {activeTab === 'nasabah' && <NasabahManagement onUpdate={refetch} />}
            {activeTab === 'deposit' && (
                <div>
                    <div className="flex border-b mb-4">
                        <button onClick={() => {
                          setDepositTab('form');
                          setNewlyAddedTransactionId(null);
                        }} className={`px-4 py-2 text-sm font-medium ${
                            depositTab === "form"
                            ? "border-b-2 border-green-600 text-green-600"
                            : "text-gray-500"
                        }`}>
                            Setor Sampah
                        </button>
                        <button onClick={() => setDepositTab('history')} className={`px-4 py-2 text-sm font-medium ${
                            depositTab === "history"
                            ? "border-b-2 border-green-600 text-green-600"
                            : "text-gray-500"
                        }`}>
                            Riwayat
                        </button>
                    </div>
                    {depositTab === 'form' && <DepositForm 
                        onSuccess={(transactionId) => { 
                            refetch(); 
                            handleClearNasabah();
                            setNewlyAddedTransactionId(transactionId);
                            setDepositTab('history');
                        }} 
                        // Pass the new props to DepositForm
                        onScanClick={handleScanClick}
                        preselectedNasabah={scannedNasabah}
                        onClearNasabah={handleClearNasabah}
                      />}
                    {depositTab === 'history' && <DepositHistory key={Date.now()} newlyAddedTransactionId={newlyAddedTransactionId} />}
                </div>
            )}
            {activeTab === 'withdrawals' && <WithdrawalManagement onUpdate={refetch} />} 
            {activeTab === 'statement' && <Statement />}
            {activeTab === 'notifications' && <NotificationHistory userRole={user.role} />}
            {activeTab === 'settings' && <AccountSettings user={user} />}
            </motion.div>
        </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Conditionally render the QR Scanner in a fullscreen overlay */}
      <AnimatePresence>
        {isQRScannerOpen && (
          <QRScannerComponent 
            onScanSuccess={handleScanSuccess} 
            onClose={handleScannerClose} 
          />
        )}
      </AnimatePresence>

      <Sidebar user={user} navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 h-screen overflow-hidden">
        <PullToRefresh onRefresh={handleRefresh} loading={loading}>
            <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
              <UserHeader user={user} />
                {renderContent()}
            </div>
        </PullToRefresh>
      </main>
      <BottomBar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
}

export default function UnitDashboard({ user }: { user: User }) {
    return (
        <UnitDashboardProvider>
            <UnitDashboardContent user={user} />
        </UnitDashboardProvider>
    )
}
