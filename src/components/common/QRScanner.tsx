'use client';

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import decodeQR from 'qr/decode.js';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCheck, FileUp, ShieldAlert, Loader2 } from 'lucide-react';
import { Nasabah } from '@/types';
import { cn } from '@/lib/utils';

interface QRScannerProps {
  onScanSuccess: (data: Nasabah) => void;
  onClose: () => void;
}

export default function QRScannerComponent({ onScanSuccess, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameId = useRef<number>(0);

  const [scannedData, setScannedData] = useState<Nasabah | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScanRef = useRef<((result: string) => Promise<void>) | null>(null);

  const handleScanLogic = useCallback(async (result: string) => {
    if (isLoading || scannedData) {
      return;
    }

    setIsLoading(true);
    setScanError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/nasabah/${result}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nasabah tidak ditemukan atau tidak valid');
      }

      const nasabahData: Nasabah = await response.json();
      setScannedData(nasabahData);

    } catch (error: any) {
      setScanError(error.message);
      toast.error('Verifikasi Gagal', { description: error.message });
      setTimeout(() => setScanError(null), 2500);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, scannedData]);

  useLayoutEffect(() => {
    handleScanRef.current = handleScanLogic;
  }, [handleScanLogic]);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return;

    const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let stream: MediaStream | null = null;

    const scan = () => {
      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        canvasElement.height = videoElement.videoHeight;
        canvasElement.width = videoElement.videoWidth;
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        try {
          const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
          const result = decodeQR({ width: imageData.width, height: imageData.height, data: imageData.data });
          if (result && handleScanRef.current) {
            handleScanRef.current(result);
            return; // Stop scanning once found
          }
        } catch (err) {
          // QR code not found, continue scanning
        }
      }
      animationFrameId.current = requestAnimationFrame(scan);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s;
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', 'true');
        videoElement.play();
        scan();
      })
      .catch(err => {
        console.error("Camera access failed:", err);
        setScanError("Kamera tidak dapat diakses. Mohon berikan izin kamera.");
      });

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const restartScanner = useCallback(() => {
    setScannedData(null);
    setScanError(null);
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (videoElement && canvasElement) {
      const ctx = canvasElement.getContext('2d');
      if(!ctx) return;
      const scan = () => {
        if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          canvasElement.height = videoElement.videoHeight;
          canvasElement.width = videoElement.videoWidth;
          ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
          try {
            const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const result = decodeQR({ width: imageData.width, height: imageData.height, data: imageData.data });
            if (result && handleScanRef.current) {
              handleScanRef.current(result);
              return;
            }
          } catch (err) {}
        }
        animationFrameId.current = requestAnimationFrame(scan);
      };
      scan();
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if(!ctx) return;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            try {
                const result = decodeQR({ width: imageData.width, height: imageData.height, data: imageData.data });
                if (result && handleScanRef.current) {
                    handleScanRef.current(result);
                }
            } catch (error) {
                toast.error('Gagal Memindai Gambar', { description: 'Tidak ada QR code yang ditemukan pada gambar.' });
            }
        }
        img.src = event.target?.result as string;
    }
    reader.readAsDataURL(file);
  };

  const handleUseData = () => {
    if (scannedData) onScanSuccess(scannedData);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
    >
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" size="icon" className="text-white rounded-full bg-black/30 backdrop-blur-sm" onClick={onClose}><ArrowLeft /></Button>
        <h1 className="text-lg font-semibold">Pindai QR Nasabah</h1>
        <div className="w-10"></div>
      </header>

      <div className="relative flex-grow w-full h-full">
        <video 
          ref={videoRef} 
          className={cn(
            "w-full h-full object-cover transition-filter duration-300",
            { 'blur-md': !!scannedData } 
          )}
          playsInline
          muted 
        />
        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
              <p className="text-xl font-semibold">Memverifikasi Data...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {scanError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-8">
              <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-xl font-bold mb-2">Verifikasi Gagal</p>
              <p className="text-neutral-300 max-w-sm">{scanError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!scannedData && !isLoading && !scanError && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full max-w-sm aspect-square">
              <div className="absolute -top-2 -left-2 w-12 h-12 border-t-4 border-l-4 border-white/80 rounded-tl-2xl animate-pulse"></div>
              <div className="absolute -top-2 -right-2 w-12 h-12 border-t-4 border-r-4 border-white/80 rounded-tr-2xl animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-2xl animate-pulse"></div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-4 border-r-4 border-white/80 rounded-br-2xl animate-pulse"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-400/70 shadow-[0_0_10px_2px_#34D399] animate-scan-laser"></div>
            </div>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {scannedData && (
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="absolute bottom-0 left-0 right-0 z-30 bg-neutral-900/95 backdrop-blur-xl rounded-t-2xl shadow-2xl"
          >
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 mr-4 rounded-full bg-green-500/20 text-green-400"><UserCheck className="w-8 h-8" /></div>
                <div>
                  <h2 className="text-2xl font-bold">{scannedData.user.name}</h2>
                  <p className="text-sm text-neutral-400 font-mono">{scannedData.accountNo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="bg-black/30 p-3 rounded-lg"><p className="text-neutral-400 mb-1">Role</p><p className="font-semibold capitalize">{scannedData.user.role?.toLowerCase() || 'Nasabah'}</p></div>
                <div className="bg-black/30 p-3 rounded-lg"><p className="text-neutral-400 mb-1">Saldo</p><p className="font-semibold">{formatCurrency(scannedData.balance)}</p></div>
              </div>
              <Button size="lg" className="w-full text-lg h-14 bg-green-500 hover:bg-green-60.0 text-white font-bold" onClick={handleUseData}>Gunakan Data Nasabah</Button>
              <Button variant="outline" className="w-full text-lg h-14 mt-3 bg-transparent text-white border-neutral-600 hover:bg-neutral-800 hover:text-white" onClick={restartScanner}>Pindai Lagi</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!scannedData && (
        <footer className="absolute bottom-0 left-0 right-0 z-20 p-4 text-center bg-gradient-to-t from-black/80 to-transparent">
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="text-white hover:bg-white/10">
            <FileUp className="w-5 h-5 mr-2" /> Unggah dari Galeri
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
        </footer>
      )}
    </motion.div>
  );
}
