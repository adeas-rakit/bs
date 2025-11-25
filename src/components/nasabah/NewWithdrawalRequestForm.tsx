'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ArrowRight, Check, X, History, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

interface UnitBalance {
  unitId: string;
  unitName: string;
  balance: number;
  minWithdrawal: number;
}

interface NewWithdrawalRequestFormProps {
    nasabahUnitBalances: UnitBalance[];
    onSubmit: (amount: number, unitId: string) => Promise<void>;
    isOverall: boolean;
    onSwitchToWithdrawals: () => void;
}

// Helper to format number input
const formatNumberInput = (value: string): string => {
    const number = parseInt(value.replace(/\D/g, ''), 10);
    return isNaN(number) ? '' : number.toLocaleString('id-ID');
};

const unformatNumberInput = (value: string): string => {
    return value.replace(/[. ,]/g, '');
};

export function NewWithdrawalRequestForm({ nasabahUnitBalances = [], onSubmit, isOverall, onSwitchToWithdrawals }: NewWithdrawalRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(isOverall ? 1 : 2);
  const [amount, setAmount] = useState(''); // Raw numeric string
  const [displayAmount, setDisplayAmount] = useState(''); // Formatted string for display
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (nasabahUnitBalances.length > 0 && !selectedUnitId) {
      setSelectedUnitId(nasabahUnitBalances[0].unitId);
    }
     if (!isOverall && nasabahUnitBalances.length === 1) {
      setStep(2);
      setSelectedUnitId(nasabahUnitBalances[0].unitId)
    }
  }, [nasabahUnitBalances, selectedUnitId, isOverall]);

  const selectedUnit = nasabahUnitBalances.find((u) => u.unitId === selectedUnitId);
  
  const validationError = useMemo(() => {
    if (!selectedUnit) return null;
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return null; 
    }
    if (withdrawalAmount > selectedUnit.balance) {
        return "Jumlah melebihi saldo Anda";
    }
    if (withdrawalAmount < selectedUnit.minWithdrawal) {
        return `Jumlah penarikan minimal adalah ${formatCurrency(selectedUnit.minWithdrawal)}.`;
    }
    return null;
  }, [amount, selectedUnit]);

  const isSubmitDisabled = isLoading || !amount || parseFloat(amount) <= 0 || !!validationError;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = unformatNumberInput(e.target.value);
      if (/^\d*$/.test(rawValue)) { // only allow digits
          setAmount(rawValue);
          setDisplayAmount(formatNumberInput(rawValue));
      }
  };

  const setWithdrawalAmount = (newAmount: string | number) => {
      const amountStr = String(newAmount);
      setAmount(amountStr);
      setDisplayAmount(formatNumberInput(amountStr));
  }

  const handleRequest = async () => {
    if (!selectedUnit || isSubmitDisabled) return;
    setIsLoading(true);
    setServerError(null);
    const loadingToast = toast.loading("Mengajukan permintaan penarikan...");
    try {
      const withdrawalAmount = parseFloat(amount);
      if (validationError) throw new Error(validationError);

      await onSubmit(withdrawalAmount, selectedUnit.unitId);
      toast.success("Permintaan penarikan berhasil diajukan.", { id: loadingToast });
      setStep(3);
    } catch (error: any) {
      setServerError(error.message || "Terjadi kesalahan yang tidak diketahui.");
      toast.error(error.message || "Terjadi kesalahan yang tidak diketahui.", { id: loadingToast });
      setStep(4);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (andClose: boolean = true) => {
      setStep(isOverall && nasabahUnitBalances.length > 1 ? 1 : 2);
      setAmount('');
      setDisplayAmount('');
      setServerError(null);
      if(andClose) setOpen(false);
  }

  const handleSwitchToWithdrawals = () => {
    resetForm();
    onSwitchToWithdrawals();
  }

  const quickAmounts = [10000, 20000, 50000, 100000, 200000];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, scale: 0.8 }}  animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Pilih Unit Penarikan</h2>
              <p className="text-muted-foreground mb-6">Pilih dari unit mana Anda ingin menarik saldo.</p>
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {nasabahUnitBalances.map(unit => (
                  <Button key={unit.unitId} variant={selectedUnitId === unit.unitId ? 'default' : 'outline'} onClick={() => setSelectedUnitId(unit.unitId)} className="flex-grow h-16 min-w-[140px] flex flex-col items-center justify-center gap-1 py-2">
                    <span className='text-base font-semibold'>{unit.unitName}</span>
                    <b className='text-sm font-bold'>{formatCurrency(unit.balance || 0)}</b>
                  </Button>
                ))}
              </div>
              <Button onClick={() => setStep(2)} disabled={!selectedUnit} className="w-full">Lanjut <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </motion.div>
        );
      case 2:
        if (!selectedUnit) {
          return (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="text-center">
              <p className="text-muted-foreground">Unit tidak ditemukan atau belum dipilih.</p>
               {isOverall && <Button variant="outline" onClick={() => setStep(1)} className="w-full mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Button>}
            </motion.div>
          );
        }
        return (
          <motion.div initial={{ opacity: 0, scale: 0.8 }}  animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">Isi Nominal Penarikan</h2>
              <p className="text-muted-foreground mb-4">Saldo Anda di {selectedUnit.unitName}: <span className="font-bold text-primary">{formatCurrency(selectedUnit.balance || 0)}</span></p>
              
              <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-2xl">Rp</span>
                  <input id="amount" type="text" inputMode="numeric" value={displayAmount} onChange={handleAmountChange} placeholder="0" className="w-full text-center text-5xl font-bold bg-transparent border-b focus:ring-0 focus:border-primary transition-colors rounded-lg" />
              </div>

              <div className="h-6 text-center mb-2">
                {validationError && (
                    <p className="text-red-500 text-sm font-medium">{validationError}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {quickAmounts.map(qAmount => (
                    <Button disabled={selectedUnit.balance < qAmount || selectedUnit.minWithdrawal > qAmount} key={qAmount} variant="outline" size="sm" onClick={() => setWithdrawalAmount(qAmount)}>{formatCurrency(qAmount).replace(',00','').slice(2,-3)}rb</Button>
                ))}
                 <Button variant="outline" size="sm" onClick={() => setWithdrawalAmount(selectedUnit.balance || 0)}>Tarik Semua</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {(isOverall && nasabahUnitBalances.length > 1) && <Button variant="outline" onClick={() => setStep(1)} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Button>}
                <Button onClick={handleRequest} disabled={isSubmitDisabled} className={`w-full ${(isOverall && nasabahUnitBalances.length > 1)?'':'col-span-2'}`}>{isLoading ? <Loader2 className="animate-spin"/> : 'Kirim Permintaan'}</Button>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, scale: 0.8 }}  animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Permintaan Terkirim</h2>
            <p className="text-muted-foreground mb-6">Permintaan penarikan Anda telah berhasil diajukan dan akan segera diproses.</p>
            <Button onClick={() => resetForm()} className="w-full">Selesai</Button>
          </motion.div>
        );
    case 4:
        return (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Permintaan Gagal</h2>
            <p className="text-muted-foreground mb-6">{serverError}</p>
            <div className="grid grid-cols-2 gap-4">
                 <Button variant="outline" onClick={handleSwitchToWithdrawals} className="w-full"><History className="mr-2 h-4 w-4" />Riwayat</Button>
                <Button onClick={() => resetForm(false)} className="w-full">Coba Lagi</Button>
            </div>
            </motion.div>
        );
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if(!isOpen) { resetForm() } else { setOpen(true) }}}>
      <DialogTrigger asChild>
        <Button><Wallet className="mr-2 h-4 w-4"/>Tarik Saldo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-8">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
