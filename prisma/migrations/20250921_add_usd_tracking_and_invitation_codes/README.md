# USD Tracking and Invitation Codes Migration

This migration adds support for Phase 12 features:
- USD value tracking for user actions
- Unique invitation codes for waitlist users

## Schema Changes

### Apps Table
- Added `trackUsdValue` (BOOLEAN, default: false) - Enable USD tracking per app

### Usage Table  
- Added `usdValue` (DECIMAL(10,2)) - Track monetary value of user actions
- Added index on `usdValue` for performance

### Waitlist Table
- Added `invitationCode` (TEXT) - Unique invitation code per user
- Added `fingerprintId` (TEXT) - Link to fingerprint when code is redeemed
- Added `codeUsedAt` (TIMESTAMP) - Track when code was redeemed
- Added `codeExpiresAt` (TIMESTAMP) - Expiration date for invitation codes
- Added `maxUses` (INTEGER, default: 1) - Maximum number of times code can be used
- Added `useCount` (INTEGER, default: 0) - Current usage count
- Added unique compound index on `[appId, invitationCode]`
- Added indexes on `invitationCode` and `fingerprintId` for performance

## To Apply This Migration

When the database is available, run:

```bash
# Option 1: Apply using Prisma migrate
npx prisma migrate deploy

# Option 2: Apply using db push (development)
npx prisma db push --accept-data-loss

# Option 3: Run the SQL directly
psql $DATABASE_URL < migration.sql
```

## Notes

- The migration is backward compatible - existing functionality is not affected
- USD tracking is opt-in per app (disabled by default)
- Invitation codes are generated only for new invitations
- All new fields have sensible defaults or are nullable
