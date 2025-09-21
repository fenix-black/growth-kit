# GrowthKit Service Implementation Plan

## 📊 Implementation Status Summary

### ✅ Completed Features (90% Complete)

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

**Email System:**
- ✅ Resend integration with retry logic
- ✅ Per-app email templates (database-stored)
- ✅ Email template management API
- ✅ Verification, invitation, and waitlist confirmation templates

**Enhanced Waitlist (Phase 11 - Partial):**
- ✅ Database schema for waitlist configuration
- ✅ Master referral code system
- ✅ Auto-invitation cron job
- ✅ Waitlist status in `/v1/me` endpoint
- ✅ Per-app invitation quotas and settings

**Client SDK (v0.3.0):**
- ✅ React hook (useGrowthKit) with full feature set
- ✅ TypeScript support with complete type definitions
- ✅ Browser fingerprinting with fallback
- ✅ API client with auto-configuration
- ✅ **Next.js middleware** for referral link handling
- ✅ **Server-side utilities** for API routes and SSR
- ✅ Comprehensive documentation with examples

### 🚧 Remaining Tasks

**SDK Enhancements (Phase 11):**
- [x] Add waitlist state to SDK hook ✅
- [x] Create GrowthKitGate component ✅
- [x] Update SDK documentation for waitlist ✅

**Phase 12: USD Tracking & Secure Invitations (NEW):**
- [ ] Add USD value tracking to usage records
- [ ] Implement unique invitation codes system
- [ ] Update SDK for USD tracking support
- [ ] Secure invitation code redemption flow

**Admin Dashboard (Phase 11):**
- [x] Waitlist configuration UI ✅ (Basic implementation)
- [x] Waitlist management interface ✅ (Basic implementation)
- [x] Email template editor ✅ (Basic implementation)
- [ ] **UI/UX Overhaul** - See [DASHBOARD-PLAN.md](./DASHBOARD-PLAN.md) for comprehensive improvements:
  - [ ] Modern navigation system with sidebar
  - [ ] Enhanced data visualizations and charts
  - [ ] Improved form UX with wizards
  - [ ] Mobile responsive design
  - [ ] Dark mode support

**Phase 8-9:** ✅
- [x] Deployment configuration (vercel.json)
- [x] API documentation (docs/API.md)
- [x] Integration guides and examples (SDK docs)

**Analytics & Monitoring:** ✅
- [x] Waitlist analytics dashboard
- [x] Invitation conversion tracking
- [x] USD spending analytics
- [x] Invitation code usage tracking
- [x] Cron job monitoring

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
- [ ] Publish to npm registry (v0.3.0 ready to publish)

## Phase 6: Per-App Integration Helpers ✅ COMPLETED

### 6.1 Middleware Template
- [x] Create Next.js middleware template for /r/:code handling (included in SDK v0.3.0)
- [x] Add cookie management logic  
- [x] Include error handling and fallbacks
- [x] Added server-side utilities for API routes
- [x] Included comprehensive documentation and examples

### 6.2 Proxy Routes (Optional)
- [ ] Create template for app-side proxy endpoints
- [ ] Forward credentials and headers properly
- [ ] Handle cross-domain cookie scenarios

## Phase 7: Email Integration ✅ COMPLETED

**Note:** This phase is a prerequisite for Phase 11 (Enhanced Waitlist) invitation emails.

### 7.1 Email Provider Setup
- [x] Configure Resend integration
- [x] Set up RESEND_API_KEY in environment
- [x] Create email templates (database-stored per app)
  - [x] Verification code/link template
  - [x] Waitlist invitation template (needed for Phase 11)
  - [x] Waitlist confirmation template
  - [x] Admin API for managing templates

### 7.2 Email Sending Logic
- [x] Implement send verification email with Resend
- [x] Add retry logic for failures (exponential backoff)
- [x] Store email send status in EventLog
- [x] Created `/v1/send-verification` endpoint

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

## Phase 11: Enhanced Waitlist & Auto-Invitation System

### 📋 Full implementation details in [PLAN2.md](./PLAN2.md)

