'use client';

import { useGrowthKit } from '@fenixblack/growthkit';

export default function Home() {
  const growthKit = useGrowthKit({
    apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY || 'your-api-key-here',
    apiUrl: `${process.env.NEXT_PUBLIC_GROWTHKIT_SERVER_URL || 'https://growth.fenixblack.ai'}/api`
  });

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">GrowthKit SDK Test Suite</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current User Status</h2>
        {growthKit.loading ? (
          <p className="text-gray-600">Loading user data...</p>
        ) : growthKit.initialized ? (
          <div className="space-y-2">
            <p><strong>Fingerprint:</strong> {growthKit.fingerprint?.slice(0, 8)}...</p>
            <p><strong>Email Claimed:</strong> {growthKit.hasClaimedEmail ? 'Yes' : 'No'}</p>
            <p><strong>Name Claimed:</strong> {growthKit.hasClaimedName ? 'Yes' : 'No'}</p>
            <p><strong>Email Verified:</strong> {growthKit.hasVerifiedEmail ? 'Yes' : 'No'}</p>
            <p><strong>Credits:</strong> {growthKit.credits || 0}</p>
            <p><strong>Referral Code:</strong> {growthKit.referralCode || 'Not set'}</p>
          </div>
        ) : (
          <p className="text-gray-600">No user data available</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Waitlist Test</h3>
          <p className="text-gray-600 mb-4">
            Test the waitlist functionality including joining with invitation codes
          </p>
          <a 
            href="/waitlist" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test Waitlist →
          </a>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Protected Dashboard</h3>
          <p className="text-gray-600 mb-4">
            Test GrowthKitGate component for protecting content
          </p>
          <a 
            href="/dashboard" 
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Access Dashboard →
          </a>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Referral System</h3>
          <p className="text-gray-600 mb-4">
            Test referral link generation and tracking
          </p>
          <a 
            href="/referral" 
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Test Referrals →
          </a>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">API Configuration</h3>
          <p className="text-gray-600 mb-4">
            Server URL: {process.env.NEXT_PUBLIC_GROWTHKIT_SERVER_URL}
          </p>
          <p className="text-xs text-gray-500">
            Make sure to set GROWTHKIT_API_KEY in your environment
          </p>
        </div>
      </div>
    </div>
  );
}