'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { GrowthKitState, CompleteActionOptions } from '../types';
import { GrowthKitAPI } from '../api';
import { useGrowthKitConfig } from './GrowthKitProvider';

const initialState: GrowthKitState = {
  loading: true,
  initialized: false,
  credits: 0,
  usage: 0,
  creditsPaused: false,
  name: null,
  email: null,
  hasClaimedName: false,
  hasClaimedEmail: false,
  hasVerifiedEmail: false,
  fingerprint: null,
  error: null,
  referralCode: null,
  policy: null,
  waitlistEnabled: false,
  waitlistStatus: 'none',
  shouldShowWaitlist: false,
  waitlistPosition: null,
  waitlistMessage: undefined,
  app: undefined,
};

interface GrowthKitStateContextValue {
  state: GrowthKitState;
  setState: React.Dispatch<React.SetStateAction<GrowthKitState>>;
  apiRef: React.MutableRefObject<GrowthKitAPI | null>;
  initRef: React.MutableRefObject<boolean>;
}

const GrowthKitStateContext = createContext<GrowthKitStateContextValue | undefined>(undefined);

export function GrowthKitStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GrowthKitState>(initialState);
  const apiRef = useRef<GrowthKitAPI | null>(null);
  const initRef = useRef<boolean>(false);

  return (
    <GrowthKitStateContext.Provider value={{ state, setState, apiRef, initRef }}>
      {children}
    </GrowthKitStateContext.Provider>
  );
}

export function useGrowthKitState() {
  const context = useContext(GrowthKitStateContext);
  if (!context) {
    throw new Error('useGrowthKitState must be used within a GrowthKitStateProvider');
  }
  return context;
}
