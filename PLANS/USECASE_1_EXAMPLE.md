# Use Case 1 - Example App Implementation

## Overview
This document describes the minimal example app implementation that demonstrates the complete GrowthKit user journey. The app is intentionally simple to clearly showcase the growth mechanics without distracting features.

## Core Principle
**Keep it simple**: One button that consumes credits. That's it.

## Page Structure

### Single Page Application (`/`)

```tsx
// app/page.tsx
export default function Home() {
  return (
    <GrowthKitGate>
      <MainApp />
    </GrowthKitGate>
  );
}
```

## Components

### 1. Main App Component
The core app that users see when they have access:

```tsx
function MainApp() {
  const { credits, completeAction, loading } = useGrowthKit();
  
  const handleUseFeature = async () => {
    const success = await completeAction('generate');
    if (success) {
      toast.success('Feature used! -1 credit');
    } else {
      toast.error('Not enough credits');
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>Example App</h1>
        <div className="credits-display">
          Credits: {credits}
          <button onClick={refresh}>↻</button>
        </div>
      </div>

      {/* Marketing Message (when waitlist disabled) */}
      <div className="hero">
        <h2>Welcome to Example App</h2>
        <p>Each action uses 1 credit. You get 3 free credits daily!</p>
        <p className="muted">Visit daily to claim your credits</p>
      </div>

      {/* Main Action */}
      <div className="action-area">
        <button 
          onClick={handleUseFeature}
          disabled={credits < 1 || loading}
          className="primary-button"
        >
          {loading ? 'Processing...' : 'Use Feature (1 credit)'}
        </button>
        
        {credits === 0 && (
          <p className="warning">Out of credits! Complete tasks to earn more.</p>
        )}
      </div>

      {/* Referral Section */}
      <div className="referral-section">
        <p>Share and earn credits:</p>
        <ReferralDisplay />
      </div>
    </div>
  );
}
```

### 2. GrowthKitGate Component
Wrapper that handles all conditional displays:

```tsx
function GrowthKitGate({ children }) {
  const { 
    loading, 
    initialized, 
    shouldShowWaitlist,  // Server determines this based on app config
    credits,
    waitlistEnabled      // Comes from server app configuration
  } = useGrowthKit();
  
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Show loading state
  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  // Show waitlist if required (determined by server)
  if (shouldShowWaitlist) {
    return <WaitlistForm />;
  }

  // Show credit exhaustion modal when needed
  useEffect(() => {
    if (credits === 0 && !loading) {
      setShowCreditModal(true);
    }
  }, [credits, loading]);

  return (
    <>
      {children}
      {showCreditModal && (
        <CreditExhaustionModal 
          onClose={() => setShowCreditModal(false)} 
        />
      )}
    </>
  );
}
```

### 3. Waitlist Form Component
Simple email collection form:

```tsx
function WaitlistForm() {
  const { joinWaitlist, waitlistMessage } = useGrowthKit();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await joinWaitlist(email);
    if (success) {
      toast.success('Successfully joined waitlist!');
    }
    setLoading(false);
  };

  return (
    <div className="waitlist-container">
      <h1>Example App</h1>
      <div className="waitlist-card">
        <h2>Join the Waitlist</h2>
        <p>{waitlistMessage || 'Get early access to our app'}</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Joining...' : 'Join Waitlist'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 4. Credit Exhaustion Modal
Modal with tabs for earning credits:

```tsx
function CreditExhaustionModal({ onClose }) {
  const { 
    claimName, 
    claimEmail, 
    getReferralLink,
    share,
    hasClaimedName,
    hasClaimedEmail,
    hasVerifiedEmail,
    credits
  } = useGrowthKit();
  
  const [activeTab, setActiveTab] = useState('name');

  // Auto-close if credits are restored
  useEffect(() => {
    if (credits > 0) {
      onClose();
    }
  }, [credits]);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Out of Credits!</h2>
        <p>Complete tasks below to earn more credits:</p>

        <div className="tabs">
          <button 
            className={activeTab === 'name' ? 'active' : ''}
            onClick={() => setActiveTab('name')}
            disabled={hasClaimedName}
          >
            Name {hasClaimedName && '✓'}
          </button>
          <button 
            className={activeTab === 'email' ? 'active' : ''}
            onClick={() => setActiveTab('email')}
            disabled={hasClaimedEmail}
          >
            Email {hasClaimedEmail && '✓'}
          </button>
          <button 
            className={activeTab === 'verify' ? 'active' : ''}
            onClick={() => setActiveTab('verify')}
            disabled={!hasClaimedEmail || hasVerifiedEmail}
          >
            Verify {hasVerifiedEmail && '✓'}
          </button>
          <button 
            className={activeTab === 'share' ? 'active' : ''}
            onClick={() => setActiveTab('share')}
          >
            Share
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'name' && <NameTab onClaim={claimName} />}
          {activeTab === 'email' && <EmailTab onClaim={claimEmail} />}
          {activeTab === 'verify' && <VerifyTab />}
          {activeTab === 'share' && <ShareTab />}
        </div>

        <div className="modal-footer">
          <p>Current credits: {credits}</p>
          <button onClick={onClose} disabled={credits === 0}>
            {credits > 0 ? 'Continue' : 'Need Credits First'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 5. Individual Tab Components

```tsx
// Name Tab
function NameTab({ onClaim }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const success = await onClaim(name);
    if (success) {
      toast.success('+1 credit earned!');
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Enter Your Name</h3>
      <p>Earn 1 credit by telling us your name</p>
      <input 
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />
      <button onClick={handleSubmit} disabled={loading || !name}>
        {loading ? 'Claiming...' : 'Claim 1 Credit'}
      </button>
    </div>
  );
}

// Email Tab
function EmailTab({ onClaim }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const success = await onClaim(email);
    if (success) {
      toast.success('+1 credit earned! Check email for verification.');
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Enter Your Email</h3>
      <p>Earn 1 credit + unlock email verification bonus</p>
      <input 
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
      />
      <button onClick={handleSubmit} disabled={loading || !email}>
        {loading ? 'Claiming...' : 'Claim 1 Credit'}
      </button>
    </div>
  );
}

// Share Tab
function ShareTab() {
  const { getReferralLink, share } = useGrowthKit();
  const referralLink = getReferralLink();

  const handleShare = async () => {
    const success = await share({
      title: 'Check out Example App',
      text: 'Get free credits with my referral!'
    });
    if (success) {
      toast.success('Thanks for sharing!');
    }
  };

  return (
    <div>
      <h3>Share & Earn</h3>
      <p>Earn credits for each friend who joins!</p>
      
      <div className="referral-link">
        <input 
          type="text" 
          value={referralLink} 
          readOnly 
          onClick={(e) => e.target.select()}
        />
        <button onClick={() => navigator.clipboard.writeText(referralLink)}>
          Copy
        </button>
      </div>
      
      <button onClick={handleShare} className="share-button">
        Share Now
      </button>
      
      <p className="hint">You'll earn 3 credits per referral</p>
    </div>
  );
}
```

## User Flow States

### 1. New User (Waitlist Disabled)
```
1. Lands on page → Sees marketing text
2. Receives 3 initial daily credits
3. Can immediately use the feature button
4. Credits: 3 → 2 → 1 → 0
5. Modal appears when credits = 0
```

### 2. New User (Waitlist Enabled)
```
1. Lands on page → Sees waitlist form
2. Enters email → Joins waitlist
3. Shows "On waitlist" message
4. Waits for invitation
```

### 3. Returning User
```
1. Visits next day → Auto-receives 3 credits
2. Previous balance + 3 new credits
3. Continue using features
```

### 4. Referred User
```
1. Clicks referral link → Redirected to app
2. Receives bonus credits (e.g., 5)
3. Referrer also receives credits
4. Follows normal flow with extra credits
```

### 5. Credit Exhaustion Flow
```
1. Uses all credits → Modal appears
2. Options:
   - Enter name → +1 credit → Continue
   - Enter email → +1 credit → Continue
   - Verify email → +1 credit → Continue
   - Share → Earn credits per referral
3. Can combine multiple options
```

## Styling Approach

Keep styling minimal and functional:

```css
/* Simple, clean design */
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.credits-display {
  background: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: bold;
}

.primary-button {
  background: #0070f3;
  color: white;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
}
```

## Environment Configuration

```env
# .env.local - Only needs API key and server URL

# Required
GROWTHKIT_API_KEY=your_actual_api_key_here
GROWTHKIT_API_URL=http://localhost:3000/api  # For local development
# GROWTHKIT_API_URL=https://growth.fenixblack.ai/api  # For production

# Optional (for production)
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### App Configuration (Set in GrowthKit Dashboard)

These settings are configured per app in the GrowthKit server, NOT in the example app:

- **Waitlist Mode**: `waitlistEnabled` (true/false)
- **Initial Credits Per Day**: `initialCreditsPerDay` (e.g., 3)
- **Credit Rewards**:
  - `creditsForName`: 1
  - `creditsForEmail`: 1
  - `creditsForEmailVerification`: 1
- **Referral Settings**:
  - `referralCredits`: 3 (for referrer)
  - `referredCredits`: 5 (for new user)

The SDK automatically retrieves these settings via the `/api/v1/me` endpoint based on your API key.

## Testing Scenarios

### Setup: Switching Between Modes
To test different modes, update your app configuration in the GrowthKit admin dashboard:
1. **Waitlist Mode**: Set `waitlistEnabled = true`
2. **Credits Mode**: Set `waitlistEnabled = false` and configure `initialCreditsPerDay`

### Scenario 1: Credit Consumption
1. Fresh browser/incognito
2. Load app → Should see 3 credits
3. Click button 3 times → Credits: 3 → 2 → 1 → 0
4. Modal should appear
5. Complete task → Get credit → Modal closes

### Scenario 2: Daily Grant
1. Use all credits on Day 1
2. Return on Day 2
3. Should automatically receive 3 new credits
4. Balance should be 3 (not reset, but added)

### Scenario 3: Referral Flow
1. User A shares referral link
2. User B clicks link → Gets bonus credits
3. User A should receive referral credits
4. Both can use the app

### Scenario 4: Progressive Identification
1. Start anonymous → 3 credits
2. Use all → Modal appears
3. Enter name → +1 credit
4. Enter email → +1 credit  
5. Verify email → +1 credit
6. Should have 3 total credits to continue

## Success Metrics to Display

Simple stats in corner (optional):
- Total users today
- Credits consumed today
- Active referral chains
- Conversion rate (anonymous → identified)

## Key Implementation Notes

1. **No Complex Features**: Just one button that consumes credits
2. **Clear Feedback**: Toast messages for every action
3. **Visual Credit Count**: Always visible, updates in real-time
4. **Smooth Modals**: Non-intrusive, easy to understand
5. **Mobile Responsive**: Works perfectly on all devices
6. **Fast Loading**: Minimal dependencies, optimized bundle

## Deployment Checklist

- [ ] Set up environment variables (API key and server URL only)
- [ ] Configure app in GrowthKit dashboard:
  - [ ] Set waitlist mode (enabled/disabled)
  - [ ] Configure initial credits per day
  - [ ] Set credit rewards for actions
  - [ ] Configure referral bonuses
- [ ] Test all user flows in incognito mode
- [ ] Verify email sending works
- [ ] Test referral link generation
- [ ] Check daily credit grants
- [ ] Verify modal appears at 0 credits
- [ ] Test on mobile devices
- [ ] Monitor error logs
- [ ] Set up analytics tracking

## Email Verification Flow

### URL Pattern
Email verification links follow this pattern:
```
https://your-app.com/verify?token=VERIFICATION_TOKEN
```

### Implementation in Example App
```tsx
// app/verify/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGrowthKit } from '@growthkit/sdk';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, refresh } = useGrowthKit();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    verifyEmail(token).then(async (success) => {
      if (success) {
        setStatus('success');
        await refresh(); // Update credits
        setTimeout(() => router.push('/'), 2000);
      } else {
        setStatus('error');
      }
    });
  }, []);

  return (
    <div className="verify-container">
      {status === 'verifying' && <p>Verifying your email...</p>}
      {status === 'success' && (
        <>
          <p>✓ Email verified! +1 credit earned</p>
          <p>Redirecting to app...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p>❌ Verification failed</p>
          <a href="/">Return to app</a>
        </>
      )}
    </div>
  );
}
```

## Local Development Setup

### 1. SDK Development & Linking

```bash
# In SDK directory
cd sdk
npm install
npm run build
npm link

