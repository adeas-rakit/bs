export interface DashboardData {
  totalNasabah: number;
  totalTransactions: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  totalActiveBalance: number;
  totalWasteCollected: number;
  topNasabah: {
    byUnit: any[];
  };
  recentTransactions: any[];
}
