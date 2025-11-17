
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UnitBalance {
  unitId: string;
  unitName: string;
  balance: number;
}

export function WithdrawalRequestForm({
  nasabahUnitBalances = [],
  onSubmit,
}: {
  nasabahUnitBalances: UnitBalance[];
  onSubmit: (amount: number, unitId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(
    nasabahUnitBalances.length > 0 ? nasabahUnitBalances[0].unitId : undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (nasabahUnitBalances.length > 0 && !selectedUnitId) {
      setSelectedUnitId(nasabahUnitBalances[0].unitId);
    }
    // if selected unit is not in the list, reset it
    if (selectedUnitId && !nasabahUnitBalances.find(u => u.unitId === selectedUnitId)) {
        setSelectedUnitId(nasabahUnitBalances.length > 0 ? nasabahUnitBalances[0].unitId : undefined);
    }

  }, [nasabahUnitBalances, selectedUnitId]);

  const selectedUnitBalance =
    nasabahUnitBalances.find((u) => u.unitId === selectedUnitId)?.balance ?? 0;

  const handleRequest = async () => {
    if (!selectedUnitId) {
      toast({
        title: "Error",
        description: "Silakan pilih unit terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const withdrawalAmount = parseFloat(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        toast({
          title: "Error",
          description: "Jumlah penarikan tidak valid.",
          variant: "destructive",
        });
        return;
      }

      if (withdrawalAmount > selectedUnitBalance) {
        toast({
          title: "Error",
          description: "Saldo di unit ini tidak mencukupi.",
          variant: "destructive",
        });
        return;
      }

      await onSubmit(withdrawalAmount, selectedUnitId);
      setOpen(false);
      setAmount("");
      toast({
        title: "Sukses",
        description: "Pengajuan penarikan saldo berhasil dikirim.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Terjadi kesalahan saat mengajukan penarikan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectAmount = (value: number | "max") => {
    if (value === "max") {
      setAmount(selectedUnitBalance.toString());
    } else {
      setAmount(value.toString());
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Tarik Saldo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tarik Saldo</DialogTitle>
          {selectedUnitId && (
            <DialogDescription>
              Saldo Anda di unit terpilih: {formatCurrency(selectedUnitBalance)}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unit
            </Label>
            <Select
              value={selectedUnitId}
              onValueChange={(value) => setSelectedUnitId(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih Unit" />
              </SelectTrigger>
              <SelectContent>
                {nasabahUnitBalances.map((unit) => (
                  <SelectItem key={unit.unitId} value={unit.unitId}>
                    {unit.unitName} ({formatCurrency(unit.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Jumlah
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="Masukkan nominal"
              disabled={!selectedUnitId}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => selectAmount(10000)} disabled={!selectedUnitId}>10rb</Button>
            <Button variant="outline" size="sm" onClick={() => selectAmount(20000)} disabled={!selectedUnitId}>20rb</Button>
            <Button variant="outline" size="sm" onClick={() => selectAmount(50000)} disabled={!selectedUnitId}>50rb</Button>
            <Button variant="outline" size="sm" onClick={() => selectAmount("max")} disabled={!selectedUnitId}>Max</Button>
          </div>
        </div>
        <Button
          onClick={handleRequest}
          disabled={isLoading || !selectedUnitId || !amount}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ajukan Penarikan
        </Button>
      </DialogContent>
    </Dialog>
  );
}
