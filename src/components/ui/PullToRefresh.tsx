'use client'

import React, { useState, useRef, useEffect, ReactNode, TouchEvent, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ArrowDown, Leaf } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<any> | void;
  children: ReactNode;
  loading: boolean;
  activeTab: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, loading, activeTab }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]); // Only scroll to top when the active tab changes

  useEffect(() => {
    if (loading) {
      hasRefreshed.current = true;
      controls.start({ y: 60, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    } else {
      if (hasRefreshed.current) {
        controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
      }
    }
  }, [loading, controls]);

  const handleStart = useCallback((clientY: number) => {
    if (loading || (containerRef.current && containerRef.current.scrollTop !== 0)) {
      return;
    }
    setStartY(clientY);
    setIsPulling(true);
  }, [loading]);

  const handleMove = useCallback((clientY: number) => {
    if (!isPulling || loading) return;
    const distance = Math.max(0, clientY - startY);
    const dampenedDistance = Math.pow(distance, 0.85);
    setPullDistance(dampenedDistance);
    controls.set({ y: dampenedDistance });
  }, [isPulling, startY, controls, loading]);

  const handleEnd = useCallback(() => {
    if (!isPulling || loading) return;
    setIsPulling(false);

    if (pullDistance > 100) {
      onRefresh();
    } else {
      controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }
    
    setPullDistance(0);
    setStartY(0);
  }, [isPulling, pullDistance, onRefresh, controls, loading]);

  return (
    <div 
      ref={containerRef} 
      className="h-full overflow-y-auto relative"
      style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientY)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientY)}
      onMouseMove={(e) => isPulling && handleMove(e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={() => isPulling && handleEnd()}
    >
      <motion.div 
        className="absolute top-[-60px] left-0 right-0 flex items-center justify-center pointer-events-none"
        style={{ height: '60px', zIndex: 10 }}
        animate={controls}
        initial={{ y: 0 }}
      >
        <div className="p-4 bg-white rounded-full shadow-lg">
          {loading ? (
            <Leaf className="animate-spin text-green-600" />
          ) : (
            <motion.div
              animate={{ rotate: pullDistance > 100 ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowDown className="text-gray-500" />
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <div className="relative z-0" style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
