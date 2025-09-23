'use client';

import { useGrowthKit } from '@fenixblack/growthkit';
import { useState } from 'react';

export default function DashboardPage() {
  const growthKit = useGrowthKit({
    apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY || 'your-api-key-here',
    apiUrl: `${process.env.NEXT_PUBLIC_GROWTHKIT_SERVER_URL || 'https://growth.fenixblack.ai'}/api`
  });
  const { claimEmail, claimName, sendVerificationEmail, verifyEmail } = growthKit;
  const user = growthKit.initialized ? growthKit : null;
  const [emailToClaim, setEmailToClaim] = useState('');
  const [nameToClaim, setNameToClaim] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [status, setStatus] = useState('');

  const handleClaimEmail = async () => {
    setStatus('Claiming email...');
    try {
      const result = await claimEmail(emailToClaim);
      setStatus(result.success ? 'Email claimed!' : `Error: ${result.error}`);
      if (result.success) setEmailToClaim('');
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleClaimName = async () => {
    setStatus('Claiming name...');
    try {
      const result = await claimName(nameToClaim);
      setStatus(result.success ? 'Name claimed!' : `Error: ${result.error}`);
      if (result.success) setNameToClaim('');
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleSendVerification = async () => {
    setStatus('Sending verification email...');
    try {
      const result = await sendVerificationEmail();
      setStatus(result.success ? 'Verification email sent!' : `Error: ${result.error}`);
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleVerifyEmail = async () => {
    setStatus('Verifying...');
    try {
      const result = await verifyEmail(verificationCode);
      setStatus(result.success ? 'Email verified!' : `Error: ${result.error}`);
      if (result.success) setVerificationCode('');
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Protected Dashboard</h1>

      {!user ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Access Restricted</h2>
          <p className="text-gray-600">
            You need to be logged in to access this dashboard.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Join the waitlist first to get access.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Profile</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="font-mono">{growthKit.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p>{growthKit.email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p>{growthKit.name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className={growthKit.hasVerifiedEmail ? 'text-green-600' : 'text-yellow-600'}>
                  {growthKit.hasVerifiedEmail ? 'Yes ✓' : 'No ✗'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Points</p>
                <p className="text-2xl font-bold">{growthKit.credits || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Referral Code</p>
                <p className="font-mono">{growthKit.referralCode || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Claim Email Section */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Claim Email</h2>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailToClaim}
                onChange={(e) => setEmailToClaim(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={handleClaimEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Claim
              </button>
            </div>
          </div>

          {/* Claim Name Section */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Claim Name</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameToClaim}
                onChange={(e) => setNameToClaim(e.target.value)}
                placeholder="Your Name"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={handleClaimName}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Claim
              </button>
            </div>
          </div>

          {/* Email Verification Section */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Email Verification</h2>
            {!growthKit.hasVerifiedEmail ? (
              <div className="space-y-4">
                <button
                  onClick={handleSendVerification}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  disabled={!growthKit.email}
                >
                  {growthKit.email ? 'Send Verification Email' : 'Claim email first'}
                </button>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter verification code"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    onClick={handleVerifyEmail}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Verify
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-green-600 font-semibold">✓ Email is verified</p>
            )}
          </div>

          {/* Status Messages */}
          {status && (
            <div className={`p-4 rounded-lg ${
              status.includes('Error') ? 'bg-red-50 text-red-700' : 
              'bg-green-50 text-green-700'
            }`}>
              {status}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
