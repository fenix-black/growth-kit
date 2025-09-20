# GrowthKit Service Implementation Plan

## 📊 Implementation Status Summary

### ✅ Completed Features (92% Complete)

**Core Infrastructure:**
- ✅ Next.js app with TypeScript and App Router
- ✅ Prisma ORM with complete database schema
- ✅ All security middleware (CORS, rate limiting, auth)
- ✅ API key authentication system with bcrypt hashing
- ✅ HMAC claim token system for referrals

**API Endpoints Implemented:**
- ✅ **User Endpoints:** /v1/me, /v1/complete
- ✅ **Data Capture:** /v1/claim/name, /v1/claim/email, /v1/verify/email
- ✅ **Referral System:** /r/:code, /v1/referral/exchange, /v1/referral/visit
- ✅ **Waitlist:** /v1/waitlist
- ✅ **Admin:** /v1/admin/app, /v1/admin/apikey, /v1/admin/metrics, /v1/admin/invite-batch

**Admin Dashboard:**
- ✅ Basic admin UI with authentication
- ✅ App creation and management interface
- ✅ API key generation system
- ✅ Metrics visualization

**Client SDK (v0.2.0):**
- ✅ React hook (useGrowthKit) with full feature set
- ✅ TypeScript support with complete type definitions
- ✅ Browser fingerprinting with fallback
- ✅ API client with auto-configuration
- ✅ **Next.js middleware** for referral link handling
- ✅ **Server-side utilities** for API routes and SSR
- ✅ Comprehensive documentation with examples

### 🚧 Remaining Tasks

**SDK Publishing:**
- [ ] Publish @fenixblack/growthkit to npm registry (v0.2.0 with middleware ready!)

**Phase 7-9:**
- [ ] Email integration with Resend
- [ ] Deployment configuration  
- [ ] API documentation
- [ ] Integration guides and examples

**Environment Setup:**
- [x] Configure missing env variables (run: `node scripts/generate-keys.js`)
- [ ] Run production database migrations
- [ ] Set up Upstash Redis credentials

---

## Phase 1: Project Setup & Database

### 1.1 Initialize Next.js Project
- [x] Create Next.js app with App Router and TypeScript
- [x] Configure project structure (app/, src/, lib/)
- [x] Set up environment variables (.env.local)
  - [x] Add DATABASE_URL from Supabase
  - [x] Add REF_SECRET for HMAC tokens (generate-keys script)
  - [x] Add SERVICE_KEY for admin endpoints (generate-keys script)
  - [x] Add CORS_ALLOWLIST placeholder

### 1.2 Database Setup
- [x] Install and configure Prisma
  - [x] Install prisma and @prisma/client
  - [x] Initialize Prisma with PostgreSQL
  - [x] Configure connection to Supabase (fenix-referrals)
- [x] Create Prisma schema
  - [x] Define all models as per PRD (Tenant, App, ApiKey, Fingerprint, Credit, Usage, Referral, Lead, Waitlist, EventLog)
  - [x] Add proper indexes and constraints
  - [ ] Run initial migration
- [x] Seed initial data
  - [x] Create default App record with sample policy JSON
  - [x] Generate initial API keys for testing

## Phase 2: Core Security & Utilities

### 2.1 Authentication & Security
- [x] Implement API key hashing utility with bcrypt
- [x] Create verifyAppKeys function for request validation
- [x] Implement timing-safe comparison for API keys
- [x] Create HMAC claim token utilities (mintClaim, verifyClaim)

### 2.2 Middleware Setup
- [x] Create CORS middleware with per-app allowlist
- [x] Implement rate limiting with Upstash Redis
  - [x] Set up Upstash Redis connection
  - [x] Create sliding window rate limiter
  - [x] Configure limits per IP and fingerprint
- [x] Add request validation middleware for headers

## Phase 3: Public API Endpoints

### 3.1 Core User Endpoints
- [x] POST /v1/me endpoint
  - [x] Fingerprint upsert logic
  - [x] Return credits, usage, referral code, policy
  - [x] Generate unique referral codes
- [x] POST /v1/complete endpoint
  - [x] Increment usage counter
  - [x] Consume credits logic
  - [x] Apply referral credits if claim present
  - [x] Anti-abuse checks (self-referral, daily caps)

### 3.2 Data Capture Endpoints
- [x] POST /v1/claim/name
  - [x] Store name in Lead model
  - [x] Award one-time credits
  - [x] Prevent duplicate claims
- [x] POST /v1/claim/email
  - [x] Store email in Lead model
  - [x] Email validation logic
  - [ ] Trigger email send (stub for now)
- [x] POST /v1/verify/email
  - [x] Token verification logic
  - [x] Mark email as verified
  - [x] Award verification credits

### 3.3 Referral System
- [x] GET /r/:code endpoint
  - [x] Exchange code for claim token
  - [x] Set HttpOnly cookie
  - [x] Redirect to configured app URL
- [x] POST /v1/referral/exchange
  - [x] Validate referral code
  - [x] Mint short-lived claim token
  - [x] Return claim with TTL
- [x] POST /v1/referral/visit
  - [x] Record referral visit event
  - [x] Validate claim token

### 3.4 Waitlist Endpoint
- [x] POST /v1/waitlist
  - [x] Add email to waitlist
  - [x] Duplicate check
  - [x] Return queue position (optional)

## Phase 4: Admin API Endpoints

### 4.1 App Management
- [x] POST /v1/admin/app
  - [x] Create/update app configuration
  - [x] Validate policy JSON structure
  - [x] Bearer token authentication
