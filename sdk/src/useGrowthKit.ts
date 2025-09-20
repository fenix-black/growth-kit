import { useEffect, useState, useCallback, useRef } from 'react';
import { GrowthKitAPI } from './api';
import { getFingerprint } from './fingerprint';
import type {
  GrowthKitConfig,
  GrowthKitState,
  GrowthKitActions,
  GrowthKitHook,
  ShareOptions,
} from './types';

const initialState: GrowthKitState = {
  loading: true,
  initialized: false,
  error: null,
  fingerprint: null,
  credits: 0,
  usage: 0,
  referralCode: null,
  policy: null,
  hasClaimedName: false,
  hasClaimedEmail: false,
  hasVerifiedEmail: false,
  isOnWaitlist: false,
  waitlistPosition: null,
};

export function useGrowthKit(config: GrowthKitConfig): GrowthKitHook {
  const [state, setState] = useState<GrowthKitState>(initialState);
  const apiRef = useRef<GrowthKitAPI | null>(null);
  const initRef = useRef(false);

  // Initialize API client
  useEffect(() => {
    if (!config.apiKey) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error('API key is required'),
      }));
      return;
    }

    apiRef.current = new GrowthKitAPI(config.apiKey, config.apiUrl);
  }, [config.apiKey, config.apiUrl]);

  // Initialize fingerprint and fetch user data
  const initialize = useCallback(async () => {
    if (!apiRef.current || initRef.current) return;
    initRef.current = true;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Get browser fingerprint
      const fingerprint = await getFingerprint();
      apiRef.current.setFingerprint(fingerprint);

      // Check for referral claim in URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const refClaim = urlParams.get('ref');
      
      // Fetch user data, passing the claim if present
      // The /v1/me endpoint will apply referral credits if the claim is valid
      const response = await apiRef.current.getMe(fingerprint, refClaim || undefined);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user data');
      }

      const data = response.data!;
      
      // Clean up URL by removing the ref parameter
      if (refClaim && typeof window !== 'undefined' && window.history?.replaceState) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('ref');
        window.history.replaceState({}, '', cleanUrl.toString());
      }

      setState({
        loading: false,
        initialized: true,
        error: null,
        fingerprint,
        credits: data.credits,
        usage: data.usage,
        referralCode: data.referralCode,
        policy: data.policy,
        hasClaimedName: data.hasClaimedName,
        hasClaimedEmail: data.hasClaimedEmail,
        hasVerifiedEmail: data.hasVerifiedEmail,
        isOnWaitlist: false,
        waitlistPosition: null,
      });

      if (config.debug) {
        console.log('GrowthKit initialized:', data);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
      
      if (config.debug) {
        console.error('GrowthKit initialization error:', error);
      }
    }
  }, [config.debug]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Refresh user data
  const refresh = useCallback(async () => {
    if (!apiRef.current || !state.fingerprint) return;

    try {
      const response = await apiRef.current.getMe(state.fingerprint);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          credits: response.data!.credits,
          usage: response.data!.usage,
          hasClaimedName: response.data!.hasClaimedName,
          hasClaimedEmail: response.data!.hasClaimedEmail,
          hasVerifiedEmail: response.data!.hasVerifiedEmail,
        }));
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, [state.fingerprint]);

  // Complete an action
  const completeAction = useCallback(async (
    action: string = 'default',
    metadata?: any
  ): Promise<boolean> => {
    if (!apiRef.current || !state.fingerprint) return false;

    try {
      const response = await apiRef.current.completeAction(
        state.fingerprint,
        action,
        metadata
      );

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          credits: response.data!.creditsRemaining,
          usage: prev.usage + 1,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Complete action failed:', error);
      return false;
    }
  }, [state.fingerprint]);

  // Claim name
  const claimName = useCallback(async (name: string): Promise<boolean> => {
    if (!apiRef.current || !state.fingerprint || state.hasClaimedName) {
      return false;
    }

    try {
      const response = await apiRef.current.claimName(state.fingerprint, name);

      if (response.success && response.data?.claimed) {
        setState(prev => ({
          ...prev,
          credits: response.data!.totalCredits || prev.credits,
          hasClaimedName: true,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Claim name failed:', error);
      return false;
    }
  }, [state.fingerprint, state.hasClaimedName]);

  // Claim email
  const claimEmail = useCallback(async (email: string): Promise<boolean> => {
    if (!apiRef.current || !state.fingerprint || state.hasClaimedEmail) {
      return false;
    }

    try {
      const response = await apiRef.current.claimEmail(state.fingerprint, email);

      if (response.success && response.data?.claimed) {
        setState(prev => ({
          ...prev,
          credits: response.data!.totalCredits || prev.credits,
          hasClaimedEmail: true,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Claim email failed:', error);
      return false;
    }
  }, [state.fingerprint, state.hasClaimedEmail]);

  // Verify email
  const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
    if (!apiRef.current || !state.fingerprint || state.hasVerifiedEmail) {
      return false;
    }

    try {
      const response = await apiRef.current.verifyEmail(state.fingerprint, token);

      if (response.success && response.data?.verified) {
        setState(prev => ({
          ...prev,
          credits: response.data!.totalCredits || prev.credits,
          hasVerifiedEmail: true,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Verify email failed:', error);
      return false;
    }
  }, [state.fingerprint, state.hasVerifiedEmail]);

  // Join waitlist
  const joinWaitlist = useCallback(async (
    email: string,
    metadata?: any
  ): Promise<boolean> => {
    if (!apiRef.current || state.isOnWaitlist) return false;

    try {
      const response = await apiRef.current.joinWaitlist(
        email,
        state.fingerprint || undefined,
        metadata
      );

      if (response.success && response.data?.joined) {
        setState(prev => ({
          ...prev,
          isOnWaitlist: true,
          waitlistPosition: response.data!.position || null,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Join waitlist failed:', error);
      return false;
    }
  }, [state.fingerprint, state.isOnWaitlist]);

  // Share functionality
  const share = useCallback(async (options?: ShareOptions): Promise<boolean> => {
    const referralLink = getReferralLink();
    const shareData = {
      title: options?.title || 'Check this out!',
      text: options?.text || `Join me and get free credits! ${referralLink}`,
      url: options?.url || referralLink,
    };

    try {
      // Use native share API if available
      if (navigator.share) {
        await navigator.share(shareData);
        return true;
      }

      // Fallback to clipboard
      const shareText = `${shareData.text}\n${shareData.url}`;
      await navigator.clipboard.writeText(shareText);
      
      // Show some feedback (you might want to use a toast library)
      if (config.debug) {
        console.log('Copied to clipboard:', shareText);
      }
      
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      
      // Last fallback: open a new window with pre-filled tweet
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}`;
      window.open(tweetUrl, '_blank');
      
      return false;
    }
  }, [config.debug]);

  // Get referral link
  const getReferralLink = useCallback((): string => {
    if (!state.referralCode) return '';
    
    // Use current domain if no apiUrl specified
    const baseUrl = config.apiUrl || window.location.origin;
    return `${baseUrl}/r/${state.referralCode}`;
  }, [state.referralCode, config.apiUrl]);

  // Check if soft paywall should be shown
  const shouldShowSoftPaywall = useCallback((): boolean => {
    return state.credits <= 0 && state.usage > 0;
  }, [state.credits, state.usage]);

  // Check if user can perform an action
  const canPerformAction = useCallback((action: string = 'default'): boolean => {
    if (!state.policy) return false;
    
    const actionPolicy = state.policy.actions[action] || state.policy.actions.default;
    const creditsRequired = actionPolicy?.creditsRequired || 1;
    
    return state.credits >= creditsRequired;
  }, [state.credits, state.policy]);

  // Combine state and actions
  const actions: GrowthKitActions = {
    refresh,
    completeAction,
    claimName,
    claimEmail,
    verifyEmail,
    joinWaitlist,
    share,
    getReferralLink,
    shouldShowSoftPaywall,
    canPerformAction,
  };

  return {
    ...state,
    ...actions,
  };
}