This phase transforms the basic waitlist into a viral growth engine with:

### 11.1 Waitlist Gating ✅
- [x] App-level waitlist configuration
- [x] Automatic gating based on app settings
- [x] Referral bypass mechanism
- [x] SDK support for waitlist UI ✅

### 11.2 Master Referral System ✅
- [x] Master codes for invitation emails
- [x] Automatic credit grants for invited users
- [x] Per-app master code management
- [x] Master code validation in `/v1/referral/exchange`
- [x] Master claim processing in `/v1/me`

### 11.3 Auto-Invitation System ✅
- [x] Hourly cron job for invitations (checks app times)
- [x] Per-app invitation quotas
- [x] Email templates with Resend
- [x] Invitation tracking and analytics
- [x] Manual trigger endpoint for testing

### 11.4 Analytics & Tracking ✅
- [x] Per-app waitlist metrics (count display in admin)
- [x] Invitation tracking via waitlist manager
- [x] Admin dashboard enhancements ✅
- [ ] Advanced cohort analysis (future enhancement)

**Prerequisites:**
- Phase 7 (Email Integration) should be partially complete
- Phase 1-4 must be complete (core system)
- SDK v0.3.0+ for waitlist support

**Estimated Timeline:** 6 days (see PLAN2.md for detailed breakdown)

## Phase 12: USD Tracking & Secure Invitations

### 12.1 USD Value Tracking

#### Database Updates
- [ ] Add `usdValue` field to Usage model
  - [ ] Type: Decimal/Float (nullable)
  - [ ] Default: null (for backward compatibility)
  - [ ] Index for aggregation queries
- [ ] Add `trackUsdValue` boolean to App model
  - [ ] Default: false
  - [ ] Allows per-app configuration
- [ ] Create migration for schema changes

#### API Updates
- [ ] Update POST /v1/complete endpoint
  - [ ] Accept optional `usdValue` parameter
  - [ ] Validate USD value (positive number, max 2 decimal places)
  - [ ] Store in Usage record if app has USD tracking enabled
  - [ ] Return USD spent in response
- [ ] Create GET /v1/admin/metrics/usd endpoint
  - [ ] Aggregate USD spent by user
  - [ ] Time-based filtering (daily, weekly, monthly)
  - [ ] Per-app USD analytics
  - [ ] Export capabilities for financial reporting

#### SDK Updates (v0.4.0) ✅
- [x] Update `completeAction()` method signature
  - [x] Add optional `options` parameter: `{ usdValue?: number }`
  - [x] Maintain backward compatibility
  - [x] Example: `completeAction('purchase', { usdValue: 9.99 })`
- [x] Add USD tracking to hook state
  - [x] `totalUsdSpent` field
  - [x] `lastUsdTransaction` details
- [x] Update TypeScript definitions
- [x] Update documentation with USD tracking examples

### 12.2 Unique Invitation Code System

#### Database Updates
- [ ] Update Waitlist model
  - [ ] Add `invitationCode` field (unique, indexed)
  - [ ] Add `fingerprintId` field (link to who redeemed)
  - [ ] Add `codeUsedAt` timestamp
  - [ ] Add `codeExpiresAt` timestamp (optional expiration)
  - [ ] Add `maxUses` field (default: 1, for future flexibility)
  - [ ] Add `useCount` field (track redemptions)
- [ ] Create compound unique index on [appId, invitationCode]
- [ ] Migration for schema changes

#### Code Generation & Management
- [ ] Create invitation code generator utility
  - [ ] Use nanoid or similar for short, unique codes (e.g., "INV-X8K2M9")
  - [ ] Configurable length and format
  - [ ] Ensure uniqueness per app
- [ ] Update invitation sending logic
  - [ ] Generate unique code when status changes to INVITED
  - [ ] Store code in Waitlist record
  - [ ] Include code in invitation email

#### Redemption Flow
- [ ] Create POST /v1/waitlist/redeem endpoint
  - [ ] Validate invitation code exists and is unused
  - [ ] Check expiration if set
  - [ ] Link fingerprint to waitlist entry
  - [ ] Mark code as used (set codeUsedAt)
  - [ ] Update waitlist status to ACCEPTED
  - [ ] Grant configured credits
  - [ ] Return success with user state
