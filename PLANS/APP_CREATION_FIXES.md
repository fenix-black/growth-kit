# App Creation Fixes - Summary

## Issues Fixed

### 1. Missing `invitationCredits` in Credit Policy JSON ✅

**Problem**: New apps were missing the `invitationCredits` key in their `policyJson`, which is needed for stating the amount of credits given to new visitors.

**Solution**:
- Added `invitationCredits` to the policyJson construction in the frontend wizard (set to the same value as `dailyCredits`)
- Added a fallback in the backend endpoint to ensure `invitationCredits` defaults to 5 if not provided

**Files Changed**:
- `src/app/admin/apps/new/AppCreationWizard.tsx` (line 373)
- `src/app/api/admin/apps/route.ts` (lines 129-132)

### 2. Track USD Value Not Enabled by Default ✅

**Problem**: New apps were starting with `trackUsdValue` set to `false` instead of `true`.

**Solution**:
- Set `trackUsdValue` default to `true` in the backend endpoint
- The frontend wizard already had it set to `true` (line 148), but the backend wasn't receiving it

**Files Changed**:
- `src/app/api/admin/apps/route.ts` (line 122, 168)

### 3. Showing API Key Instead of Public Token ✅

**Problem**: After creating an app, the modal was showing an API key (server-side secret) instead of the public token (client-side safe key).

**Solution**:
- Updated backend to generate and return a `publicKey` instead of the API key
- The API key is still generated for server-side usage but not returned to the frontend
- Updated frontend modal to display "Public Token" with appropriate messaging
- Changed variable names from `newApiKey`/`showApiKeyModal` to `newPublicKey`/`showPublicKeyModal`

**Files Changed**:
- `src/app/api/admin/apps/route.ts` (lines 6, 152-153, 169, 219-220)
- `src/app/admin/apps/new/AppCreationWizard.tsx` (lines 123-124, 417-420, 1390-1433)

## Complete Credit Policy Structure

After these fixes, new apps will have a complete `policyJson` with all required fields:

```json
{
  "referralCredits": 5,
  "referredCredits": 3,
  "nameClaimCredits": 2,
  "emailClaimCredits": 2,
  "emailVerifyCredits": 5,
  "invitationCredits": 3,  // ← Now included!
  "dailyReferralCap": 10,
  "actions": {
    "default": { "creditsRequired": 1 }
  }
}
```

## Public Key vs API Key

**Public Key** (`pk_...`):
- Safe to expose in client-side code
- Used by the SDK in React/Next.js applications
- Generated automatically when creating an app
- Shown in the success modal after app creation

**API Key** (`gk_...`):
- Server-side secret, should never be exposed
- Still generated for server-side operations
- Stored hashed in the database
- Can be viewed later in the "API Tokens" section

## Testing

To verify the fixes:

1. **Create a new app** through the admin dashboard
2. **Check the success modal** - it should show a "Public Token" starting with `pk_`
3. **Verify in database**:
   ```sql
   SELECT "policyJson", "trackUsdValue", "publicKey" 
   FROM apps 
   WHERE name = 'Your New App Name';
   ```
4. **Confirm**:
   - `policyJson` includes `invitationCredits`
   - `trackUsdValue` is `true`
   - `publicKey` is populated with a `pk_` prefixed key

## Migration Note

Existing apps created before this fix may be missing:
- `invitationCredits` in their policyJson
- Proper `trackUsdValue` setting

To fix existing apps, you can run:

```sql
-- Add invitationCredits to existing apps (if missing)
UPDATE apps 
SET "policyJson" = jsonb_set(
  "policyJson"::jsonb, 
  '{invitationCredits}', 
  '5'::jsonb, 
  true
)
WHERE NOT "policyJson"::jsonb ? 'invitationCredits';

-- Enable trackUsdValue for existing apps
UPDATE apps 
SET "trackUsdValue" = true 
WHERE "trackUsdValue" = false;
```
