# GrowthKit Service

A comprehensive referral and growth management service for mini-apps. Provides user fingerprinting, referral tracking, credit systems, lead capture, and waitlist management.

## 📚 Documentation

- [Implementation Plan](./docs/PLAN.md) - Overall project roadmap and completed features
- [Dashboard UI/UX Plan](./docs/DASHBOARD-PLAN.md) - Admin interface improvement roadmap
- [API Documentation](./docs/API.md) - Complete API endpoint reference
- [SDK Documentation](./sdk/README.md) - Client SDK integration guide
- [Enhanced Waitlist System](./docs/PLAN2.md) - Auto-invitation and waitlist features

## Features

- 🔐 **API Key Authentication** - Secure app-level authentication
- 🎯 **User Fingerprinting** - Track users without requiring login
- 🎁 **Referral System** - Complete referral tracking with credits
- 💳 **Credit Management** - Flexible credit-based actions
- 📧 **Lead Capture** - Name and email collection with verification
- 📝 **Waitlist Management** - Queue system for early access
- 📊 **Analytics & Metrics** - Track conversions and usage
- 🛡️ **Rate Limiting** - Protection against abuse
- 🌐 **CORS Support** - Per-app origin configuration

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase configured)
- Redis instance (Upstash configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (already in .env.local):
- Database connection (Supabase PostgreSQL)
- Redis connection (Upstash)
- Admin credentials
- Service keys

3. Push database schema:
```bash
npm run db:push
```

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Seed initial data (creates test app):
```bash
npm run db:seed
```

Save the API key that's displayed - it won't be shown again!

6. Start the development server:
```bash
npm run dev
```

## Admin Dashboard

Access the admin dashboard at `http://localhost:3000/admin`

Use the credentials from your .env.local:
- Username: admin
- Password: admin

From the dashboard you can:
- Create and manage apps
- Generate API keys
- View metrics and analytics
- Manage app configurations

## API Endpoints

### Public Endpoints (require API key)

#### POST /api/v1/me
Initialize or retrieve user fingerprint data
```json
{
  "fingerprint": "unique-browser-fingerprint"
}
```

#### POST /api/v1/complete
Track action completion and consume credits
```json
{
  "fingerprint": "unique-browser-fingerprint",
  "action": "default",
  "claim": "optional-referral-claim-token"
}
```

#### POST /api/v1/claim/name
Claim credits for providing name
```json
{
  "fingerprint": "unique-browser-fingerprint",
  "name": "John Doe"
}
```

#### POST /api/v1/claim/email
Claim credits for providing email (sends verification)
```json
{
  "fingerprint": "unique-browser-fingerprint",
  "email": "john@example.com"
}
```

#### POST /api/v1/verify/email
Verify email with token
```json
{
  "fingerprint": "unique-browser-fingerprint",
  "token": "verification-token"
}
```

#### POST /api/v1/referral/exchange
Exchange referral code for claim token
```json
{
  "referralCode": "GROWTH-ABC123"
}
```

#### POST /api/v1/waitlist
Join the waitlist
```json
{
  "email": "john@example.com",
  "fingerprint": "optional-fingerprint"
}
```

#### GET /r/:code
Referral redirect endpoint (sets cookie and redirects)

### Admin Endpoints (require SERVICE_KEY)

#### POST /api/v1/admin/app
Create or update app configuration

#### POST /api/v1/admin/apikey
Generate new API keys

#### GET /api/v1/admin/metrics
Get analytics and metrics

## Using the API

Include your API key in the Authorization header:
```
Authorization: Bearer gk_your_api_key_here
```

Example with fetch:
```javascript
const response = await fetch('http://localhost:3000/api/v1/me', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer gk_your_api_key_here'
  },
  body: JSON.stringify({
    fingerprint: 'unique-browser-fingerprint'
  })
});
```

## Policy Configuration

Apps are configured with a policy JSON that defines credit amounts:

```json
{
  "referralCredits": 5,      // Credits for referrer
  "referredCredits": 3,      // Credits for referred user
  "nameClaimCredits": 2,     // Credits for providing name
  "emailClaimCredits": 2,    // Credits for providing email
  "emailVerifyCredits": 5,   // Credits for verifying email
  "dailyReferralCap": 10,    // Max referrals per day per user
  "actions": {
    "default": { "creditsRequired": 1 },
    "premium": { "creditsRequired": 5 }
  }
}
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:push      # Push schema changes
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed initial data
npm run db:studio    # Open Prisma Studio
```

## Security Features

- ✅ API key hashing with bcrypt
- ✅ HMAC-signed referral tokens
- ✅ Rate limiting per IP and fingerprint
- ✅ CORS validation per app
- ✅ Timing-safe comparisons
- ✅ HttpOnly session cookies
- ✅ Input sanitization

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── v1/        # Public API endpoints
│   │   └── admin/     # Admin endpoints
│   ├── admin/         # Admin dashboard
│   └── r/            # Referral redirect
├── lib/
│   ├── security/      # Auth & crypto utilities
│   ├── middleware/    # CORS & rate limiting
│   └── utils/        # Helpers & validation
└── prisma/           # Database schema & migrations
```

## Next Steps

1. **Email Integration**: Connect Resend API for email verification
2. **SDK Development**: Build the client SDK package
3. **Monitoring**: Add proper logging and monitoring
4. **Testing**: Add comprehensive test suite
5. **Documentation**: Expand API documentation

## License

Private - Internal Use Only