# In example-app directory
cd ../example-app
npm link @growthkit/sdk

# For hot-reload during development
cd ../sdk
npm run dev  # This watches for changes and rebuilds
```

### 2. Environment Setup

```bash
# example-app/.env.local
GROWTHKIT_API_KEY=your_actual_api_key_here
GROWTHKIT_API_URL=http://localhost:3000/api  # For local development
# GROWTHKIT_API_URL=https://growth.fenixblack.ai/api  # For production
```

### 3. Database App Configuration

Since you already have a test app in the database, verify these settings:

```sql
-- Check your app configuration
SELECT 
  name,
  domain,
  waitlistEnabled,
  policyJson,
  corsOrigins
FROM apps 
WHERE id = 'your-test-app-id';

-- Update for testing different modes:
-- For credits mode:
UPDATE apps 
SET 
  waitlistEnabled = false,
  policyJson = '{
    "initialCreditsPerDay": 3,
    "creditsForName": 1,
    "creditsForEmail": 1,
    "creditsForEmailVerification": 1,
    "referralCredits": 3,
    "referredCredits": 5,
    "actions": {
      "generate": { "creditsRequired": 1 }
    }
  }'
WHERE id = 'your-test-app-id';

-- For waitlist mode:
UPDATE apps 
SET 
  waitlistEnabled = true,
  waitlistMessage = 'Join our exclusive early access program!'
