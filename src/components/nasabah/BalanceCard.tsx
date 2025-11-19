'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { NewWithdrawalRequestForm } from './NewWithdrawalRequestForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

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
      className={` h-full justify-between text-white shadow-lg h-full transition-all duration-300 ${color || defaultColor}`}
    >
      <CardHeader>
        <CardTitle>{isOverall ? "Saldo Aktif" : `${unitName}`}</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-4xl font-bold mb-4">{formatCurrency(balance)}</p>
        <div style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.3s' }}>
        {showWithdrawalForm && (
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
        )}
        </div>
      </CardContent>
    </Card>
  );
}
