# Self-Service Name Change Feature

## Overview

Allow users to change their name on any app through a secure, self-service flow within the SDK widget. Uses an authorization code sent via email to verify intent and identity.

## Problem Statement

- Users sometimes enter fake/garbage names initially (e.g., "asdf", "test")
- Later, they want to correct their name but have no way to do so
- Currently requires manual database intervention by developers
- Need a secure, scalable, self-service solution

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Approach** | Self-service via widget | Scalable, no admin burden |
| **Security** | Requires verified email | Proves identity |
| **Authorization** | 6-digit code via email | Familiar OTP-style UX, stays in widget |
| **Code TTL** | 10 minutes | Standard for OTPs |
| **Rate limit** | 10 minutes (same as TTL) | Prevents email spam while allowing retries |
| **Failed attempts** | 3 max, then temp lock | Prevents brute force |
| **Lock duration** | 5 minutes | Sufficient deterrent, not too punishing |
| **Scope** | Updates Lead + OrgUserAccount | Maintains current behavior |

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: User initiates name change                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Widget                                                   │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Your Profile                                       │  │  │
│  │  │                                                     │  │  │
│  │  │  Name: lol                    [Change]              │  │  │
│  │  │  Email: pablo@example.com ✓                         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: User enters new name                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Widget                                                   │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Change Your Name                                   │  │  │
│  │  │                                                     │  │  │
│  │  │  Current name: lol                                  │  │  │
│  │  │                                                     │  │  │
│  │  │  New name: [Pablo Schaffner    ]                    │  │  │
│  │  │                                                     │  │  │
│  │  │  [Send Verification Code]                           │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Email sent with code                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Email                                                    │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Subject: Confirm your name change                  │  │  │
│  │  │                                                     │  │  │
│  │  │  Hi!                                                │  │  │
│  │  │                                                     │  │  │
│  │  │  You requested to change your name to:              │  │  │
│  │  │  "Pablo Schaffner"                                  │  │  │
│  │  │                                                     │  │  │
│  │  │  Your verification code is: 847293                  │  │  │
│  │  │                                                     │  │  │
│  │  │  This code expires in 10 minutes.                   │  │  │
│  │  │                                                     │  │  │
│  │  │  If you didn't request this, ignore this email.     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: User enters code in widget                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Widget                                                   │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Enter Verification Code                            │  │  │
│  │  │                                                     │  │  │
│  │  │  We sent a code to p***@example.com                 │  │  │
│  │  │                                                     │  │  │
│  │  │  Changing name to: "Pablo Schaffner"                │  │  │
│  │  │                                                     │  │  │
│  │  │  Code: [8] [4] [7] [2] [9] [3]                      │  │  │
│  │  │                                                     │  │  │
│  │  │  [Confirm Change]                                   │  │  │
│  │  │                                                     │  │  │
│  │  │  Didn't receive? [Resend] (available in 8:32)       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Success                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Widget                                                   │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  ✓ Name Updated!                                    │  │  │
│  │  │                                                     │  │  │
│  │  │  Your name has been changed to:                     │  │  │
│  │  │  "Pablo Schaffner"                                  │  │  │
│  │  │                                                     │  │  │
│  │  │  [Done]                                             │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Failed Attempts Lock Screen

After 3 incorrect code entries:

