import { useEffect, useCallback, useRef } from 'react';
import { GrowthKitAPI } from './api';
import { getFingerprint } from './fingerprint';
import { useGrowthKitConfig } from './components/GrowthKitProvider';
import { useGrowthKitState } from './components/GrowthKitStateProvider';
import { getBrowserContext, generateSessionId } from './context';
import type {
  GrowthKitConfig,
  GrowthKitState,
  GrowthKitActions,
  GrowthKitHook,
  ShareOptions,
  CompleteActionOptions,
  TrackedEvent,
} from './types';

// Initial state is now managed in GrowthKitStateProvider

// Constants for event batching
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 30000; // 30 seconds

export function useGrowthKit(): GrowthKitHook {
  const { config, setTheme, currentLanguage } = useGrowthKitConfig();
  const { state, setState, apiRef, initRef } = useGrowthKitState();
  const configRef = useRef(config);
  configRef.current = config;
  
  // Event tracking state
  const eventQueueRef = useRef<TrackedEvent[]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const contextRef = useRef(getBrowserContext());
  
  // Log initial context for debugging
  useEffect(() => {
    if (config.debug) {
      console.log('Initial browser context:', getBrowserContext());
    }
  }, [config.debug]);

  // Initialize API client
  useEffect(() => {
    // In proxy mode, no API key is required (it's handled server-side)
    // In public mode, public key is required
    // In direct mode, API key is required
    apiRef.current = new GrowthKitAPI(config.apiKey, config.publicKey, config.apiUrl, config.debug, currentLanguage);
  }, [config.apiKey, config.publicKey, config.apiUrl, config.debug]); // Remove currentLanguage from deps

  // Update language on existing API instance when it changes
  useEffect(() => {
    if (apiRef.current && currentLanguage) {
      apiRef.current.setLanguage(currentLanguage);
      if (config.debug) {
        console.log('[GrowthKit] Updated API language to:', currentLanguage);
      }
    }
  }, [currentLanguage, config.debug]);

  // Track previous language to detect changes
  const prevLanguageRef = useRef(currentLanguage);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use a global flag to prevent multiple refreshes from different hook instances
  const globalRefreshKey = `growthkit_refresh_${config.publicKey || config.apiKey || 'default'}`;
  const isRefreshingRef = useRef(false);

  // Initialize fingerprint and fetch user data
  const initialize = useCallback(async () => {
    if (!apiRef.current || initRef.current) return;
    initRef.current = true;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      if (configRef.current.debug) {
        console.log('[GrowthKit] Starting initialization...');
      }

      // Get browser fingerprint
      const fingerprint = await getFingerprint();
      apiRef.current.setFingerprint(fingerprint);

      if (configRef.current.debug) {
        console.log('[GrowthKit] Fingerprint obtained:', fingerprint.substring(0, 10) + '...');
      }

      // Check for URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const refClaim = urlParams.get('ref');
      const invitation = urlParams.get('invitation');
      const verifyToken = urlParams.get('verify');
      
      if (configRef.current.debug) {
        if (refClaim) console.log('[GrowthKit] Referral claim found in URL:', refClaim);
        if (invitation) console.log('[GrowthKit] Invitation code found in URL:', invitation);
        if (verifyToken) console.log('[GrowthKit] Verification token found in URL:', verifyToken);
      }

      // Process parameters
      if (refClaim) {
        try {
          const referralResponse = await apiRef.current.checkReferral(fingerprint, refClaim);
          if (configRef.current.debug) {
            console.log('[GrowthKit] Referral processed:', referralResponse);
          }
        } catch (error) {
          if (configRef.current.debug) {
            console.log('[GrowthKit] Referral processing failed:', error);
          }
        }
      }

      if (invitation) {
        try {
          // Process invitation code (different from referral)
          const invitationResponse = await apiRef.current.redeemInvitation(fingerprint, invitation);
          if (configRef.current.debug) {
            console.log('[GrowthKit] Invitation processed:', invitationResponse);
          }
        } catch (error) {
          if (configRef.current.debug) {
            console.log('[GrowthKit] Invitation processing failed:', error);
          }
        }
      }

      if (verifyToken) {
        try {
          const verifyResponse = await apiRef.current.verifyEmail(fingerprint, verifyToken);
          if (configRef.current.debug) {
            console.log('[GrowthKit] Email verification processed:', verifyResponse);
          }
        } catch (error) {
          if (configRef.current.debug) {
            console.log('[GrowthKit] Email verification failed:', error);
          }
        }
      }

      // Clean up URL after processing
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const cleanUrl = new URL(window.location.href);
        if (refClaim) cleanUrl.searchParams.delete('ref');
        if (invitation) cleanUrl.searchParams.delete('invitation');
        if (verifyToken) cleanUrl.searchParams.delete('verify');
        
        // Only update if we actually removed something
        if (refClaim || invitation || verifyToken) {
          window.history.replaceState({}, '', cleanUrl.toString());
        }
      }
      
      // Fetch user data
      const response = await apiRef.current.getMe(fingerprint);
      
      if (configRef.current.debug) {
        console.log('[GrowthKit] API Response Data:', response);
      }
      
      if (!response.success) {
        // Log detailed error information for debugging
        if (configRef.current.debug) {
          console.error('[GrowthKit] API Error Details:', {
            endpoint: '/v1/me',
            fingerprint: fingerprint.substring(0, 10) + '...',
            claim: refClaim,
            error: response.error,
            timestamp: new Date().toISOString(),
            apiUrl: apiRef.current ? 'set' : 'not set'
          });
        }

        // Graceful degradation: Set minimal state instead of throwing
        console.warn('[GrowthKit] Failed to fetch user data, using fallback state:', response.error || 'Unknown error');
        
        setState(prev => ({
          ...prev,
          loading: false,
          initialized: true,
          error: new Error(response.error || 'Failed to fetch user data'),
          fingerprint,
          // Set minimal default state
          credits: 0,
          usage: 0,
          referralCode: null,
          creditsPaused: false,
          policy: null,
          name: null,
          email: null,
          hasClaimedName: false,
          hasClaimedEmail: false,
          hasVerifiedEmail: false,
          waitlistEnabled: false,
          waitlistStatus: 'none',
          waitlistPosition: null,
          waitlistMessage: undefined,
          shouldShowWaitlist: false,
        }));
        
        return; // Exit gracefully without throwing
      }

      const data = response.data!;
      
      if (configRef.current.debug) {
        console.log('[GrowthKit] Raw API response structure:', {
          fullResponse: response,
          data: data,
          dataKeys: Object.keys(data || {}),
          nameValue: data.name,
          emailValue: data.email,
          hasClaimedNameValue: data.hasClaimedName,
        });
      }
      
      // URL cleanup is now handled in the referral processing section above

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
        waitlist: waitlistData, // Full waitlist data including count
        // App branding
        app: data.app,
      });

      if (configRef.current.debug) {
        console.log('[GrowthKit] Successfully initialized with data:', {
          credits: data.credits,
          hasName: !!data.name,
          hasEmail: !!data.email,
          verified: data.hasVerifiedEmail,
          waitlistEnabled: waitlistEnabled,
          waitlistStatus: waitlistStatus,
          referralCode: data.referralCode?.substring(0, 8) + '...' || 'none'
        });
      }
    } catch (error) {
      // Enhanced error logging for debugging
      if (configRef.current.debug) {
        console.error('[GrowthKit] Initialization Error Details:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          fingerprint: state.fingerprint?.substring(0, 10) + '...' || 'not set',
          apiUrl: apiRef.current ? 'configured' : 'not configured',
          initAttempted: initRef.current
        });
      }

      // Graceful degradation: Set error state but allow widget to continue in minimal mode
      console.warn('[GrowthKit] Initialization failed, widget will run in minimal mode:', error instanceof Error ? error.message : 'Unknown error');
      
      setState(prev => ({
        ...prev,
        loading: false,
        initialized: true, // Still mark as initialized to allow minimal functionality
        error: error instanceof Error ? error : new Error('Unknown error'),
        // Set minimal default state
        credits: 0,
        usage: 0,
        referralCode: null,
        creditsPaused: false,
        policy: null,
        name: null,
        email: null,
        hasClaimedName: false,
        hasClaimedEmail: false,
        hasVerifiedEmail: false,
        waitlistEnabled: false,
        waitlistStatus: 'none',
        waitlistPosition: null,
        waitlistMessage: undefined,
        shouldShowWaitlist: false,
      }));
    }
  }, []); // No deps to avoid re-creation

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []); // Empty deps to run only once on mount

  // Refresh user data
  const refresh = useCallback(async () => {
    if (!apiRef.current || !state.fingerprint) {
      if (configRef.current.debug) {
        console.warn('[GrowthKit] Refresh skipped: API or fingerprint not available');
      }
      return;
    }

    try {
      if (configRef.current.debug) {
        console.log('[GrowthKit] Refreshing user data...');
      }

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
          waitlist: waitlistData, // Full waitlist data including count
          // App branding
          app: data.app,
        }));

        if (configRef.current.debug) {
          console.log('[GrowthKit] Refresh successful, credits:', data.credits);
        }
      } else {
        // Log detailed error information for debugging
        if (configRef.current.debug) {
          console.error('[GrowthKit] Refresh API Error Details:', {
            endpoint: '/v1/me',
            fingerprint: state.fingerprint.substring(0, 10) + '...',
            error: response.error,
            timestamp: new Date().toISOString()
          });
        }
        console.warn('[GrowthKit] Refresh failed:', response.error || 'Unknown error');
      }
    } catch (error) {
      // Enhanced error logging for debugging
      if (configRef.current.debug) {
        console.error('[GrowthKit] Refresh Error Details:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          fingerprint: state.fingerprint.substring(0, 10) + '...',
          timestamp: new Date().toISOString()
        });
      }
      console.warn('[GrowthKit] Refresh failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [state.fingerprint]);

  // Refresh data when language changes (but not on initial mount)
  useEffect(() => {
    if (prevLanguageRef.current !== currentLanguage && state.initialized && !state.loading) {
      if (configRef.current.debug) {
        console.log('[GrowthKit] Language changed from', prevLanguageRef.current, 'to', currentLanguage, '- checking for refresh');
      }
      prevLanguageRef.current = currentLanguage;
      
      // Use a global flag to coordinate refreshes between multiple hook instances
      if (typeof window !== 'undefined') {
        const windowAny = window as any;
        
        // Check if another instance is already handling the refresh
        if (windowAny[globalRefreshKey]) {
          if (configRef.current.debug) {
            console.log('[GrowthKit] Another instance is already handling the refresh, skipping');
          }
          return;
        }
        
        // Mark that we're handling the refresh
        windowAny[globalRefreshKey] = true;
        
        // Clear any existing timeout to prevent multiple refreshes
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        // Debounce the refresh call to prevent multiple rapid requests
        refreshTimeoutRef.current = setTimeout(() => {
          if (configRef.current.debug) {
            console.log('[GrowthKit] Executing debounced refresh for language change');
          }
          refresh();
          refreshTimeoutRef.current = null;
          
          // Clear the global flag after refresh
          if (windowAny[globalRefreshKey]) {
            delete windowAny[globalRefreshKey];
          }
        }, 200); // Increased to 200ms for better debouncing
      }
    }
  }, [currentLanguage, state.initialized, state.loading, refresh, globalRefreshKey]);

  // Complete an action
  const completeAction = useCallback(async (
    action: string = 'default',
    optionsOrMetadata?: CompleteActionOptions | any
  ): Promise<boolean> => {
    if (!apiRef.current || !state.fingerprint) {
      if (configRef.current.debug) {
        console.warn('[GrowthKit] completeAction skipped: API or fingerprint not available');
      }
      return false;
    }

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
      if (configRef.current.debug) {
        console.log('[GrowthKit] Completing action:', {
          action,
          creditsRequired,
          usdValue,
          hasMetadata: !!metadata
        });
      }

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
        
        if (configRef.current.debug) {
          console.log('[GrowthKit] Action completed successfully:', action);
        }
        
        return true;
      } else {
        if (configRef.current.debug) {
          console.error('[GrowthKit] Action API Error Details:', {
            action,
            endpoint: '/v1/complete',
            error: response.error,
            timestamp: new Date().toISOString()
          });
        }
        console.warn('[GrowthKit] Action failed:', response.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      if (configRef.current.debug) {
        console.error('[GrowthKit] Action Error Details:', {
          action,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
      }
      console.warn('[GrowthKit] Complete action failed:', error instanceof Error ? error.message : 'Unknown error');
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
        // Refresh user data from server to get updated credits and email
        await refresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Join waitlist failed:', error);
      return false;
    }
  }, [state.fingerprint, state.waitlistStatus, refresh]);

  // Get referral link
  const getReferralLink = useCallback((): string => {
    if (!state.referralCode) return '';
    
    // Use simple query parameter approach - no middleware needed
    const baseUrl = window.location.origin;
    return `${baseUrl}/?ref=${state.referralCode}`;
  }, [state.referralCode]);

  // Helper: Get file extension from MIME type
  const getExtensionFromMimeType = (mimeType: string): string => {
    const mimeMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/ogg': 'ogv',
      'video/quicktime': 'mov',
    };
    return mimeMap[mimeType] || 'bin';
  };

  // Helper: Convert Blob to File with proper filename
  const blobToFile = (blob: Blob, filename?: string, index: number = 0): File => {
    // If filename provided, use it
    if (filename) {
      return new File([blob], filename, { type: blob.type });
    }
    
    // Generate filename from MIME type and timestamp
    const ext = getExtensionFromMimeType(blob.type);
    const timestamp = Date.now();
    const generatedName = `share-${timestamp}-${index}.${ext}`;
    
    return new File([blob], generatedName, { type: blob.type });
  };

  // Helper: Trigger file download (fallback when native share not available)
  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Share functionality
  const share = useCallback(async (options?: ShareOptions): Promise<boolean> => {
    const referralLink = getReferralLink();
    
    if (config.debug) {
      console.log('[GrowthKit] Share - Referral Code:', state.referralCode);
      console.log('[GrowthKit] Share - Referral Link:', referralLink);
      console.log('[GrowthKit] Share - Options:', options);
    }
    
    // If no referral code, can't share
    if (!referralLink) {
      console.warn('[GrowthKit] No referral code available to share');
      return false;
    }
    
    const shareTitle = options?.title || 'Check out this app!';
    const shareText = options?.text || 'Join me and get free credits!';
    // Always use referral link by default, but allow override
    const shareUrl = options?.url !== undefined ? options.url : referralLink;
    
    // Process files if provided
    let shareFiles: File[] | undefined;
    if (options?.files && options.files.length > 0) {
      shareFiles = options.files.map((fileOrBlob, index) => {
        // If already a File, use it
        if (fileOrBlob instanceof File) {
          return fileOrBlob;
        }
        // Convert Blob to File with custom or generated filename
        const customFilename = options.filenames?.[index];
        return blobToFile(fileOrBlob, customFilename, index);
      });

      if (config.debug) {
        console.log('[GrowthKit] Share - Files prepared:', shareFiles.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size
        })));
      }
    }
    
    try {
      // Check if native share API is available
      if (navigator.share) {
        // Prepare share data
        const shareData: ShareData = {
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        };

        // Add files if provided and supported
        if (shareFiles && shareFiles.length > 0) {
          shareData.files = shareFiles;
        }

        // Check if the data can be shared (important for files)
        if (navigator.canShare && !navigator.canShare(shareData)) {
          if (config.debug) {
            console.warn('[GrowthKit] Share data not supported by this device:', shareData);
          }
          // Fall through to fallback
        } else {
          // Attempt native share
          await navigator.share(shareData);
          return true;
        }
      }

      // Fallback handling
      if (shareFiles && shareFiles.length > 0) {
        // If files are included but native share not available, download them
        if (config.debug) {
          console.log('[GrowthKit] Native share not available, downloading files...');
        }
        
        shareFiles.forEach(file => downloadFile(file));
        
        // Also copy the text + URL to clipboard
        const fullMessage = shareUrl ? `${shareText} ${shareUrl}` : shareText;
        try {
          await navigator.clipboard.writeText(fullMessage);
          if (config.debug) {
            console.log('[GrowthKit] Files downloaded, message copied to clipboard');
          }
        } catch (clipboardError) {
          if (config.debug) {
            console.warn('[GrowthKit] Clipboard copy failed:', clipboardError);
          }
        }
        
        return true;
      } else {
        // No files - fallback to clipboard for text + URL
        const fullMessage = shareUrl ? `${shareText} ${shareUrl}` : shareText;
        await navigator.clipboard.writeText(fullMessage);
        
        if (config.debug) {
          console.log('[GrowthKit] Copied to clipboard:', fullMessage);
        }
        
        return true;
      }
    } catch (error) {
      // Handle various share API errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // User cancelled the share dialog - this is normal
          if (config.debug) {
            console.log('[GrowthKit] Share cancelled by user');
          }
          return false;
        } else if (error.name === 'NotAllowedError') {
          console.error('[GrowthKit] Share permission denied');
        } else if (error.name === 'DataError') {
          console.error('[GrowthKit] Share data invalid (files may be too large)');
        } else {
          console.error('[GrowthKit] Share failed:', error.message);
        }
      } else {
        console.error('[GrowthKit] Share failed:', error);
      }
      
      // Last fallback: open Twitter with pre-filled text (only if no files)
      if (!shareFiles || shareFiles.length === 0) {
        const tweetText = shareUrl ? `${shareText} ${shareUrl}` : shareText;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(tweetUrl, '_blank');
      }
      
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

  // Send batched events
  const sendEvents = useCallback(async () => {
    if (!apiRef.current || eventQueueRef.current.length === 0) return;
    
    // Ensure fingerprint is set before sending
    if (state.fingerprint) {
      apiRef.current.setFingerprint(state.fingerprint);
      if (config.debug) {
        console.log(`Set fingerprint for tracking: ${state.fingerprint}`);
      }
    } else if (config.debug) {
      console.warn('No fingerprint available for tracking');
    }

    const eventsToSend = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      const currentContext = getBrowserContext();
      if (config.debug) {
        console.log('Current context before sending:', currentContext);
      }
      await apiRef.current.trackEvents(eventsToSend, currentContext, sessionIdRef.current);
      if (config.debug) {
        console.log(`Sent ${eventsToSend.length} events with context:`, currentContext);
      }
    } catch (error) {
      if (config.debug) {
        console.error('Failed to send events:', error);
      }
      // Re-queue events on failure
      eventQueueRef.current = [...eventsToSend, ...eventQueueRef.current];
    }
  }, [config.debug, state.fingerprint]);

  // Track event
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (!state.fingerprint) {
      if (config.debug) {
        console.warn('Cannot track event - no fingerprint available');
      }
      return;
    }

    // Add event to queue
    eventQueueRef.current.push({
      eventName,
      properties,
      timestamp: Date.now(),
    });

    // Update context when tracking
    contextRef.current = getBrowserContext();

    // Send immediately if batch size reached
    if (eventQueueRef.current.length >= BATCH_SIZE) {
      sendEvents();
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
    } else if (!batchTimerRef.current) {
      // Start batch timer if not already running
      batchTimerRef.current = setTimeout(() => {
        sendEvents();
        batchTimerRef.current = null;
      }, BATCH_INTERVAL);
    }
  }, [state.fingerprint, config.debug, sendEvents]);

  // Send events on unmount or page unload
  useEffect(() => {
    const handleUnload = () => {
      if (eventQueueRef.current.length > 0 && apiRef.current) {
        // Use sendBeacon for reliability
        const data = JSON.stringify({
          events: eventQueueRef.current,
        });
        const headers = {
          type: 'application/json',
        };
        const blob = new Blob([data], headers);
        navigator.sendBeacon(
          `${apiRef.current['apiUrl']}/v1/track`,
          blob
        );
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      // Clear global refresh flag if set
      if (typeof window !== 'undefined') {
        const windowAny = window as any;
        if (windowAny[globalRefreshKey]) {
          delete windowAny[globalRefreshKey];
        }
      }
      // Send any remaining events
      sendEvents();
    };
  }, [sendEvents, globalRefreshKey]);

  // Join product waitlist
  const joinProductWaitlist = useCallback(async (
    productTag: string,
    email: string
  ): Promise<boolean> => {
    if (!apiRef.current) return false;

    try {
      const response = await apiRef.current.joinWaitlist(
        email,
        state.fingerprint || undefined,
        undefined,
        productTag
      );

      if (response.success) {
        // Refresh to get updated product waitlist status
        await refresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Join product waitlist failed:', error);
      return false;
    }
  }, [state.fingerprint]);

  // Get product waitlist status
  const getProductWaitlistStatus = useCallback((productTag: string) => {
    const products = (state.waitlist as any)?.products || {};
    return products[productTag] || { isOnList: false, status: 'none' };
  }, [state.waitlist]);

  // Combine state and actions
  const actions: GrowthKitActions = {
    refresh,
    completeAction,
    claimName,
    claimEmail,
    verifyEmail,
    joinWaitlist,
    joinProductWaitlist,
    getProductWaitlistStatus,
    acceptInvitation,
    share,
    getReferralLink,
    shouldShowSoftPaywall,
    canPerformAction,
    track,
    setTheme: setTheme || (() => {}), // Fallback for when setTheme is not available
  };

  return {
    ...state,
    ...actions,
  };
}
