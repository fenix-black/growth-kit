# Use Case 1: Complete Growth Kit User Journey

## Overview
This document describes the complete user journey for applications using GrowthKit, from initial anonymous visit through credit management and referral flows.

## User Journey Flow

### 1. Anonymous User Initial Visit

**Trigger:** Anonymous user navigates to app root path (`/`)

**Detection:** 
- GrowthKit middleware detects fingerprint
- System checks if fingerprint is new (never seen before)

**Branching Logic (based on app settings):**

#### Path A: Waitlist Mode
- **Condition:** App settings specify "show waitlist"
- **Action:** Display waitlist form
- **Data Collection:** Email address
- **Processing:** Pair fingerprint with entered email in GrowthKit server
- **Next State:** User is on waitlist, awaiting invitation

#### Path B: Credits Mode
- **Condition:** App settings specify "start with credits"
- **Action:** Automatically assign initial daily credits (configurable in app settings)
- **Processing:** Create fingerprint record with initial credit balance
- **Daily Grants:** Each day the user visits, they receive additional credits (no retroactive grants)
- **Next State:** User can immediately use the app with limited credits

### 2. Credit Management Flow

**Trigger:** User exhausts their daily/allocated credits

**UI Response:** Display modal with multiple options

#### Credit Earning Options:

1. **Enter Name**
   - **Reward:** 1 credit (default, configurable in app settings)
   - **Processing:** Update user profile with name

2. **Enter Email**
   - **Reward:** 1 additional credit
   - **Processing:** Associate email with fingerprint
   - **Note:** This is cumulative with name entry

3. **Verify Email**
   - **Trigger:** Verification email sent after email entry
   - **Reward:** 1 additional credit (configurable in app settings)
   - **Processing:** Mark email as verified, award credits

4. **Share Referral Code**
   - **Action:** Generate unique referral link/code for user
   - **Reward:** Credits for each successful referral
   - **Processing:** Track referral chain

### 3. Referral Flow

**Entry Point:** User arrives via referral link (URL contains referral code)

**Middleware Processing:**
1. Detect referral code in URL
2. Check if current fingerprint is new
3. If new user:
   - **For Referred User:**
     - Assign referral bonus credits to new fingerprint
     - Apply default onboarding flow (waitlist or initial credits based on app settings)
   - **For Referrer:**
     - Award referral reward credits
     - Update referral statistics
4. Mark referral code usage:
   - Track if code is unique (single-use)
   - Mark as used if applicable
5. Redirect to normal app flow (`/`)

**Special Considerations:**
- Some referral codes may offer enhanced rewards (e.g., for key stakeholders)
- Unique invitation codes from waitlist are single-use
- Standard referral codes may be multi-use

## Data Model Requirements

### App Settings
- `showWaitlist`: boolean
- `initialCreditsPerDay`: number (daily grant amount, default: 3)
- `creditsForName`: number (default: 1)
- `creditsForEmail`: number (default: 1)
- `creditsForEmailVerification`: number (default: 1)
- `creditsPerReferral`: number
- `referralBonusCredits`: number (credits given to referred user)
- `maxCreditBalance`: number (optional cap on total credits)

