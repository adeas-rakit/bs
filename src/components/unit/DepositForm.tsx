'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { 
  Plus, 
  Search,
  QrCode,
  X,
  Minus,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Nasabah, WasteType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface DepositFormProps {
  onSuccess: (transactionId: string) => void;
  onScanClick: () => void;
  preselectedNasabah: Nasabah | null;
  onClearNasabah: () => void;
}

const funFacts = [
  "Mendaur ulang 1 botol plastik dapat menghemat energi yang cukup untuk menyalakan bola lampu 60 watt selama 6 jam.",
  "Industri daur ulang di Indonesia berhasil mengurangi emisi karbon dioksida setara dengan menanam 1,5 juta pohon setiap tahun.",
  "Aluminium dapat didaur ulang tanpa henti tanpa kehilangan kualitasnya. Mendaur ulang kaleng aluminium menghemat 95% energi dibandingkan membuatnya dari bahan mentah.",
  "Untuk setiap ton kertas yang didaur ulang, kita menyelamatkan sekitar 17 pohon, 7.000 galon air, dan 463 galon minyak.",
  "Kaca 100% dapat didaur ulang dan dapat didaur ulang tanpa henti tanpa kehilangan kualitas atau kemurniannya.",
  "Lebih dari 60% sampah yang berakhir di tempat sampah sebenarnya bisa didaur ulang.",
  "Mendaur ulang satu kaleng aluminium menghemat energi yang cukup untuk menyalakan TV selama tiga jam.",
];


const NasabahSelectionSkeleton = () => (
      <div className="w-full">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div> 
  );

