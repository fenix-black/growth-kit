import { useEffect, useCallback, useRef } from 'react';
import { GrowthKitAPI } from './api';
import { getFingerprint } from './fingerprint';
import { useGrowthKitConfig } from './components/GrowthKitProvider';
import { useGrowthKitState } from './components/GrowthKitStateProvider';
import type {
  GrowthKitConfig,
  GrowthKitState,
  GrowthKitActions,
  GrowthKitHook,
  ShareOptions,
  CompleteActionOptions,
} from './types';

// Initial state is now managed in GrowthKitStateProvider

export function useGrowthKit(): GrowthKitHook {
  const config = useGrowthKitConfig();
  const { state, setState, apiRef, initRef } = useGrowthKitState();
  const configRef = useRef(config);
  configRef.current = config;

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

      // Parse waitlist data
      const waitlistData = data.waitlist;
      const waitlistEnabled = waitlistData?.enabled || false;
      const waitlistStatus = waitlistData?.status || 'none';
      const waitlistPosition = waitlistData?.position || null;
      const waitlistMessage = waitlistData?.message;
      
      // Determine if waitlist gate should show
      // Show for both 'none' (to join) and 'waiting' (to see position)
      const shouldShowWaitlist = waitlistEnabled && 
        (waitlistStatus === 'none' || waitlistStatus === 'waiting') && 
        waitlistData?.requiresWaitlist === true;

      // Debug logging
      if (configRef.current.debug) {
        console.log('[GrowthKit] API Response:', data);
        console.log('[GrowthKit] Referral Code:', data.referralCode);
      }
      
      setState({
        loading: false,
        initialized: true,
        error: null,
        fingerprint,
        credits: data.credits,
        usage: data.usage,
        creditsPaused: data.creditsPaused || false,
        referralCode: data.referralCode,
        policy: data.policy,
        name: data.name || null,
        email: data.email || null,
        hasClaimedName: data.hasClaimedName,
        hasClaimedEmail: data.hasClaimedEmail,
        hasVerifiedEmail: data.hasVerifiedEmail,
        // Waitlist state
        waitlistEnabled,
        waitlistStatus,
        waitlistPosition,
        waitlistMessage,
        shouldShowWaitlist,
      });

      if (configRef.current.debug) {
        console.log('GrowthKit initialized:', data);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
      
      if (configRef.current.debug) {
        console.error('GrowthKit initialization error:', error);
      }
    }
  }, []); // No deps to avoid re-creation

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []); // Empty deps to run only once on mount

  // Refresh user data
  const refresh = useCallback(async () => {
    if (!apiRef.current || !state.fingerprint) return;

    try {
      const response = await apiRef.current.getMe(state.fingerprint);
      
      if (response.success && response.data) {
        const data = response.data;
        
        // Parse waitlist data
        const waitlistData = data.waitlist;
        const waitlistEnabled = waitlistData?.enabled || false;
        const waitlistStatus = waitlistData?.status || 'none';
        const waitlistPosition = waitlistData?.position || null;
        const waitlistMessage = waitlistData?.message;
        
        // Determine if waitlist gate should show
        // Show for both 'none' (to join) and 'waiting' (to see position)
        const shouldShowWaitlist = waitlistEnabled && 
          (waitlistStatus === 'none' || waitlistStatus === 'waiting') && 
          waitlistData?.requiresWaitlist === true;
        
        setState(prev => ({
          ...prev,
          credits: data.credits,
          usage: data.usage,
          creditsPaused: data.creditsPaused || false,
          name: data.name || null,
          email: data.email || null,
          hasClaimedName: data.hasClaimedName,
          hasClaimedEmail: data.hasClaimedEmail,
          hasVerifiedEmail: data.hasVerifiedEmail,
          // Waitlist state
          waitlistEnabled,
          waitlistStatus,
          waitlistPosition,
          waitlistMessage,
          shouldShowWaitlist,
        }));
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, [state.fingerprint]);

  // Complete an action
  const completeAction = useCallback(async (
    action: string = 'default',
    optionsOrMetadata?: CompleteActionOptions | any
  ): Promise<boolean> => {
    if (!apiRef.current || !state.fingerprint) return false;

    // Handle both old (metadata) and new (options) signatures
    let creditsRequired: number | undefined;
    let usdValue: number | undefined;
    let metadata: any;
    
    if (optionsOrMetadata && typeof optionsOrMetadata === 'object') {
      if ('creditsRequired' in optionsOrMetadata || 'usdValue' in optionsOrMetadata || 'metadata' in optionsOrMetadata) {
        // New signature with options
        creditsRequired = optionsOrMetadata.creditsRequired;
        usdValue = optionsOrMetadata.usdValue;
        metadata = optionsOrMetadata.metadata;
      } else {
        // Old signature with just metadata
        metadata = optionsOrMetadata;
      }
    }

    try {
      const response = await apiRef.current.completeAction(
        state.fingerprint,
        action,
        creditsRequired,
        usdValue,
        metadata
      );

      if (response.success && response.data) {
        // Refresh from server to get the latest state for all components
        await refresh();
        
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
          name: response.data!.name || prev.name,
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
          email: response.data!.email || prev.email,
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
    if (!apiRef.current || state.waitlistStatus === 'waiting') return false;

    try {
      const response = await apiRef.current.joinWaitlist(
        email,
        state.fingerprint || undefined,
        metadata
      );

      if (response.success && response.data?.joined) {
        setState(prev => ({
          ...prev,
          waitlistStatus: 'waiting',
          waitlistPosition: response.data!.position || null,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Join waitlist failed:', error);
      return false;
    }
  }, [state.fingerprint, state.waitlistStatus]);

  // Get referral link
  const getReferralLink = useCallback((): string => {
    if (!state.referralCode) return '';
    
    // Always use the app's domain for referral links, not the API URL
    const baseUrl = window.location.origin;
    return `${baseUrl}/r/${state.referralCode}`;
  }, [state.referralCode]);

  // Share functionality
  const share = useCallback(async (options?: ShareOptions): Promise<boolean> => {
    const referralLink = getReferralLink();
    
    if (config.debug) {
      console.log('[GrowthKit] Share - Referral Code:', state.referralCode);
      console.log('[GrowthKit] Share - Referral Link:', referralLink);
    }
    
    // If no referral code, can't share
    if (!referralLink) {
      console.warn('[GrowthKit] No referral code available to share');
      return false;
    }
    
    const shareTitle = options?.title || 'Check out this app!';
    const shareText = options?.text || 'Join me and get free credits!';
    
    try {
      // Use native share API if available
      if (navigator.share) {
        // Include both text and URL but keep them separate to avoid duplication
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: referralLink,
        });
        return true;
      }

      // Fallback to clipboard - copy the full message with link
      const fullMessage = `${shareText} ${referralLink}`;
      await navigator.clipboard.writeText(fullMessage);
      
      // Show some feedback (you might want to use a toast library)
      if (config.debug) {
        console.log('Copied to clipboard:', fullMessage);
      }
      
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      
      // Last fallback: open a new window with pre-filled tweet
      const tweetText = `${shareText} ${referralLink}`;
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(tweetUrl, '_blank');
      
      return false;
    }
  }, [config.debug, state.referralCode, getReferralLink]);

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

  // Accept waitlist invitation
  const acceptInvitation = useCallback(async (): Promise<boolean> => {
    if (!apiRef.current || !state.fingerprint) return false;
    
    // Only allow if status is 'invited'
    if (state.waitlistStatus !== 'invited') {
      if (config.debug) {
        console.log('Cannot accept invitation - status is not invited:', state.waitlistStatus);
      }
      return false;
    }

    try {
      // For now, accepting invitation just means joining/completing registration
      // The actual status update happens server-side when user takes actions
      setState(prev => ({
        ...prev,
        waitlistStatus: 'accepted',
        shouldShowWaitlist: false,
      }));
      
      // Refresh to get latest state from server
      await refresh();
      
      return true;
    } catch (error) {
      if (config.debug) {
        console.error('Accept invitation failed:', error);
      }
      return false;
    }
  }, [state.fingerprint, state.waitlistStatus, config.debug, refresh]);

  // Combine state and actions
  const actions: GrowthKitActions = {
    refresh,
    completeAction,
    claimName,
    claimEmail,
    verifyEmail,
    joinWaitlist,
    acceptInvitation,
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
