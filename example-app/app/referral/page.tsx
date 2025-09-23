'use client';

import { useGrowthKit } from '@fenixblack/growthkit';
import { useState, useEffect } from 'react';

export default function ReferralPage() {
  const { user, exchangeReferralCode } = useGrowthKit({
    apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY || 'your-api-key-here',
    apiUrl: `${process.env.NEXT_PUBLIC_GROWTHKIT_SERVER_URL || 'https://growth.fenixblack.ai'}/api`
  });
  const [referralLink, setReferralLink] = useState('');
  const [codeToExchange, setCodeToExchange] = useState('');
  const [exchangeStatus, setExchangeStatus] = useState('');

  useEffect(() => {
    if (user?.referralCode) {
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}/r/${user.referralCode}`);
    }
  }, [user?.referralCode]);

  const handleExchangeCode = async () => {
    setExchangeStatus('Exchanging...');
    try {
      const result = await exchangeReferralCode(codeToExchange);
      if (result.success) {
        setExchangeStatus(`Success! You earned ${result.pointsEarned} points. Total: ${result.totalPoints}`);
        setCodeToExchange('');
      } else {
        setExchangeStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setExchangeStatus(`Error: ${error}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Referral System Test</h1>

      <div className="space-y-6">
        {/* Your Referral Info */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Referral Information</h2>
          
          {user?.referralCode ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Referral Code</p>
                <p className="text-2xl font-mono font-bold text-blue-600">
                  {user.referralCode}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Your Referral Link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Share this link to earn points when people join
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Your Points</p>
                <p className="text-3xl font-bold text-green-600">
                  {user.points || 0}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-yellow-700">
                Join the waitlist first to get your referral code
              </p>
            </div>
          )}
        </div>

        {/* Exchange Someone's Code */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Use a Referral Code</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enter someone else's referral code to give them points
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={codeToExchange}
              onChange={(e) => setCodeToExchange(e.target.value)}
              placeholder="Enter referral code"
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={handleExchangeCode}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Exchange Code
            </button>
          </div>

          {exchangeStatus && (
            <p className={`mt-3 text-sm ${
              exchangeStatus.includes('Success') ? 'text-green-600' : 
              exchangeStatus.includes('Error') ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {exchangeStatus}
            </p>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-gray-50 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">How Referrals Work</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex">
              <span className="font-bold mr-2">1.</span>
              <span>Share your referral link with friends</span>
            </li>
            <li className="flex">
              <span className="font-bold mr-2">2.</span>
              <span>When they visit your link, a tracking cookie is set</span>
            </li>
            <li className="flex">
              <span className="font-bold mr-2">3.</span>
              <span>If they join the waitlist, you earn points</span>
            </li>
            <li className="flex">
              <span className="font-bold mr-2">4.</span>
              <span>You can also exchange referral codes directly for points</span>
            </li>
          </ol>
        </div>

        {/* Test Referral Route */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Test Referral Route</h3>
          <p className="text-sm text-gray-700 mb-3">
            The middleware should handle /r/[code] routes automatically.
            Try visiting a referral link to see it in action:
          </p>
          {user?.referralCode && (
            <a 
              href={`/r/${user.referralCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Test Your Referral Route →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
