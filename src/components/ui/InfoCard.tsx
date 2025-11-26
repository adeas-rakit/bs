'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface InfoCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  initialInfo: React.ReactNode;
  expandedInfo?: React.ReactNode;
  actionButtons?: React.ReactNode;
  isCollapsible?: boolean;
}

export const InfoCard = ({ 
    id, 
    title, 
    subtitle, 
    icon, 
    initialInfo, 
    expandedInfo, 
    actionButtons,
    isCollapsible = true
}: InfoCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (isCollapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className={`p-4 ${isCollapsible ? 'cursor-pointer' : ''}`} onClick={handleToggle}>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 border rounded-full flex items-center justify-center mr-4">
                    {icon}
                </div>
                <div>
                    <CardTitle className="text-md font-semibold">{title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
            </div>
            {isCollapsible && (
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </motion.div>
            )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {initialInfo}
      </CardContent>

      <AnimatePresence initial={false}>
        {isOpen && isCollapsible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t p-4">
                {expandedInfo}
                {actionButtons && (
                    <div className="flex justify-end space-x-2 mt-4">
                        {actionButtons}
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
