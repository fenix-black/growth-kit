# Simple Admin Users Plan

**Goal**: Replace hardcoded single admin with support for multiple admin users and basic organization concept - THAT'S IT!

## Current State ✅
- Simple username/password login with hardcoded env vars
- HMAC session tokens (no database dependency) 
- Clean, functional admin dashboard
- Everything works perfectly for single user

## What We Actually Need (Minimal Changes)

### Phase 1: Add User Database Table
**Goal**: Store multiple admin users instead of env vars

- [ ] Add simple `User` table to schema:
  ```prisma
  model User {
    id        String   @id @default(cuid())
    email     String   @unique
    password  String   // bcrypt hash
    name      String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```
- [ ] Create `/api/admin/setup` endpoint (one-time only, removes env dependency)
- [ ] Migrate from hardcoded `ADMIN_USER` to database lookup
- [ ] Keep existing session system (HMAC tokens work great!)
- [ ] Update login page: change "username" to "email"

### Phase 2: Add Organization Concept  
**Goal**: Multiple admins can manage the same apps

- [ ] Add simple `Organization` table:
  ```prisma
  model Organization {
    id     String @id @default(cuid())
    name   String
    users  User[] // simple many-to-many
    apps   App[]  // apps belong to orgs instead of being global
  }
  ```
- [ ] Update `App` model: add `organizationId` field
- [ ] Update dashboard to show org-specific apps only
- [ ] Add simple team management page (list users, add/remove)

### Phase 3: Basic User Management
**Goal**: Invite new users to join the organization

- [ ] Add simple invite system:
  - Send email with signup link
  - New user creates account and joins org
- [ ] Add users list in admin panel
- [ ] Add/remove users functionality

## What We're NOT Building (Keep It Simple!)

❌ **Multiple roles** (everyone is admin)  
❌ **Credit system** (not needed)  
❌ **Plans/billing** (not needed)  
❌ **Email templates** (just send simple emails)  
❌ **Password reset** (admin contact for issues)  
❌ **Complex onboarding** (just redirect to dashboard)  
❌ **Super admin** (first user is owner)  

## Implementation Notes

- **Keep existing HMAC sessions** - they work great!
- **Minimal UI changes** - reuse existing components
- **No breaking changes** to public SDK/widget
- **Simple = less bugs = faster shipping**
- **Database only for users/orgs** - everything else stays the same

## Success Criteria

✅ Multiple people can log in with their own accounts  
✅ They see the same apps (shared organization)  
✅ They can invite new team members  
✅ Existing functionality continues to work  
✅ **Total implementation: ~1 day instead of ~1 week**

---

This plan accomplishes the ACTUAL requirement: **"multiple admin users managing the same apps"** without turning GrowthKit into a CRM. 😊
