'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

// Tentukan tipe untuk nilai context
interface TabContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Buat context dengan nilai default undefined
const TabContext = createContext<TabContextType | undefined>(undefined);

// Buat komponen Provider
export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState('overview'); // Default tab set to 'overview'

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
}

// Buat custom hook untuk menggunakan context dengan lebih mudah
export function useTabContext() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}