WHERE id = 'your-test-app-id';
```

### 4. Running Everything

```bash
# Terminal 1: Run GrowthKit server
npm run dev

# Terminal 2: Build/watch SDK
cd sdk
npm run dev

# Terminal 3: Run example app
cd example-app
npm run dev
```

## Dependencies to Add

### Example App Package.json

```json
{
  "dependencies": {
    // Existing Next.js dependencies...
    "react-hot-toast": "^2.4.1",  // For toast notifications
    "@growthkit/sdk": "link:../sdk"  // Local SDK link
  }
}
```

### Toast Setup in Layout

```tsx
// app/layout.tsx
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
```

## Quick Validation Scripts

### Setup
First, ensure your `.env.local` file has the required variables:
```bash
# .env.local
GROWTHKIT_API_KEY=your_actual_api_key
GROWTHKIT_API_URL=http://localhost:3000/api  # or https://growth.fenixblack.ai/api
```

Then install dotenv if needed:
```bash
npm install --save-dev dotenv
```

### 1. Test Credit System (self-contained)
```javascript
// scripts/test-credits.js
// Run with: node -r dotenv/config scripts/test-credits.js dotenv_config_path=.env.local

const API_KEY = process.env.GROWTHKIT_API_KEY;
const API_URL = process.env.GROWTHKIT_API_URL || 'http://localhost:3000/api';