- [ ] Update GET /r/:code logic
  - [ ] Check if code is an invitation code format
  - [ ] Handle invitation codes differently from referral codes
  - [ ] Redirect to app with special invitation claim
- [ ] Update POST /v1/me endpoint
  - [ ] Check for invitation code in claim
  - [ ] Process invitation redemption
  - [ ] Prevent multiple redemptions

#### Security Measures
- [ ] Implement rate limiting on redemption endpoint
- [ ] Add fingerprint verification
  - [ ] Store fingerprint on first code use
  - [ ] Reject if different fingerprint tries to use same code
- [ ] Add code expiration logic
  - [ ] Default: 7 days from invitation
  - [ ] Configurable per app
- [ ] Audit logging for all redemption attempts
- [ ] Prevent self-invitation abuse

### 12.3 Email Template Updates ✅

- [x] Update invitation email template
  - [x] Include unique invitation code prominently
  - [x] Add expiration date if applicable
  - [x] Clear redemption instructions
  - [x] Direct link with code embedded: `/invite?code=INV-X8K2M9`
- [x] Create reminder email template
  - [x] For codes expiring soon (with urgency levels)
  - [x] Dynamic styling based on days remaining
  - [x] Clear call-to-action buttons

### 12.4 Admin Dashboard Enhancements ✅

#### USD Analytics Dashboard ✅
- [x] Create USD metrics page
  - [x] Total revenue per period
  - [x] Average transaction value
  - [x] User lifetime value (LTV)
  - [x] Conversion funnel with USD values
- [x] Export functionality
  - [x] CSV export for accounting
  - [x] Date range selection
  - [x] Per-app filtering

#### Invitation Code Management ✅
- [x] Invitation codes listing
  - [x] Show all codes with status
  - [x] Filter by used/unused/expired
  - [x] Search by code or email
- [x] Manual code generation
  - [x] Generate codes for specific users
  - [x] Set custom expiration
  - [x] Bulk generation option
- [x] Code analytics
  - [x] Redemption rate
  - [x] Time to redemption
  - [ ] Geographic distribution (future enhancement)

### 12.5 Testing & Validation

- [ ] Unit tests
  - [ ] USD value validation
  - [ ] Code generation uniqueness
  - [ ] Redemption flow edge cases
- [ ] Integration tests
  - [ ] End-to-end invitation flow
  - [ ] USD tracking with credits
  - [ ] Security validation
- [ ] Load testing
  - [ ] Code generation at scale
  - [ ] Concurrent redemption attempts

### 12.6 Documentation

- [ ] API documentation updates
  - [ ] New endpoints documentation
  - [ ] Updated parameter descriptions
  - [ ] Example requests/responses
- [ ] SDK documentation
  - [ ] USD tracking examples
  - [ ] Migration guide to v0.4.0
- [ ] Admin guide
  - [ ] Setting up USD tracking
  - [ ] Managing invitation codes
  - [ ] Analytics interpretation

### 12.7 Migration & Rollout

- [ ] Migration strategy
  - [ ] Backward compatibility for existing waitlist entries
  - [ ] Generate codes for already invited users
  - [ ] Default USD tracking to disabled
- [ ] Feature flags
  - [ ] Enable USD tracking per app
  - [ ] Enable unique codes per app
  - [ ] Gradual rollout capability
- [ ] Monitoring
  - [ ] Track adoption rates
  - [ ] Error monitoring
  - [ ] Performance impact assessment

### Estimated Timeline for Phase 12

- **12.1 USD Value Tracking**: ✅ COMPLETED
  - Database & API updates: ✅
  - SDK updates: ✅
  - Admin dashboard: ✅

- **12.2 Unique Invitation Codes**: ✅ COMPLETED
  - Database & code generation: ✅
  - Redemption flow & security: ✅
  - Email updates & testing: ✅

- **12.3 Email Templates**: ✅ COMPLETED
  - Unique code display: ✅
  - Expiration dates: ✅
  - Reminder templates: ✅

