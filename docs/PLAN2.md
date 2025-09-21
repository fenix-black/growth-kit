# GrowthKit Phase 2: Enhanced Waitlist & Auto-Invitation System

## Overview
Transform the waitlist from a simple gate into a viral growth engine with automated invitations, master referral codes, and comprehensive tracking.

**🔑 Important: All features are PER-APP**
- Each app has its own independent waitlist
- Each app has its own configuration and quotas
- Each app has its own master referral code
- Each app tracks its own analytics separately
- Users can be on multiple app waitlists simultaneously

## Phase 1: Waitlist Gating Foundation

### 1.1 Database Schema Updates
- [x] Add waitlist configuration fields to App model
  - [x] `waitlistEnabled` (boolean)
  - [x] `waitlistMessage` (string, optional)
  - [x] `autoInviteEnabled` (boolean)
  - [x] `dailyInviteQuota` (integer)
  - [x] `inviteTime` (string, e.g., "09:00")
  - [x] `masterReferralCode` (string, unique per app)
  - [x] `masterReferralCredits` (integer)
- [x] Add invitation tracking fields to Waitlist model
  - [x] `invitedVia` (enum: 'manual' | 'auto' | 'master_referral')
  - [x] `invitationEmail` (string, optional)
  - [x] `convertedAt` (datetime, optional)
- [x] Create migration for new fields

### 1.2 API Updates for Waitlist Status
- [x] Update `/v1/me` endpoint response
  - [x] Add `waitlist` object to response (per app context)
  - [x] Include `enabled`, `status`, `position`, `requiresWaitlist`
  - [x] Check if user should see waitlist based on app's settings
- [x] Update user creation logic
  - [x] If app's waitlist enabled and no referral → require waitlist
  - [x] If has referral claim → bypass app's waitlist
  - [x] If invited to this app (status = 'invited') → grant access

### 1.3 Master Referral Code System
- [x] Update `/v1/referral/exchange` endpoint
  - [x] Recognize master referral codes
  - [x] Return special claim token for master codes
- [x] Update `/v1/me` referral processing
  - [x] Handle master referral claims
  - [x] Grant configured credits without referrer
  - [x] Track invitation source in Waitlist model
- [x] Add validation for master code uniqueness

## Phase 2: SDK Enhancements

### 2.1 Hook Updates
- [ ] Add waitlist state to `useGrowthKit`
  - [ ] `waitlistEnabled: boolean`
  - [ ] `waitlistStatus: 'none' | 'waiting' | 'invited' | 'accepted'`
  - [ ] `waitlistPosition: number | null`
  - [ ] `shouldShowWaitlist: boolean` (computed)
- [ ] Update initialization logic
  - [ ] Parse waitlist data from `/v1/me` response
  - [ ] Determine if waitlist gate should show
- [ ] Add `acceptInvitation()` method
  - [ ] Updates waitlist status to 'accepted'
  - [ ] Refreshes user state

### 2.2 Gate Component (Optional Helper)
- [ ] Create `GrowthKitGate` component
  - [ ] Props: `children`, `waitlistComponent`, `loadingComponent`
  - [ ] Handles loading state
  - [ ] Shows waitlist when required
  - [ ] Renders children when access granted
- [ ] Create default `WaitlistForm` component
  - [ ] Email input
  - [ ] Position display
  - [ ] Customizable styling
- [ ] Add to SDK exports

### 2.3 SDK Documentation
- [ ] Document waitlist gating in README
- [ ] Add waitlist examples
- [ ] Document `shouldShowWaitlist` logic
- [ ] Create migration guide for existing apps

## Phase 3: Admin Dashboard Updates

### 3.1 Waitlist Configuration UI
- [ ] Create waitlist settings section in app management
  - [ ] Toggle for waitlist enabled
  - [ ] Custom message textarea
  - [ ] Auto-invite settings group
  - [ ] Master referral code input
  - [ ] Credits configuration
- [ ] Add validation
  - [ ] Ensure master code is unique
  - [ ] Validate daily quota limits
  - [ ] Validate time format

### 3.2 Waitlist Management UI
- [ ] Create waitlist management page
  - [ ] List of waitlisted users
  - [ ] Status filters (waiting, invited, accepted)
  - [ ] Manual invite button
  - [ ] Bulk operations
- [ ] Add waitlist analytics
  - [ ] Total waiting
  - [ ] Invitation conversion rate
  - [ ] Average wait time
  - [ ] Daily invitation count

### 3.3 Invitation History
- [ ] Create invitation log view
  - [ ] Show sent invitations
  - [ ] Track open/click rates (future)
  - [ ] Conversion tracking
  - [ ] Filter by date range

## Phase 4: Auto-Invitation System

### 4.1 Invitation Email Templates
- [x] Create email template structure
  - [x] Default template with placeholders
  - [x] App name, credits, link variables
  - [x] HTML and text versions
- [x] Integrate with Resend
  - [x] Set up email sending function
  - [x] Handle email errors gracefully
  - [x] Log email sends

