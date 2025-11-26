'use client'

import { useState } from 'react'
import { 
  Users,
  Home,
  UserPlus,
  Settings,
  DollarSign,
  BookText,
  Bell,
  Trash2
} from 'lucide-react'
import NasabahManagement from '@/components/unit/NasabahManagement'
import DepositForm from '@/components/unit/DepositForm'
import UnitOverview from '@/components/unit/UnitOverview'
import AccountSettings from '@/components/unit/AccountSettings'
import WithdrawalManagement from '@/components/unit/WithdrawalManagement'
import DepositHistory from '@/components/unit/DepositHistory'
import Statement from '@/components/unit/Statement'
import NotificationHistory from '@/components/common/NotificationHistory'
import QRScannerComponent from '@/components/common/QRScanner'
import WasteTypesManagement from '@/components/unit/WasteTypesManagement'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import Sidebar from '@/components/ui/sidebar'
import BottomBar from '@/components/ui/bottom-bar'
import PullToRefresh from '@/components/ui/PullToRefresh'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardData, Nasabah, WasteType } from '@/types'
import { UnitDashboardProvider } from '@/context/UnitDashboardContext'
import { useTabContext } from '@/context/TabContext';
import { UserHeader } from '@/components/ui/user-header'
import FloatingAddButton from '@/components/ui/FloatingAddButton'

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

  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannedNasabah, setScannedNasabah] = useState<Nasabah | null>(null);
  const [isWasteTypeFormOpen, setIsWasteTypeFormOpen] = useState(false);
  const [editingWasteType, setEditingWasteType] = useState<Partial<WasteType> | null>(null)

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const navItems = [
    { name: 'Iktisar', value: 'overview', icon: Home, bgColor: 'bg-red-50', hoverBgColor: 'bg-red-600', borderColor: 'border-red-200', hoverBorderColor: 'border-red-600' },
    { name: 'Nasabah', value: 'nasabah', icon: Users, bgColor: 'bg-blue-50', hoverBgColor: 'bg-blue-600', borderColor: 'border-blue-200', hoverBorderColor: 'border-blue-600' },
    { name: 'Menabung', value: 'deposit', icon: UserPlus, bgColor: 'bg-green-50', hoverBgColor: 'bg-green-600', borderColor: 'border-green-200', hoverBorderColor: 'border-green-600' },
    { name: 'Penarikan', value: 'withdrawals', icon: DollarSign, bgColor: 'bg-purple-50', hoverBgColor: 'bg-purple-600', borderColor: 'border-purple-200', hoverBorderColor: 'border-purple-600' },
    { name: 'Jenis Sampah', value: 'waste-types', icon: Trash2, bgColor: 'bg-teal-50', hoverBgColor: 'bg-teal-600', borderColor: 'border-teal-200', hoverBorderColor: 'border-teal-600' },
    { name: 'Statement', value: 'statement', icon: BookText, bgColor: 'bg-orange-50', hoverBgColor: 'bg-orange-600', borderColor: 'border-orange-200', hoverBorderColor: 'border-orange-600' },
    { name: 'Notifikasi', value: 'notifications', icon: Bell, bgColor: 'bg-yellow-50', hoverBgColor: 'bg-yellow-600', borderColor: 'border-yellow-200', hoverBorderColor: 'border-yellow-600' },
    { name: 'Pengaturan', value: 'settings', icon: Settings, bgColor: 'bg-gray-50', hoverBgColor: 'bg-gray-600', borderColor: 'border-gray-200', hoverBorderColor: 'border-gray-600' },
  ];

  const handleRefresh = async () => {
    await refetch();
  };

  const handleScanSuccess = (nasabahData: Nasabah) => {
    setScannedNasabah(nasabahData);
    setIsQRScannerOpen(false);
    setActiveTab('deposit');
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
                        onScanClick={handleScanClick}
                        preselectedNasabah={scannedNasabah}
                        onClearNasabah={handleClearNasabah}
                      />}
                    {depositTab === 'history' && <DepositHistory key={Date.now()} newlyAddedTransactionId={newlyAddedTransactionId} />}
                </div>
            )}
            {activeTab === 'withdrawals' && <WithdrawalManagement onUpdate={refetch} />}
            {activeTab === 'waste-types' && (
              <WasteTypesManagement 
                  isFormOpen={isWasteTypeFormOpen} 
                  setIsFormOpen={setIsWasteTypeFormOpen} 
                  editingWasteType={editingWasteType} 
                  setEditingWasteType={setEditingWasteType} 
              />
            )}
            {activeTab === 'statement' && <Statement />}
            {activeTab === 'notifications' && <NotificationHistory userRole={user.role} />}
            {activeTab === 'settings' && <AccountSettings user={user} />}
            </motion.div>
        </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen flex">
      <AnimatePresence>
        {isQRScannerOpen && (
          <QRScannerComponent 
            onScanSuccess={handleScanSuccess} 
            onClose={handleScannerClose} 
          />
        )}
      </AnimatePresence>

      <Sidebar user={user} navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 h-screen overflow-y-auto">
        <PullToRefresh onRefresh={handleRefresh} loading={loading} activeTab={activeTab}>
            <div className="p-4 sm:p-6 lg:p-8 pb-40 lg:pb-8">
              <UserHeader user={user} />
                {renderContent()}
                {activeTab === 'waste-types' && (
                    <FloatingAddButton 
                        className='bottom-32 h-10 w-10' 
                        onClick={() => {
                            setEditingWasteType(null); // Clear editing state
                            setIsWasteTypeFormOpen(true);
                        }} 
                    />
                )}
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
