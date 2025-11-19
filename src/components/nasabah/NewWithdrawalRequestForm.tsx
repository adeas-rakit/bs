'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ArrowRight, Check, X, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

interface UnitBalance {
  unitId: string;
  unitName: string;
  balance: number;
}

interface NewWithdrawalRequestFormProps {
    nasabahUnitBalances: UnitBalance[];
    onSubmit: (amount: number, unitId: string) => Promise<void>;
    isOverall: boolean;
    onSwitchToWithdrawals: () => void;
}

export function NewWithdrawalRequestForm({ nasabahUnitBalances = [], onSubmit, isOverall, onSwitchToWithdrawals }: NewWithdrawalRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(isOverall ? 1 : 2);
  const [amount, setAmount] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (nasabahUnitBalances.length > 0 && !selectedUnitId) {
      setSelectedUnitId(nasabahUnitBalances[0].unitId);
    }
     if (!isOverall && nasabahUnitBalances.length === 1) {
      setStep(2);
    }
  }, [nasabahUnitBalances, selectedUnitId, isOverall]);

  const selectedUnit = nasabahUnitBalances.find((u) => u.unitId === selectedUnitId);

  const handleRequest = async () => {
    if (!selectedUnit) return;
    setIsLoading(true);
    setError(null);
    const loadingToast = toast.loading("Mengajukan permintaan penarikan...");
    try {
      const withdrawalAmount = parseFloat(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) throw new Error("Jumlah penarikan tidak valid.");
      if (withdrawalAmount > (selectedUnit.balance || 0)) throw new Error("Saldo tidak mencukupi.");
      await onSubmit(withdrawalAmount, selectedUnit.unitId);
      toast.success("Permintaan penarikan berhasil diajukan.", { id: loadingToast });
      setStep(3);
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan yang tidak diketahui.");
      toast.error(error.message || "Terjadi kesalahan yang tidak diketahui.", { id: loadingToast });
      setStep(4);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
      setStep(isOverall ? 1 : 2);
      setAmount('');
      setError(null);
      setOpen(false);
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
              <h2 className="text-2xl font-bold mb-2">Pilih Unit</h2>
              <p className="text-muted-foreground mb-6">Pilih unit penarikan saldo Anda.</p>
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {nasabahUnitBalances.map(unit => (
                  <Button key={unit.unitId} variant={selectedUnitId === unit.unitId ? 'default' : 'outline'} onClick={() => setSelectedUnitId(unit.unitId)} className="flex-grow h-14 min-w-[120px] flex flex-col items-center justify-center gap-2 py-2">
                    {unit.unitName}
                    <b>{formatCurrency(unit?.balance || 0)}</b>
                  </Button>
                ))}
              </div>
              <Button onClick={() => setStep(2)} disabled={!selectedUnit} className="w-full">Lanjut <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, scale: 0.8 }}  animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">Isi Nominal</h2>
              <p className="text-muted-foreground mb-4">Saldo di {selectedUnit?.unitName}: <span className="font-bold text-primary">{formatCurrency(selectedUnit?.balance || 0)}</span></p>
              <div className="relative mb-4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                  <input id="amount" type="number" value={amount} max={selectedUnit?.balance || 0} min={10000} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full text-center text-4xl font-bold bg-transparent border-none focus:ring-0" />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {quickAmounts.map(qAmount => (
                    <Button disabled={(selectedUnit?.balance || 0) < qAmount?true:false} key={qAmount} variant="outline" size="sm" onClick={() => setAmount(String(qAmount))}>{formatCurrency(qAmount).replace('000', '').slice(0, -1)}k</Button>
                ))}
                 <Button variant="outline" size="sm" onClick={() => setAmount(String(selectedUnit?.balance || 0))}>Semua</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {isOverall && <Button variant="outline" onClick={() => setStep(1)} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Button>}
                <Button onClick={handleRequest} disabled={isLoading || !amount || parseFloat(amount) <= 0} className={`w-full ${isOverall?'':'col-span-2'}`}>{isLoading ? <Loader2 className="animate-spin"/> : 'Tarik Saldo'}</Button>
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
            <h2 className="text-2xl font-bold mb-2">Penarikan Berhasil</h2>
            <p className="text-muted-foreground mb-6">Permintaan penarikan Anda telah berhasil diajukan dan sedang diproses.</p>
            <Button onClick={resetForm} className="w-full">Selesai</Button>
          </motion.div>
        );
    case 4:
        return (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Permintaan Gagal</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="grid grid-cols-2 gap-4">
                 <Button variant="outline" onClick={handleSwitchToWithdrawals} className="w-full"><History className="mr-2 h-4 w-4" />Riwayat</Button>
                <Button onClick={() => setStep(isOverall ? 1 : 2)} className="w-full">Coba Lagi</Button>
            </div>
            </motion.div>
        );
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Tarik Saldo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="sr-only">Tarik Saldo</DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