### User/Fingerprint Record
- `fingerprintId`: string
- `email`: string (optional)
- `emailVerified`: boolean
- `name`: string (optional)
- `credits`: number (total accumulated credits)
- `lastDailyGrant`: timestamp (last time daily credits were granted)
- `referralCode`: string (user's own code)
- `referredBy`: string (referral code used to join)
- `createdAt`: timestamp
- `lastActiveAt`: timestamp (for tracking activity)

### Referral Tracking
- `code`: string
- `ownerId`: string (fingerprint/user who owns the code)
- `type`: enum (standard, unique, premium)
- `usageCount`: number
- `maxUsages`: number (null for unlimited)
- `bonusCredits`: number (override default if set)
- `createdAt`: timestamp
- `expiresAt`: timestamp (optional)

## Implementation Components

### SDK Requirements
1. **Middleware**
   - Fingerprint detection and tracking
   - Referral code detection in URL
   - Credit balance checking
   - Rate limiting based on credits

2. **Client Hooks**
   - `useGrowthKit()` - Access user state, credits, referral info
   - Credit balance monitoring
   - Modal trigger management

3. **Components**
   - Waitlist form component
   - Credit exhaustion modal
   - Email verification flow
   - Referral sharing UI

### Server Requirements
1. **API Endpoints**
   - `/api/v1/fingerprint/register` - Register new fingerprint
   - `/api/v1/credits/check` - Check credit balance
   - `/api/v1/credits/use` - Deduct credits
   - `/api/v1/user/update` - Update name/email
   - `/api/v1/email/verify` - Email verification
   - `/api/v1/referral/claim` - Process referral code
   - `/api/v1/referral/generate` - Create referral code

2. **Background Jobs**
   - Daily credit reset
   - Email verification sending
   - Referral tracking and rewards

### Example App Requirements
1. Protected routes that consume credits
2. UI for credit balance display
3. Modal for credit earning options
4. Referral sharing interface
5. Proper error handling and loading states

## Success Metrics
- Conversion rate from anonymous to identified users
- Referral chain depth and spread
- Credit usage patterns
- Email verification rate
- User retention after credit exhaustion

## Edge Cases to Handle
1. User clears cookies/changes device (fingerprint changes)
2. User attempts to use own referral code
3. Referral code expiration
4. Credit fraud attempts (rapid clicking, etc.)
5. Email already associated with different fingerprint
6. Network failures during critical operations
7. Concurrent credit usage across multiple sessions

## Security Considerations
1. Rate limiting on all API endpoints
2. Referral code validation and anti-abuse measures
3. Email verification token expiration
4. Credit transaction logging for audit
5. Fingerprint spoofing prevention
6. HMAC validation for API calls

## Future Enhancements
1. Premium referral codes with bonus credits
2. Time-based credit bonuses
3. Achievement-based credit rewards
4. Credit purchase options
5. Team/organization accounts
6. Credit gifting between users
7. Leaderboards and gamification

## Daily Credit Grant Implementation (On-Demand Approach)

### Concept
Users receive daily credits when they visit the app each day. If they don't visit, they don't get credits for that day (no retroactive grants). This encourages daily engagement while keeping implementation simple.

### Implementation in `/api/v1/me`
```typescript
// After creating/fetching fingerprint record
const now = new Date();
const lastGrant = fingerprintRecord.lastDailyGrant;

if (!app.waitlistEnabled) {
  // Check if this is their first visit or a new day
  const isFirstVisit = !lastGrant;
  const daysSinceGrant = lastGrant ? 
    Math.floor((now - lastGrant) / (1000 * 60 * 60 * 24)) : 0;
  
  if (isFirstVisit || daysSinceGrant >= 1) {
    // Grant daily credits
    await prisma.credit.create({
      data: {
        fingerprintId: fingerprintRecord.id,
        amount: app.initialCreditsPerDay || 3,
        reason: 'daily_grant',
        metadata: { 
          grantDate: now.toISOString(),
          isFirstGrant: isFirstVisit 
        }
      }
    });
    
    // Update last grant timestamp
    await prisma.fingerprint.update({
      where: { id: fingerprintRecord.id },
      data: { 
        lastDailyGrant: now,
        lastActiveAt: now 
      }
    });
  } else {
    // Just update activity timestamp
    await prisma.fingerprint.update({
      where: { id: fingerprintRecord.id },
      data: { lastActiveAt: now }
    });
  }
}
```

### Benefits of This Approach
1. **Simple Logic**: No complex retroactive calculations
2. **Encourages Engagement**: Users need to visit daily to maximize credits
3. **Fair System**: Active users benefit more than sporadic users
4. **No Credit Inflation**: Prevents accumulation from inactive periods
5. **Easy to Track**: Single timestamp tells us everything

### Optional Enhancements
- **Credit Cap**: Set `maxCreditBalance` to prevent excessive hoarding
- **Streak Bonuses**: Extra credits for consecutive daily visits
- **Time-of-Day Flexibility**: Use user's timezone for "daily" calculation
- **Activity-Based Grants**: Only grant if user performed actions previous day

## Current Implementation Status Analysis

### ✅ What's Already Implemented

#### Database Schema
- **Fingerprint tracking**: Full support with unique fingerprints per app
- **Credits system**: Credit model with amount, reason, and metadata tracking
- **Referral system**: Complete referral tracking with referrer/referred relationships
- **Waitlist management**: Full waitlist support with invitation codes
- **Usage tracking**: Usage model with USD value tracking capability
- **Lead management**: Email/name collection with verification support
- **Event logging**: Comprehensive event tracking system

#### Server API Endpoints
- `/api/v1/me` - ✅ Handles fingerprint registration, referral claim processing, waitlist status
- `/api/v1/complete` - ✅ Tracks actions but needs enhancement for credit checking
- `/api/v1/claim/name` - ✅ Awards credits for name submission
- `/api/v1/claim/email` - ✅ Awards credits for email submission
- `/api/v1/verify/email` - ✅ Email verification with credit rewards
- `/api/v1/waitlist` - ✅ Waitlist joining functionality
- `/api/v1/referral/exchange` - ✅ Exchanges referral codes for claim tokens

#### SDK Features
- **Middleware**: ✅ Referral link detection and redirection
- **useGrowthKit hook**: ✅ Most functionality present
- **API client**: ✅ All necessary API calls implemented
- **Fingerprinting**: ✅ Browser fingerprint generation

#### App Configuration
- `waitlistEnabled` - ✅ Controls waitlist mode vs immediate credits
- `masterReferralCredits` - ✅ Credits for special referral codes
- `trackUsdValue` - ✅ USD value tracking capability
- Policy JSON with credit configurations - ✅ Implemented

### 🚧 What Needs Enhancement

#### 1. Daily Credit Grants (Path B)
**Current**: No automatic credit grant system for non-waitlist apps
**Needed**: 
- Add `initialCreditsPerDay` field to App model
- Modify `/api/v1/me` to:
  - Grant initial credits on first fingerprint creation
  - Check and grant daily credits on each visit (on-demand)
  - Skip grants if user didn't visit that day (no retroactive grants)
- Track `lastDailyGrant` timestamp per fingerprint

#### 2. Credit Exhaustion Modal
**Current**: Hook has `shouldShowSoftPaywall()` but no actual modal component
**Needed**:
- Create `CreditExhaustionModal` component in SDK
- Integrate with `useGrowthKit` hook to auto-show when credits = 0
- Include options for name, email, verification, and referral sharing

#### 3. Daily Credit Grant System
**Current**: No daily credit grant mechanism
**Needed**:
- Add `lastDailyGrant` field to Fingerprint model
- Implement on-demand grant logic in `/api/v1/me`:
  ```typescript
  // Check if user should receive daily credits
  if (daysSinceLastGrant >= 1 && !app.waitlistEnabled) {
    // Grant daily credits (no retroactive for missed days)
    await prisma.credit.create({
      fingerprintId: fp.id,
      amount: app.initialCreditsPerDay,
      reason: 'daily_grant'
    });
  }
  ```
- Credits accumulate (no reset or expiration)

#### 4. Referral Code Types
**Current**: Basic referral codes, some support for master codes
**Needed**:
- Add referral code types (standard, unique, premium)
- Support for single-use invitation codes from waitlist
- Variable credit rewards based on code type

#### 5. Example App Integration
**Current**: Basic pages exist but not fully integrated
**Needed**:
- Complete integration showing both waitlist and credit flows
- Protected routes that consume credits
- Credit balance display
- Modal implementation for credit earning
- Referral sharing UI

### 🔴 What's Missing Completely

#### 1. GrowthKit Gate Component
**Current**: Not implemented
**Needed**: 
```tsx
<GrowthKitGate>
  {/* Protected app content */}
</GrowthKitGate>
```
Should handle:
- Waitlist form display when required
- Credit exhaustion modal
- Loading states
- Error boundaries

#### 2. Credit Consumption on Actions
**Current**: `/api/v1/complete` tracks usage but doesn't enforce credit requirements
**Needed**:
- Enforce credit requirements before allowing actions
- Return proper error when insufficient credits
- Update client to handle credit errors

#### 3. Configurable Credit Rewards
**Current**: Some hardcoded values
**Needed**:
- Add to App model:
  - `creditsForName` (default: 1)
  - `creditsForEmail` (default: 1)  
  - `creditsForEmailVerification` (default: 1)
  - `creditsPerReferral` (default: varies)
- Use these in respective API endpoints

#### 4. Progressive User Identification
**Current**: Separate endpoints but no coordinated flow
**Needed**:
- Track progression: anonymous → named → email → verified
- Prevent duplicate rewards (already partially done)
- Smooth UX flow in modal

## Implementation Priority

### Phase 1: Core Functionality (Required for MVP)
1. **Daily credit grants** (on-demand, no retroactive) for non-waitlist apps
2. **GrowthKitGate component** with waitlist/credit flows
3. **Credit exhaustion modal** with all earning options
4. **Credit accumulation** system with optional cap
5. **Example app** showing complete flow

### Phase 2: Enhancements
1. Enhanced referral code types
2. Configurable credit rewards per app
3. Better error handling and edge cases
4. Performance optimizations

### Phase 3: Advanced Features
1. Credit purchase integration
2. Advanced analytics
3. A/B testing capabilities
4. Multi-tier referral rewards

## Migration Requirements

### Database Migrations Needed
```sql
-- Add initial credits and daily tracking to App
ALTER TABLE apps ADD COLUMN initial_credits_per_day INTEGER DEFAULT 3;
ALTER TABLE apps ADD COLUMN credits_for_name INTEGER DEFAULT 1;
ALTER TABLE apps ADD COLUMN credits_for_email INTEGER DEFAULT 1;
ALTER TABLE apps ADD COLUMN credits_for_email_verification INTEGER DEFAULT 1;
ALTER TABLE apps ADD COLUMN max_credit_balance INTEGER; -- Optional credit cap

-- Add daily grant tracking to Fingerprint  
ALTER TABLE fingerprints ADD COLUMN last_daily_grant TIMESTAMP;
ALTER TABLE fingerprints ADD COLUMN last_active_at TIMESTAMP;

-- Add referral code types
ALTER TABLE referrals ADD COLUMN code_type VARCHAR(20) DEFAULT 'standard';
ALTER TABLE referrals ADD COLUMN bonus_credits INTEGER;
```

## Testing Requirements

### Unit Tests
- Credit calculation logic
- Referral code validation
- Daily reset logic
- Policy enforcement

### Integration Tests
- Complete user journey (anonymous → credited → exhausted → earned)
- Referral flow (share → claim → reward)
- Waitlist flow (join → invite → accept)
- Edge cases (duplicate claims, expired codes, etc.)

### E2E Tests
- Full example app flow
- Cross-browser fingerprinting
- Mobile/desktop referral sharing
- Email verification flow
