
import { createContext, useContext, useState, ReactNode } from 'react';

interface UnitDashboardContextType {
  refreshHistory: boolean;
  setRefreshHistory: (refresh: boolean) => void;
}

const UnitDashboardContext = createContext<UnitDashboardContextType | undefined>(undefined);

export const UnitDashboardProvider = ({ children }: { children: ReactNode }) => {
  const [refreshHistory, setRefreshHistory] = useState(false);

  return (
    <UnitDashboardContext.Provider value={{ refreshHistory, setRefreshHistory }}>
      {children}
    </UnitDashboardContext.Provider>
  );
};

export const useUnitDashboard = () => {
  const context = useContext(UnitDashboardContext);
  if (context === undefined) {
    throw new Error('useUnitDashboard must be used within a UnitDashboardProvider');
  }
  return context;
};