if (!API_KEY) {
  console.error('❌ GROWTHKIT_API_KEY not found in .env.local');
  process.exit(1);
}

const TEST_FINGERPRINT = 'test-' + Date.now();

async function testCreditFlow() {
  console.log('Testing credit flow...');
  console.log('Using API URL:', API_URL);
  
  // 1. Initialize fingerprint
  const meResponse = await fetch(`${API_URL}/v1/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ fingerprint: TEST_FINGERPRINT })
  });
  
  const userData = await meResponse.json();
  console.log('Initial credits:', userData.data.credits);
  
  // 2. Use a credit
  const completeResponse = await fetch(`${API_URL}/v1/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ 
      fingerprint: TEST_FINGERPRINT,
      action: 'generate'
    })
  });
  
  const completeData = await completeResponse.json();
  console.log('Credits after action:', completeData.data.creditsRemaining);
  
  // 3. Claim name for credit
  const nameResponse = await fetch(`${API_URL}/v1/claim/name`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ 
      fingerprint: TEST_FINGERPRINT,
      name: 'Test User'
    })
  });
  
  const nameData = await nameResponse.json();
  console.log('Credits after name claim:', nameData.data.totalCredits);
  
  console.log('✅ Credit flow test complete');
}

testCreditFlow().catch(console.error);
```

### 2. Test Referral Flow
```javascript
// scripts/test-referral.js
// Run with: node -r dotenv/config scripts/test-referral.js dotenv_config_path=.env.local

const API_KEY = process.env.GROWTHKIT_API_KEY;
const API_URL = process.env.GROWTHKIT_API_URL || 'http://localhost:3000/api';

if (!API_KEY) {
  console.error('❌ GROWTHKIT_API_KEY not found in .env.local');
  process.exit(1);
}

async function testReferralFlow() {
  console.log('Testing referral flow...');
  console.log('Using API URL:', API_URL);
  
  // 1. Create referrer
  const referrerFp = 'referrer-' + Date.now();
  const referrerResponse = await fetch(`${API_URL}/v1/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ fingerprint: referrerFp })
  });
  
  const referrerData = await referrerResponse.json();
  const referralCode = referrerData.data.referralCode;
  console.log('Referrer code:', referralCode);
  
  // 2. Exchange referral code for claim token
  const exchangeResponse = await fetch(`${API_URL}/v1/referral/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ code: referralCode })
  });
  
  const exchangeData = await exchangeResponse.json();
  const claimToken = exchangeData.data.claim;
  console.log('Claim token:', claimToken);
  
  // 3. New user claims referral
  const referredFp = 'referred-' + Date.now();
  const referredResponse = await fetch(`${API_URL}/v1/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ 
      fingerprint: referredFp,
      claim: claimToken
    })
  });
  
  const referredData = await referredResponse.json();
  console.log('Referred user credits:', referredData.data.credits);
  
  // 4. Check referrer got credits
  const updatedReferrerResponse = await fetch(`${API_URL}/v1/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ fingerprint: referrerFp })
  });
  
  const updatedReferrerData = await updatedReferrerResponse.json();
  console.log('Referrer credits after referral:', updatedReferrerData.data.credits);
  
  console.log('✅ Referral flow test complete');
}

testReferralFlow().catch(console.error);
```

## Common Issues & Solutions

### Credits not updating
- Check `refresh()` is called after actions
- Verify API responses are successful
- Check browser console for errors
- Ensure daily grant logic is working in `/api/v1/me`

### Modal not appearing
- Ensure `credits === 0` check is working
- Verify GrowthKitGate is wrapping content
- Check loading states aren't blocking

### Referral links not working
- Verify middleware is configured
- Check redirect URL in app settings
- Test in incognito to avoid cookie issues

### SDK changes not reflecting
- Make sure to run `npm run build` in SDK directory
- Check that `npm link` is properly set up
- Restart the example app after SDK changes
- Clear Next.js cache: `rm -rf .next`
