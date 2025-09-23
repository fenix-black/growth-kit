'use client';

import { useState } from 'react';
import { WaitlistForm } from '@fenixblack/growthkit';
import { useGrowthKit } from '@fenixblack/growthkit';

export default function WaitlistPage() {
  const growthKit = useGrowthKit({
    apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY || 'your-api-key-here',
    apiUrl: `${process.env.NEXT_PUBLIC_GROWTHKIT_SERVER_URL || 'https://growth.fenixblack.ai'}/api`
  });
  const { user, joinWaitlist } = growthKit;
  const [email, setEmail] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [customJoinStatus, setCustomJoinStatus] = useState<string>('');

  const handleCustomJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomJoinStatus('Joining...');
    
    try {
      const result = await joinWaitlist(email, invitationCode || undefined);
      if (result.success) {
        setCustomJoinStatus(`Success! Position: ${result.position}`);
        setEmail('');
        setInvitationCode('');
      } else {
        setCustomJoinStatus(`Error: ${result.error || 'Failed to join'}`);
      }
    } catch (error) {
      setCustomJoinStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Waitlist Testing</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Using WaitlistForm Component</h2>
          <div className="bg-white border rounded-lg p-6">
            <WaitlistForm 
              growthKit={growthKit}
              className="space-y-4"
              onSuccess={(position) => {
                alert(`Successfully joined! Position: ${position}`);
              }}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Using Hook Directly</h2>
          <div className="bg-white border rounded-lg p-6">
            <form onSubmit={handleCustomJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Invitation Code (Optional)
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter code if you have one"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Join Waitlist
              </button>

              {customJoinStatus && (
                <p className={`text-sm ${
                  customJoinStatus.includes('Success') ? 'text-green-600' : 
                  customJoinStatus.includes('Error') ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {customJoinStatus}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {user && (
        <div className="mt-8 bg-gray-50 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Current User Info</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email || 'Not set'}</p>
            <p><strong>Verified:</strong> {user.isVerified ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
