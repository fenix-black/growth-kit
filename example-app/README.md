# GrowthKit SDK Test App

This is a simple Next.js application to test the @fenixblack/growthkit SDK and the published server at https://growth.fenixblack.ai.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the root directory with:
   ```
   NEXT_PUBLIC_GROWTHKIT_SERVER_URL=https://growth.fenixblack.ai
   GROWTHKIT_API_KEY=your_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```

3. **Run the development server:**
   ```bash
   npm run dev -- -p 3001
   ```

   Open [http://localhost:3001](http://localhost:3001) to see the app.

## Features Tested

### 1. **Home Page** (`/`)
- Displays current user status using `useGrowthKit` hook
- Shows navigation to all test pages

### 2. **Waitlist** (`/waitlist`)
- **WaitlistForm Component**: Pre-built form with styling and error handling
- **Custom Implementation**: Direct hook usage with `joinWaitlist`
- Support for invitation codes
- Real-time user status display

### 3. **Protected Dashboard** (`/dashboard`)
- **GrowthKitGate Component**: Protects content based on user state
- **User Profile Management**:
  - Claim email address
  - Claim name
  - Send verification emails
  - Verify email with code
- Shows all user properties (ID, points, referral code, etc.)

### 4. **Referral System** (`/referral`)
- Display user's referral code
- Generate and copy referral links
- Exchange referral codes for points
- Test referral route handling (`/r/[code]`)
- Real-time points tracking

## SDK Features Demonstrated

### Middleware
- Automatic session management
- Referral route handling (`/r/[code]`)
- Cookie-based user tracking

### Hooks
- `useGrowthKit()` - Access user data and actions
- Real-time user state updates
- All user actions (join, claim, verify, exchange)

### Components
- `<GrowthKitProvider>` - Context provider for the app
- `<WaitlistForm>` - Ready-to-use waitlist form
- `<GrowthKitGate>` - Content protection component

## Testing Flow

1. **Start Fresh**: Open the app without any cookies
2. **Join Waitlist**: Test both form implementations
3. **Check Dashboard**: Verify gate protection works
4. **Claim Details**: Add email and name to profile
5. **Email Verification**: Send and verify email
6. **Referral System**: 
   - Get your referral code
   - Share referral link
   - Exchange codes for points

## Notes

- The middleware runs on all routes except `/api`, `/_next`, and static files
- User data persists via cookies (httpOnly, secure in production)
- All API calls go to the configured server URL
- The SDK handles authentication via API key in headers