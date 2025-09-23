'use client';

import React, { createContext, useContext } from 'react';
import { GrowthKitConfig } from '../types';

const GrowthKitContext = createContext<{ config: GrowthKitConfig } | undefined>(undefined);

interface GrowthKitProviderProps {
  children: React.ReactNode;
  config: GrowthKitConfig;
}

export function GrowthKitProvider({ children, config }: GrowthKitProviderProps) {
  return (
    <GrowthKitContext.Provider value={{ config }}>
      {children}
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