export default function DepositForm({ onSuccess, onScanClick, preselectedNasabah, onClearNasabah }: DepositFormProps) {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null);
  const [depositItems, setDepositItems] = useState<Array<{id: number, wasteTypeId: string, weight: number}>>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingNasabah, setIsFetchingNasabah] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [funFact, setFunFact] = useState('');

  useEffect(() => {
    setSelectedNasabah(preselectedNasabah);
  }, [preselectedNasabah]);

  useEffect(() => {
      if (!selectedNasabah) {
          setDepositItems([]);
          onClearNasabah();
      }
  }, [selectedNasabah]);

  const fetchNasabah = async () => {
    setIsFetchingNasabah(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ search: searchTerm });
      const response = await fetch(`/api/nasabah?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNasabahList(data.nasabah.filter((n: any) => n.user.status === 'AKTIF'));
      } else {
        toast.error("Gagal memuat data nasabah");
      }
    } catch (error: any) {
      toast.error("Gagal memuat data nasabah", { description: error.message });
    } finally {
      setIsFetchingNasabah(false);
    }
  };

  const fetchWasteTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/waste-types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWasteTypes(data.wasteTypes.filter((wt: WasteType) => wt.status === 'AKTIF'));
      } else {
        toast.error("Gagal memuat data jenis sampah");
      }
    } catch (error: any) {
      toast.error("Gagal memuat data jenis sampah", { description: error.message });
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        fetchNasabah();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    fetchWasteTypes();
  }, []);

  const addDepositItem = () => {
    setDepositItems([...depositItems, { id: Date.now(), wasteTypeId: '', weight: 0 }]);
    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    setFunFact(randomFact);
  };

  const updateDepositItem = (index: number, field: string, value: any) => {
    const updatedItems = [...depositItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setDepositItems(updatedItems);
  };

  const handleWeightChange = (index: number, amount: number) => {
    const updatedItems = [...depositItems];
    const currentWeight = updatedItems[index].weight || 0;
    const newWeight = Math.max(0, parseFloat((currentWeight + amount).toFixed(2)));
    updatedItems[index].weight = newWeight;
    setDepositItems(updatedItems);
  }

  const removeDepositItem = (index: number) => {
    setDepositItems(depositItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => depositItems.reduce((total, item) => {
    const wasteType = wasteTypes.find(wt => wt.id === item.wasteTypeId);
    return total + (item.weight && wasteType ? item.weight * wasteType.pricePerKg : 0);
  }, 0);

  const calculateTotalWeight = () => depositItems.reduce((total, item) => total + (parseFloat(item.weight.toString()) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNasabah || depositItems.length === 0) {
      toast.error("Pilih nasabah dan tambahkan minimal satu item sampah.");
      return;
    }
    const validItems = depositItems.filter(item => item.wasteTypeId && item.weight > 0);
    if (validItems.length !== depositItems.length) {
      toast.error("Pastikan semua item sampah memiliki jenis dan berat yang valid.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Menyimpan tabungan...");
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nasabahId: selectedNasabah.id,
          type: 'DEPOSIT',
          items: validItems.map(({wasteTypeId, weight}) => ({wasteTypeId, weight})),
        })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Tabungan berhasil dicatat", { id: loadingToast });
        onSuccess(data.transaction.id);
      } else {
        throw new Error(data.error || 'Gagal menyimpan tabungan');
      }
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  const formatWeight = (weight: number) => `${weight.toFixed(2)} kg`;
  const wasteTypeOptions = wasteTypes.map(wt => ({ value: wt.id, label: `${wt.name} - ${formatCurrency(wt.pricePerKg)}/kg` }));

  return (
    <div className="space-y-4">
      {!selectedNasabah ? (
        <Card>
          <CardHeader>
            <CardTitle>Pilih Nasabah</CardTitle>
            <CardDescription>Cari nama nasabah atau pindai QR code.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nasabah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={isFetchingNasabah}
                />
              </div>
              <Button variant="outline" onClick={onScanClick} className="shrink-0">
                <QrCode className="h-4 w-4 mr-2" />
                Pindai
              </Button>
            </div>
            {isFetchingNasabah && !searchTerm && <NasabahSelectionSkeleton />}
            {!isFetchingNasabah && nasabahList.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {nasabahList.map((nasabahItem) => (
                  <div
                    key={nasabahItem.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-secondary"
                    onClick={() => setSelectedNasabah(nasabahItem)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{nasabahItem.user.name}</p>
                        <p className="text-sm text-gray-500">{nasabahItem.accountNo}</p>
                      </div>
                      <Badge variant="outline">{formatCurrency(nasabahItem.balance)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isFetchingNasabah && nasabahList.length === 0 && searchTerm && (
                <p className='text-center text-sm text-gray-500 py-4'>Nasabah tidak ditemukan.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
            <CardHeader>
                <CardTitle>Nasabah Terpilih</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                    <div>
                        <p className="font-bold text-base">{selectedNasabah.user.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{selectedNasabah.accountNo}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedNasabah(null)}>
                        <X className="h-5 w-5 text-red-500" />
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

      {selectedNasabah && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Detail Tabungan</CardTitle>
                <CardDescription>Masukkan jenis dan berat sampah.</CardDescription>
              </div>
              <Button onClick={addDepositItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item
              </Button>
            </div>
            {funFact && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2 mt-3"
              >
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
                <span>{funFact}</span>
              </motion.div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <AnimatePresence>
                {depositItems.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-muted/30 p-3 rounded-lg border"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 w-full">
                      <div className="flex-grow">
                        <Label className="mb-1.5 text-xs block">Jenis Sampah</Label>
                        <Combobox
                          options={wasteTypeOptions}
                          value={item.wasteTypeId}
                          onChange={(value) => updateDepositItem(index, 'wasteTypeId', value)}
                          placeholder="Pilih jenis..."
                        />
                      </div>
                      <div className="w-full sm:w-40 shrink-0">
                        <Label className="mb-1.5 text-xs block">Berat (kg)</Label>
                        <div className="flex items-center">
                            <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-r-none" onClick={() => handleWeightChange(index, -0.1)}><Minus className="h-4 w-4" /></Button>
                            <Input
                                type="number"
                                step="0.1"
                                value={item.weight || ''}
                                onChange={(e) => updateDepositItem(index, 'weight', parseFloat(e.target.value) || 0)}
                                placeholder="0.0"
                                className="h-10 text-center rounded-none z-10 border-x-0 focus-visible:ring-primary"
                            />
                            <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-l-none" onClick={() => handleWeightChange(index, 0.1)}><Plus className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <div className="sm:pt-7 self-center sm:self-start">
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeDepositItem(index)}>
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {depositItems.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4 font-medium">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Berat</p>
                      <p className="text-xl">{formatWeight(calculateTotalWeight())}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Estimasi Nilai</p>
                      <p className="text-xl text-green-600">{formatCurrency(calculateTotal())}</p>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                    {loading ? "Memproses..." : "Simpan Tabungan"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