- **12.4 Admin Dashboard**: ✅ COMPLETED
  - USD metrics & analytics: ✅
  - Invitation code management: ✅
  - Export functionality: ✅

- **12.5-12.7 Testing, Documentation & Rollout**: Remaining for production

**Progress: ~90% complete (Phase 12 features ready for testing)**

### Implementation Benefits

1. **USD Tracking Benefits:**
   - ROI measurement for credits/referrals
   - Financial reporting capabilities
   - User lifetime value (LTV) tracking
   - Better pricing decisions

2. **Unique Invitation Code Benefits:**
   - Prevents invitation sharing abuse
   - Better tracking of invitation sources
   - Improved security and user verification
   - Detailed analytics on invitation effectiveness

## Phase 13: Dashboard UI/UX Improvements

### 📋 Full implementation details in [DASHBOARD-PLAN.md](./DASHBOARD-PLAN.md)

This phase focuses on transforming the minimal admin dashboard into a professional, user-friendly interface.

### 13.1 Foundation & Navigation ✅
- [x] Design system with colors, typography, and components
- [x] Persistent sidebar navigation with collapsible menu
- [x] Layout restructure with reusable components
- [x] Replace modal-based views with page-based navigation

### 13.2 Dashboard Home ✅
- [x] Overview dashboard with key metrics
- [x] Data visualization with charts (Recharts)
- [x] Activity timeline and recent events
- [x] System health indicators

### 13.3 App Management Enhancement ✅
- [x] Card grid view option for apps list
- [x] Dedicated app dashboard pages with tabbed interface
- [x] App creation wizard with multi-step form
- [x] Advanced filtering and search

### 13.4 Waitlist Management UI (Partially Complete) ⛔
- [x] Embedded waitlist management in app detail view
- [ ] Kanban board view for waitlist stages
- [ ] Visual invitation code generator
- [x] Email template editor (basic implementation)

### 13.5 Analytics & Monitoring ✅
- [x] Unified analytics dashboard with real data
- [x] Enhanced USD metrics (spending, not revenue)
- [x] Detailed breakdowns by user, action, time
- [x] CSV export functionality
- [ ] Visual cron job timeline

### 13.6 User Experience (Complete) ✅
- [x] Dark mode support with theme persistence (fixed Tailwind v4 compatibility)
- [x] Mobile responsive design
- [x] Keyboard shortcuts (Cmd+Shift+D for dark mode, Cmd+/ for search)
- [x] Accessibility improvements (ARIA labels, keyboard navigation)
- [x] Bug fixes for uncontrolled inputs, field mappings, API key display, and Next.js 15+ compatibility

**Progress: ~93% complete (Phase 1-3, 5, 6 fully completed, Phase 4 partially complete, Phase 7 pending)**

---

## Implementation Notes

### Priority Order
1. Start with Phase 1-3 for core functionality ✅
2. Phase 5 (SDK) can be developed in parallel with Phase 4 ✅
3. Phase 6-7 can be added incrementally ✅ (6 done, 7 partial)
4. Phase 8 for production deployment
5. Phase 9-10 for polish and maintenance
6. **Phase 11 (Enhanced Waitlist) after core system is stable and deployed**
7. **Phase 12 (USD Tracking & Secure Invitations) - High priority security & analytics enhancements**

### Key Decisions Made
- [x] Use bcrypt for API key hashing (better Vercel compatibility, simpler deployment)
- [x] Use Resend as email provider (RESEND_API_KEY configured)
- [ ] Use Free Redis provider tier (Upstash free tier initially)
- [ ] Determine if multi-tenant support is needed initially: basic

### Phase 12 Technical Decisions
- **USD Tracking**: Optional per-app feature, stored as decimal with 2 decimal places
- **Invitation Codes**: Use nanoid for generation, 8-character codes with "INV-" prefix
- **Code Security**: One-time use by default, fingerprint-locked after first use
- **Code Expiration**: Default 7 days, configurable per app
- **Backward Compatibility**: All new features are optional and won't break existing integrations

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
