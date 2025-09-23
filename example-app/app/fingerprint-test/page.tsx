'use client';

import { useState, useEffect } from 'react';
import { useGrowthKit } from '@fenixblack/growthkit';

export default function FingerprintTest() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isClient, setIsClient] = useState(false);
  
  // Test the useGrowthKit hook
  const growthKit = useGrowthKit({
    apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY || 'test-api-key',
    apiUrl: `${process.env.NEXT_PUBLIC_GROWTHKIT_SERVER_URL || 'https://growth.fenixblack.ai'}/api`,
    debug: true
  });

  useEffect(() => {
    setIsClient(true);
    
    // Test direct fingerprint generation
    const testFingerprint = async () => {
      try {
        console.log('=== Starting Fingerprint Debug ===');
        console.log('Browser environment check:');
        console.log('- typeof window:', typeof window);
        console.log('- typeof document:', typeof document);
        console.log('- typeof navigator:', typeof navigator);
        console.log('- document.readyState:', document.readyState);
        
        // The SDK now handles broprint.js internally
        console.log('SDK is handling fingerprint generation...');
        
        setDebugInfo({
          browserEnv: {
            hasWindow: typeof window !== 'undefined',
            hasDocument: typeof document !== 'undefined',
            hasNavigator: typeof navigator !== 'undefined',
            documentState: document.readyState,
          },
          growthKitState: {
            loading: growthKit.loading,
            initialized: growthKit.initialized,
            error: growthKit.error?.message,
            fingerprint: growthKit.fingerprint,
          },
          note: 'The SDK now handles fingerprint generation internally'
        });
        
      } catch (error) {
        console.error('Error during fingerprint test:', error);
        setDebugInfo((prev: any) => ({
          ...prev,
          error: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : null
        }));
      }
    };
    
    // Run the test after a short delay to ensure everything is loaded
    setTimeout(testFingerprint, 100);
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Fingerprint Debug Test</h1>
      
      {!isClient && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Loading client-side environment...
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">GrowthKit Hook State</h2>
          <div className="space-y-2 font-mono text-sm">
            <p><strong>Loading:</strong> {String(growthKit.loading)}</p>
            <p><strong>Initialized:</strong> {String(growthKit.initialized)}</p>
            <p><strong>Error:</strong> {growthKit.error?.message || 'None'}</p>
            <p><strong>Fingerprint:</strong> {growthKit.fingerprint ? 
              `${growthKit.fingerprint.substring(0, 20)}...` : 
              'Not generated'
            }</p>
            <p><strong>Credits:</strong> {growthKit.credits}</p>
            <p><strong>Referral Code:</strong> {growthKit.referralCode || 'Not set'}</p>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="overflow-auto">
            <pre className="text-xs bg-gray-100 p-4 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-gray-800 text-green-400 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Browser Console Output</h2>
        <p className="text-sm">Open your browser's developer console (F12) to see detailed debug logs.</p>
      </div>
      
      <div className="mt-6">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
