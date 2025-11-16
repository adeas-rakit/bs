"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function WithdrawalRequestForm({
  balance,
  onSubmit,
}: {
  balance: number;
  onSubmit: (amount: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRequest = async () => {
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

      if (withdrawalAmount > balance) {
        toast({
          title: "Error",
          description: "Saldo tidak mencukupi untuk melakukan penarikan.",
          variant: "destructive",
        });
        return;
      }

      await onSubmit(withdrawalAmount);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Tarik Saldo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajukan Penarikan Saldo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
            />
          </div>
        </div>
        <Button onClick={handleRequest} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ajukan
        </Button>
      </DialogContent>
    </Dialog>
  );
}
