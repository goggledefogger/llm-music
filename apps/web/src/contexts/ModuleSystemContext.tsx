import React, { createContext, useContext, ReactNode } from 'react';
import { useModuleSystem, ModuleSystemHook } from '../hooks/useModuleSystem';

const ModuleSystemContext = createContext<ModuleSystemHook | null>(null);

interface ModuleSystemProviderProps {
  children: ReactNode;
}

export const ModuleSystemProvider: React.FC<ModuleSystemProviderProps> = ({ children }) => {
  const moduleSystem = useModuleSystem();

  return (
    <ModuleSystemContext.Provider value={moduleSystem}>
      {children}
    </ModuleSystemContext.Provider>
  );
};

export const useModuleSystemContext = (): ModuleSystemHook => {
  const context = useContext(ModuleSystemContext);
  if (!context) {
    throw new Error('useModuleSystemContext must be used within a ModuleSystemProvider');
  }
  return context;
};
