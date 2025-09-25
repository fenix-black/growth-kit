'use client';

import React, { createContext, useContext } from 'react';
import { GrowthKitConfig } from '../types';
import { GrowthKitStateProvider } from './GrowthKitStateProvider';

const GrowthKitContext = createContext<{ config: GrowthKitConfig } | undefined>(undefined);

interface GrowthKitProviderProps {
  children: React.ReactNode;
  config: GrowthKitConfig;
}

export function GrowthKitProvider({ children, config }: GrowthKitProviderProps) {
  return (
    <GrowthKitContext.Provider value={{ config }}>
      <GrowthKitStateProvider>
        {children}
      </GrowthKitStateProvider>
    </GrowthKitContext.Provider>
  );
}

export function useGrowthKitConfig() {
  const context = useContext(GrowthKitContext);
  if (!context) {
    throw new Error('useGrowthKitConfig must be used within a GrowthKitProvider');
  }
  return context.config;
}
