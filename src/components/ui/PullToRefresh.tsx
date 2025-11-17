'use client'

import { useState, useRef, ReactNode, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { ArrowDown, Loader } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<any> | void
  children: ReactNode
  loading?: boolean
}

const PULL_THRESHOLD = 80; // Jarak tarikan dalam piksel sebelum refresh dipicu
const PULL_RESISTANCE = 0.7; // Faktor resistensi untuk efek tarikan yang lebih alami

export default function PullToRefresh({ onRefresh, children, loading: externalLoading }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const y = useMotionValue(0)
  const indicatorOpacity = useTransform(y, [0, PULL_THRESHOLD], [0, 1])
  const indicatorScale = useTransform(y, [0, PULL_THRESHOLD], [0.5, 1])
  const arrowRotation = useTransform(y, [0, PULL_THRESHOLD], [0, 180])

  useEffect(() => {
    // Efek ini berjalan ketika status loading dari parent berubah.
    // Kita hanya ingin menganimasikan kembali ketika operasi refresh baru saja selesai.
    if (!externalLoading && isRefreshing) {
        animate(y, 0, {
            type: "spring",
            damping: 30,
            stiffness: 400,
            onComplete: () => {
                setIsRefreshing(false);
            }
        });
    }
  }, [externalLoading, isRefreshing, y]);

  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  if (!isTouchDevice) {
    return <div className="h-full overflow-y-auto">{children}</div>
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isRefreshing || (containerRef.current && containerRef.current.scrollTop !== 0)) {
      return
    }
    isDragging.current = true
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || isRefreshing) return

    const currentY = e.touches[0].clientY
    const pullDistance = currentY - startY.current

    if (pullDistance > 0) {
        e.preventDefault() // Mencegah scroll default browser jika kita menarik ke bawah
        y.set(pullDistance * PULL_RESISTANCE)
    }
  }

  const handleTouchEnd = async () => {
    if (!isDragging.current || isRefreshing) return;
    isDragging.current = false;

    const currentY = y.get();

    if (currentY >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        // Animasikan ke posisi indikator refresh
        animate(y, PULL_THRESHOLD, { type: "spring", damping: 30, stiffness: 400 });

        try {
            await onRefresh();
            // Jika berhasil, useEffect akan menangani animasi kembali.
        } catch (error) {
            console.error("Gagal menyegarkan:", error);
            // Jika refresh gagal, animasikan kembali segera
            animate(y, 0, {
                type: "spring",
                damping: 30,
                stiffness: 400,
                onComplete: () => {
                    setIsRefreshing(false);
                }
            });
        }
    } else {
        // Animasikan kembali jika tidak ditarik cukup jauh
        animate(y, 0, { type: "spring", damping: 30, stiffness: 400 });
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none" style={{ height: PULL_THRESHOLD, zIndex: 1 }}>
          <motion.div 
            style={{ opacity: indicatorOpacity, scale: indicatorScale }}
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md"
          >
            {isRefreshing || externalLoading ? (
                <Loader className="animate-spin text-green-600" size={24} />
            ) : (
                <motion.div style={{ rotate: arrowRotation }}>
                    <ArrowDown className="text-gray-500" size={24} />
                </motion.div>
            )}
          </motion.div>
      </div>
      <motion.div style={{ y }}>
          {children}
      </motion.div>
    </div>
  )
}