### 4.2 Cron Job Implementation
- [x] Create `/api/cron/invite-waitlist` endpoint
  - [x] Verify cron authentication (Vercel)
  - [x] Query ALL apps with auto-invite enabled
  - [x] Process each app independently
  - [x] Respect each app's daily quota
  - [x] Process invitations in batches per app
- [x] Invitation logic (per app)
  - [x] Select users from app's waitlist by position (FIFO)
  - [x] Update status to 'invited' for this app
  - [x] Send invitation email with app's branding
  - [x] Log invitation in EventLog with appId
- [x] Error handling
  - [x] Retry failed emails
  - [ ] Alert on failures
  - [ ] Daily summary report

### 4.3 Vercel Cron Configuration
- [x] Configure cron schedule in vercel.json
  - [x] Hourly run to check app times
  - [ ] Timezone handling improvements
- [ ] Add monitoring
  - [ ] Success/failure tracking
  - [ ] Execution time monitoring
  - [ ] Alert on missed runs

## Phase 5: Analytics & Tracking (Per App)

### 5.1 Invitation Analytics
- [ ] Track invitation metrics per app
  - [ ] Invitations sent per day per app
  - [ ] Conversion rate (invited → active) per app
  - [ ] Time to conversion per app
  - [ ] Credits used by invited users per app
- [ ] Compare cohorts within each app
  - [ ] Referred vs invited users in same app
  - [ ] Retention differences per app
  - [ ] Credit usage patterns per app

### 5.2 Waitlist Analytics
- [ ] Queue metrics
  - [ ] Average wait time
  - [ ] Drop-off rate
  - [ ] Position distribution
- [ ] Growth metrics
  - [ ] Waitlist growth rate
  - [ ] Referral bypass rate
  - [ ] Viral coefficient from invited users

### 5.3 Admin Dashboard Updates
- [ ] Create analytics dashboard
  - [ ] Key metrics cards
  - [ ] Time series charts
  - [ ] Cohort comparison tables
- [ ] Export functionality
  - [ ] CSV export of waitlist
  - [ ] Invitation report generation

## Phase 6: Testing & Documentation

### 6.1 Testing
- [ ] Test waitlist gating flow
- [ ] Test master referral codes
- [ ] Test auto-invitation cron
- [ ] Test invitation emails
- [ ] Test analytics tracking

### 6.2 Documentation
- [ ] Update API documentation
- [ ] Create waitlist setup guide
- [ ] Document best practices
- [ ] Add troubleshooting section

## Phase 7: Future Enhancements (Backlog)

### 7.1 Advanced Features
- [ ] Priority waitlist tiers
- [ ] Geographic batch invitations
- [ ] A/B testing invitation copy
- [ ] Invitation reminders
- [ ] Waitlist referral contests

### 7.2 Integrations
- [ ] Webhook for invitation events
- [ ] Slack notifications for milestones
- [ ] Analytics export to BigQuery
- [ ] CRM integration for invited users

---

## Implementation Priority

1. **Critical Path** (Do First)
   - Database schema updates
   - `/v1/me` endpoint updates
   - Hook waitlist state
   - Basic waitlist configuration UI

2. **Core Features** (Do Second)
   - Master referral code system
   - Auto-invitation cron job
   - Email templates
   - Waitlist management UI

3. **Polish** (Do Third)
   - Analytics dashboard
   - Gate component
   - Documentation
   - Testing

## Success Metrics

- [ ] Waitlist → Active conversion rate > 50%
- [ ] Invited users refer at least 1 person (avg)
- [ ] Zero manual invitation work for admins
- [ ] < 100ms added latency for waitlist check

## Technical Decisions

- **Master code credits**: System grants them (no source tracking)
- **Invitation tracking**: Store in Waitlist model with `invitedVia` field
- **Cron timing**: Single daily batch initially (can enhance later)
- **Email provider**: Resend (already configured)
- **Gate logic**: Client-side in hook (not middleware)

## Data Isolation & Multi-Tenancy

**Critical**: All operations are scoped by appId
- Waitlist entries: `WHERE appId = ?`
- Master codes: Unique per app, stored in App model
- Invitations: Processed per app with app-specific quotas
- Analytics: Aggregated per app, never across apps
- User can be on waitlist for App A while active in App B
- Referral codes are app-specific (already implemented)
- Credits are per user per app (via fingerprint + appId)

## Environment Variables Needed

```env
# Cron authentication (Vercel)
CRON_SECRET=your-cron-secret

# Email configuration (already have RESEND_API_KEY)
INVITATION_FROM_EMAIL=invites@yourdomain.com
INVITATION_FROM_NAME=YourApp Team
```

## Estimated Timeline

- Phase 1-2: 2 days (Foundation + SDK)
- Phase 3: 1 day (Admin UI)
- Phase 4: 1 day (Auto-invitations)
- Phase 5: 1 day (Analytics)
- Phase 6: 1 day (Testing & Docs)

**Total: ~6 days for full implementation**

## Notes

- Master referral codes bypass waitlist just like regular referrals
- Invited users start with credits to reduce friction
- Waitlist position is preserved even after invitation
- System tracks conversion to measure invitation effectiveness
- Future: Could add "invite friends to skip the line" feature
