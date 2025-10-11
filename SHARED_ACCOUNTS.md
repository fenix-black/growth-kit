# Shared Accounts Implementation Plan

## Overview

Implement consolidated user accounts across shared apps within an organization using a new `OrgUserAccount` table, avoiding data duplication and enabling future multi-device/auth features.

## Current State ✅

- Apps can be marked as `isolatedAccounts: false` to share credit balances
- Credit aggregation works via virtual queries across fingerprints
- Each app's Users & Leads shows only users who used that specific app
- User profile data (name/email) is stored per-app in Lead records

## Target State 🎯

- New `OrgUserAccount` table consolidates user profiles per organization
- Fingerprints link to OrgUserAccounts (1-to-many relationship for future auth)
- Shared apps pull user data from OrgUserAccount instead of Lead records
- Seamless user experience - visit new shared app, see existing profile data
- Foundation for future Google Auth + multi-device accounts

## Implementation Tasks

### Phase 1: Core Infrastructure ✅

- [x] **Create OrgUserAccount table**
  - `id`, `organizationId`, `name`, `email`, `emailVerified`, `profileMetadata`, timestamps
  - Add `orgUserAccountId` field to Fingerprint table

- [x] **Database migration**
  - Add new table and relationship
  - Run `prisma db push` to sync schema

### Phase 2: Account Creation Logic ✅

- [x] **Update public user endpoint** (`/api/public/user`)
  - On fingerprint first visit to shared app: create/link OrgUserAccount
  - Copy existing profile data from Lead records to OrgUserAccount
  - Link fingerprint to account

- [x] **Update admin user endpoint** (`/api/v1/me`) 
  - Same logic for direct API usage

### Phase 3: Data Sources ✅

- [x] **Update Users & Leads display**
  - For shared apps: pull user data from OrgUserAccount instead of Lead records
  - Still only show users who actually used the specific app
  - Display consolidated profile with full name/email/metadata

- [x] **Update profile claim endpoints**
  - When user claims name/email on shared app: update OrgUserAccount
  - Keep Lead records for backwards compatibility, but OrgUserAccount is source of truth

### Phase 4: Widget Integration ✅

- [x] **Update SDK user data responses**
  - Public endpoints return consolidated profile from OrgUserAccount
  - Maintain existing credit aggregation logic

*Note: Profile management UI will be handled through separate user auth dashboard (future feature), not through widget interface.*

### Phase 5: Cleanup & Optimization

- [ ] **Data consistency service** (optional future enhancement)
  - Periodic job to sync any missed updates
  - Handle edge cases and ensure data integrity

- [x] **Admin indicators** 
  - Visual indicators for consolidated accounts in Users & Leads table
  - "📋 Consolidated" badge shows when user data comes from OrgUserAccount

## Technical Notes

- **Isolation boundary**: Only shared apps (`isolatedAccounts: false`) use OrgUserAccounts
- **Backwards compatibility**: Isolated apps continue using Lead records unchanged
- **Credit system**: No changes needed - existing shared credit logic works
- **Future ready**: Multi-device accounts just link additional fingerprints to same OrgUserAccount

## Success Criteria

- ✅ User visits shared App A, enters email → visits shared App B → email already available
- ✅ Admin views Users & Leads on App A → sees users who used App A with complete profiles
- ✅ No data duplication - single profile record per user per organization
- ✅ Existing isolated apps unaffected
- ✅ Foundation ready for future Google Auth integration

## Future Enhancement Ideas

### LLM-Powered Profile Enrichment

**Concept**: Automatically enrich `profileMetadata` using AI analysis of user activity data across shared apps.

**Implementation Approach**:
- **Data Source**: Activity records (events, properties, context) from all linked fingerprints
- **Processing**: Daily/weekly cron job feeds activity patterns to open-source LLM (via groq.com)
- **Output**: Structured JSON insights added to existing `profileMetadata` field

**Generated Insights**:
- User engagement level (low/medium/high)
- Primary interests and feature usage patterns  
- User segment classification (power_user, casual, etc.)
- Activity patterns (peak hours, session duration, visit frequency)
- Cross-app behavioral journey mapping

**Benefits**:
- Automatic user segmentation without manual tagging
- Rich behavioral insights across entire product ecosystem  
- Foundation for personalization and targeted features
- Product intelligence from aggregated usage patterns
- Privacy-first approach (behavioral patterns, not personal content)

**Schema Impact**: None - uses existing `profileMetadata` JSON field with `ai_insights` namespace.

---

*This document tracks the implementation of consolidated shared accounts while maintaining the KISS principle and preparing for future authentication features.*