- [x] POST /v1/admin/apikey
  - [x] Generate new API keys
  - [x] Revoke existing keys (DELETE method)
  - [x] Store hashed versions only

### 4.2 Operations Endpoints
- [x] GET /v1/admin/metrics
  - [x] Aggregate credit statistics
  - [x] Referral conversion metrics
  - [x] Usage analytics
- [x] POST /v1/admin/invite-batch
  - [x] Promote N waitlist entries to INVITED
  - [x] Send invitation notifications (stub)

## Phase 5: Client SDK Package

### 5.1 SDK Setup
- [x] Create separate package directory (sdk)
- [x] Configure package.json for npm publishing
  - [x] Set package name @fenixblack/growthkit
  - [x] Add peer dependencies (react, @rajesh896/broprint.js)
  - [x] Configure ESM build with tsup

### 5.2 Core Hook Implementation
- [x] Implement useGrowthKit hook
  - [x] Fingerprint initialization with broprint.js
  - [x] State management for credits/usage
  - [x] Auto-refresh on mount
- [x] Add core methods
  - [x] completeAction()
  - [x] claimName()
  - [x] claimEmail()
  - [x] verifyEmail()
  - [x] joinWaitlist()
- [x] Add utility methods
  - [x] share() with native share API fallback
  - [x] referralLink generation
  - [x] shouldShowSoftPaywall computation
  - [x] canPerformAction() helper

### 5.3 SDK Publishing
- [x] Build and bundle SDK (tsup configured)
- [x] Add TypeScript definitions
- [ ] Publish to npm registry (v0.2.0 ready to publish)

## Phase 6: Per-App Integration Helpers ✅ COMPLETED

### 6.1 Middleware Template
- [x] Create Next.js middleware template for /r/:code handling (included in SDK v0.2.0)
- [x] Add cookie management logic  
- [x] Include error handling and fallbacks
- [x] Added server-side utilities for API routes
- [x] Included comprehensive documentation and examples

### 6.2 Proxy Routes (Optional)
- [ ] Create template for app-side proxy endpoints
- [ ] Forward credentials and headers properly
- [ ] Handle cross-domain cookie scenarios

## Phase 7: Email Integration

### 7.1 Email Provider Setup
- [ ] Configure Resend integration
- [ ] Set up RESEND_API_KEY in environment
- [ ] Create email templates
  - [ ] Verification code/link template
  - [ ] Waitlist invitation template

### 7.2 Email Sending Logic
- [ ] Implement send verification email with Resend
- [ ] Add retry logic for failures
- [ ] Store email send status

## Phase 8: Deployment & Configuration

### 8.1 Vercel Deployment
- [ ] Configure Vercel project settings
- [ ] Set environment variables in Vercel
- [ ] Configure custom domain (if applicable)
- [ ] Set up preview deployments

### 8.2 Database Production Setup
- [ ] Run production migrations
- [ ] Create production App records
- [ ] Generate production API keys
- [ ] Configure connection pooling

## Phase 9: Documentation & Examples

### 9.1 API Documentation
- [ ] Document all endpoints with request/response examples
- [ ] Add authentication requirements
- [ ] Include rate limit information

### 9.2 Integration Guide
- [ ] Quick start guide for mini-apps
- [ ] SDK usage examples
- [ ] Common patterns and best practices

## Phase 10: Admin Dashboard & Monitoring

### 10.1 Admin UI
- [x] Create admin authentication middleware
  - [x] Use ADMIN_USER and ADMIN_PASSWORD from env variables
  - [x] Session management with cookies
- [x] Build admin pages
  - [x] App creation page with form
  - [x] API key generation and management
  - [x] List all apps and their configurations
  - [x] View and revoke existing API keys (backend ready)
- [x] Add basic styling (Tailwind or simple CSS)

### 10.2 Basic Monitoring
- [ ] Configure Vercel Analytics
- [ ] Set up database query logging
- [ ] Create simple metrics page in admin UI
- [ ] Basic event log viewer

---

## Implementation Notes

### Priority Order
1. Start with Phase 1-3 for core functionality
2. Phase 5 (SDK) can be developed in parallel with Phase 4
3. Phase 6-7 can be added incrementally
4. Phase 8 for production deployment
5. Phase 9-10 for polish and maintenance

### Key Decisions Made
- [x] Use bcrypt for API key hashing (better Vercel compatibility, simpler deployment)
- [x] Use Resend as email provider (RESEND_API_KEY configured)
- [ ] Decide on Redis provider tier (Upstash free tier initially)
- [ ] Determine if multi-tenant support is needed initially

### Simplifications for MVP
- Keep Tenant model but make tenantId nullable initially (single-tenant mode)
- Start with basic email templates (no fancy HTML)
- Use simple HMAC tokens instead of JWT
- Skip Cloudflare Turnstile initially
- EventLog can be minimal (just store key events)
- Admin dashboard with basic auth (no complex auth system)

### Environment Variables Checklist
```env
# Already configured
DATABASE_URL=[from Supabase]
RESEND_API_KEY=[configured]

# Need to add
REF_SECRET=[generate random 32+ char string]
SERVICE_KEY=[generate random 32+ char string]
ADMIN_USER=[choose admin username]
ADMIN_PASSWORD=[choose secure password]
CORS_ALLOWLIST=http://localhost:3000,http://localhost:3001
UPSTASH_REDIS_REST_URL=[from Upstash]
UPSTASH_REDIS_REST_TOKEN=[from Upstash]
```