```
┌─────────────────────────────────────────────────────────────────┐
│  Widget (Locked Overlay)                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                                                     │  │  │
│  │  │               🔒 Too Many Attempts                  │  │  │
│  │  │                                                     │  │  │
│  │  │   For security, this feature is temporarily         │  │  │
│  │  │   locked due to multiple incorrect codes.           │  │  │
│  │  │                                                     │  │  │
│  │  │   Please try again in: 4:32                         │  │  │
│  │  │                                                     │  │  │
│  │  │   [Close]                                           │  │  │
│  │  │                                                     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Email not verified | Show message: "Verify your email first to change your name" |
| Code expired | Show message: "Code expired. Request a new one." |
| Code already used | Reject with "Code already used" |
| Request new code before TTL | Show countdown: "Request new code in X:XX" |
| User enters same name | Validate and reject: "New name must be different" |
| Empty/invalid name | Client-side validation before sending |
| Multiple tabs open | Code is per-fingerprint; works in any tab |

## API Endpoints

### 1. Request Name Change Code

```
POST /api/public/profile/name/request-change
```

**Headers:**
- `x-public-token`: JWT with fingerprint

**Request Body:**
```json
{
  "newName": "Pablo Schaffner"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification code sent",
  "email": "p***@example.com",
  "expiresAt": "2026-01-05T12:10:00Z"
}
```

**Response (Errors):**
- `400`: Invalid name / Same as current name
- `403`: Email not verified
- `429`: Rate limited (code already sent, not expired)

### 2. Confirm Name Change

```
POST /api/public/profile/name/confirm-change
```

**Headers:**
- `x-public-token`: JWT with fingerprint

**Request Body:**
```json
{
  "code": "847293"
}
```

**Response (Success):**
```json
{
  "success": true,
  "name": "Pablo Schaffner"
}
```

**Response (Errors):**
- `400`: Invalid/expired code
- `403`: Too many failed attempts (locked)
- `404`: No pending name change request

## Database Changes

### New Table: `ProfileChangeRequest`

```prisma
model ProfileChangeRequest {
  id              String    @id @default(cuid())
  fingerprintId   String
  appId           String
  type            String    // "name", "email" (extensible for future)
  newValue        String    // The requested new value
  code            String    // 6-digit code (hashed)
  expiresAt       DateTime
  usedAt          DateTime?
  failedAttempts  Int       @default(0)
  createdAt       DateTime  @default(now())
  
  fingerprint     Fingerprint @relation(fields: [fingerprintId], references: [id], onDelete: Cascade)
  app             App         @relation(fields: [appId], references: [id], onDelete: Cascade)
  
  @@unique([fingerprintId, appId, type])
  @@index([code])
  @@index([expiresAt])
  @@map("profile_change_requests")
}
```

**Notes:**
- `@@unique([fingerprintId, appId, type])` ensures only one pending request per type per user per app
- `type` field allows reuse for email changes later
- `code` should be hashed (bcrypt or similar) for security
- `failedAttempts` tracked in DB, but **lock state is client-side only** (simpler, sufficient for this use case)
- Old/expired records can be cleaned up via cron job

## SDK Widget Changes

### New Components

1. **NameChangeModal** - Modal/screen for the name change flow
2. **CodeInput** - 6-digit code input (reusable for future OTP flows)
3. **LockOverlay** - Temporary lock screen after failed attempts

### State Management

```typescript
interface NameChangeState {
  step: 'idle' | 'enterName' | 'enterCode' | 'success' | 'locked';
  newName: string;
  maskedEmail: string;
  expiresAt: Date | null;
  failedAttempts: number;      // Client-side tracking
  lockedUntil: Date | null;    // Client-side only (5-min lock after 3 failures)
  error: string | null;
}
```

**Note:** Lock state is managed client-side only. If user refreshes the page, lock resets - this is acceptable since the code itself expires in 10 minutes anyway.

### New SDK Methods

```typescript
// Request name change (sends code)
growthkit.requestNameChange(newName: string): Promise<{
  success: boolean;
  maskedEmail: string;
  expiresAt: string;
}>

// Confirm name change (verify code)
growthkit.confirmNameChange(code: string): Promise<{
  success: boolean;
  name: string;
}>
```

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Code brute force | 3 attempts max, then 5-minute lock (client-side) |
| Email spam | 10-minute rate limit (same as TTL) |
| Code interception | Codes expire in 10 minutes |
| Replay attacks | Code marked as used after successful verification |
| Enumeration | Generic error messages, masked email |

## Analytics & Logging

Track name change events in `EventLog`:

| Event | When | Metadata |
|-------|------|----------|
| `profile.name_change_requested` | Code sent | `{ newName, fingerprintId }` |
| `profile.name_change_completed` | Name updated | `{ oldName, newName, fingerprintId }` |
| `profile.name_change_failed` | Wrong code entered | `{ fingerprintId, attemptCount }` |
| `profile.name_change_locked` | 3 failed attempts | `{ fingerprintId, lockedUntil }` |

## Implementation Phases

### Phase 1: Backend (API + Database)
1. Create `ProfileChangeRequest` model
2. Implement `/profile/name/request-change` endpoint
3. Implement `/profile/name/confirm-change` endpoint
4. Add email template for name change code (match existing GrowthKit email styling)

### Phase 2: SDK Widget
1. Add "Change" button to profile section (if email verified)
2. Create NameChangeModal component
3. Create CodeInput component
4. Create LockOverlay component
5. Add SDK methods (`requestNameChange`, `confirmNameChange`)

### Phase 3: Testing & Polish
1. Test full flow end-to-end
2. Test edge cases (expiry, rate limit, lock)
3. Mobile responsiveness
4. Localization (if applicable)

## Future Extensibility

This pattern can be reused for:
- **Email change** (same flow, different `type`)
- **Account deletion** (require code to confirm)
- **Data export** (GDPR compliance)
- **Sensitive actions** (revoke sessions, etc.)

The `ProfileChangeRequest.type` field and generic code verification flow support all these use cases with minimal additional work.

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Email template | Match existing GrowthKit email styling |
| Lock persistence | Client-side only (sufficient for this use case) |
| Analytics | Track events in EventLog |

---

*Created: January 5, 2026*
*Status: Ready for Implementation*

