'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { NewWithdrawalRequestForm } from './NewWithdrawalRequestForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react'; 
import { CardChip } from './CardChip';
import { CardWireless } from './CardWireless';

interface BalanceCardProps {
  unitId: string;
  unitName: string;
  balance: number;
  isOverall?: boolean;
  nasabahUnitBalances: { unitId: string; unitName: string; balance: number; }[];
  onWithdrawalRequest: (amount: number, unitId: string) => Promise<void>;
  onSwitchToWithdrawals: () => void;
  color?: string;
  isActive?: boolean;
  hasPendingWithdrawal: boolean;
}

export function BalanceCard({ 
    unitName, 
    balance, 
    isOverall = false, 
    nasabahUnitBalances, 
    onWithdrawalRequest, 
    onSwitchToWithdrawals,
    color, 
    isActive, 
    hasPendingWithdrawal,
    unitId,
}: BalanceCardProps) {
  const defaultColor = "bg-gradient-to-br from-green-500 to-teal-500";
  const showWithdrawalForm = !isOverall || (isActive && nasabahUnitBalances.length > 0);

  return (
    <Card 
      className={`relative overflow-hidden h-full text-white shadow-lg transition-all duration-300 ${color || defaultColor}`}
    >
      {/* Background Ornament */}
      <div className="absolute inset-0 z-0 opacity-60">
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="absolute top-5 left-6 z-10">
        <CardChip />
      </div>
      <div className="absolute top-5 right-6 z-10">
        <CardWireless />
      </div>
      
      <CardHeader className="pt-14 pb-2 relative z-10">
        <CardTitle>{isOverall ? "Saldo Aktif" : `${unitName}`}</CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <p className="text-4xl font-bold mb-2">{formatCurrency(balance)}</p>
        <div style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.3s' }}>
        {balance > 0 ? (
            showWithdrawalForm && (
              hasPendingWithdrawal ? (
                <Alert variant="destructive" className="bg-yellow-500 bg-opacity-30 border-0 text-white">
                    <Info className="h-4 w-4 !text-white"/>
                  <AlertDescription>
                    Anda sudah punya 1 permintaan penarikan di unit ini. 
                  </AlertDescription>
                </Alert>
              ) : (
                <NewWithdrawalRequestForm 
                    onSubmit={onWithdrawalRequest} 
                    nasabahUnitBalances={isOverall ? nasabahUnitBalances : [{unitId, unitName, balance}]} 
                    isOverall={isOverall}
                    onSwitchToWithdrawals={onSwitchToWithdrawals}
                />
              )
            )
        ) : (
            <div className="text-left"> 
                <p className="font-semibold">Yuk, mulai menabung sampah lagi!</p> 
            </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
