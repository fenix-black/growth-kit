# GrowthKit API Documentation

## Overview
GrowthKit is a referral and waitlist management system with USD value tracking capabilities. This document covers all available API endpoints.

## Authentication

### Service Key
Admin endpoints require a service key in the Authorization header:
```
Authorization: Bearer YOUR_SERVICE_KEY
```

### App Key
SDK endpoints require an app key in the X-App-Key header:
```
X-App-Key: YOUR_APP_KEY
```

## API Endpoints

### User Management

#### GET /api/v1/me
Get current user's fingerprint, credits, and usage data.

**Headers:**
- `X-App-Key`: Required
- `X-Fingerprint`: Required

**Query Parameters:**
- `claim`: Optional - Referral code or invitation code to claim

**Response:**
```json
{
  "success": true,
  "data": {
    "fingerprint": "string",
    "referralCode": "string",
    "credits": 10,
    "usage": 5,
    "leads": [],
    "waitlistStatus": "waiting|invited|accepted",
    "totalUsdSpent": 0,
    "usdTrackingEnabled": false
  }
}
```

### Referral System

#### GET /api/v1/referral/visit
Track a referral link visit.

**Headers:**
- `X-App-Key`: Required

**Query Parameters:**
- `code`: Required - Referral code

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "REF-ABC123"
  }
}
```

#### POST /api/v1/referral/exchange
Exchange a referral code for credits.

**Headers:**
- `X-App-Key`: Required
- `X-Fingerprint`: Required

**Body:**
```json
{
  "referralCode": "REF-ABC123"
}
```

### Claims & Verification

#### POST /api/v1/claim/name
Claim credits by providing a name.

**Headers:**
- `X-App-Key`: Required
- `X-Fingerprint`: Required

**Body:**
```json
{
  "name": "John Doe"
}
```

#### POST /api/v1/claim/email
Claim credits by providing an email.

**Headers:**
- `X-App-Key`: Required
- `X-Fingerprint`: Required

**Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/v1/send-verification
Send email verification code.

**Headers:**
- `X-App-Key`: Required
- `X-Fingerprint`: Required

**Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/v1/verify/email
Verify email with code.

**Headers:**
- `X-App-Key`: Required
- `X-Fingerprint`: Required

**Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

### Action Completion

#### POST /api/v1/complete
Complete an action and consume credits.

**Headers:**
- `X-App-Key`: Required
- `X-Fingerprint`: Required

**Body:**
```json
{
  "action": "string",
  "usdValue": 9.99,  // Optional - for USD tracking
  "metadata": {}      // Optional - custom data
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "creditsUsed": 1,
    "creditsRemaining": 9,
    "usdValue": 9.99,
    "totalUsdSpent": 99.99
  }
}
```

### Waitlist

#### POST /api/v1/waitlist
Join the waitlist.

**Headers:**
- `X-App-Key`: Required
- `X-Fingerprint`: Optional

**Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/v1/waitlist/redeem
Redeem an invitation code.

**Headers:**
- `X-App-Key`: Required

**Body:**
```json
{
  "invitationCode": "INV-ABC123",
  "fingerprint": "string"
}
```

## Admin Endpoints

### App Management

#### GET /api/v1/admin/app
List all apps.

**Headers:**
- `Authorization`: Bearer token required

#### POST /api/v1/admin/app
Create a new app.

**Headers:**
- `Authorization`: Bearer token required

**Body:**
```json
{
  "name": "My App",
  "domain": "myapp.com",
  "corsOrigins": ["http://localhost:3000"],
  "redirectUrl": "https://myapp.com",
  "policy": {},
  "trackUsdValue": false
}
```

#### PUT /api/v1/admin/app
Update app configuration.

**Headers:**
- `Authorization`: Bearer token required

**Body:**
```json
{
  "id": "app-id",
  "waitlistEnabled": true,
  "autoInviteEnabled": true,
  "dailyInviteQuota": 10,
  "trackUsdValue": true
}
```

### Metrics & Analytics

#### GET /api/v1/admin/metrics
Get general metrics.

**Headers:**
- `Authorization`: Bearer token required

**Query Parameters:**
- `appId`: Optional
- `event`: Optional - Event type filter
- `timeRange`: Optional - 24h, 7d, 30d, all

#### GET /api/v1/admin/metrics/usd
Get USD value metrics.

**Headers:**
- `Authorization`: Bearer token required

**Query Parameters:**
- `appId`: Optional
- `startDate`: Optional - ISO date
- `endDate`: Optional - ISO date
- `groupBy`: Optional - user, action, day, week, month

### Waitlist Management

#### GET /api/v1/admin/waitlist
Get waitlist entries.

**Headers:**
- `Authorization`: Bearer token required

**Query Parameters:**
- `appId`: Required

#### POST /api/v1/admin/invite-batch
Manually invite users from waitlist.

**Headers:**
- `Authorization`: Bearer token required

**Body:**
```json
{
  "appId": "app-id",
  "limit": 10,
  "emails": ["user@example.com"]
}
```

### Email Templates

#### GET /api/v1/admin/email-templates
Get email templates.

**Headers:**
- `Authorization`: Bearer token required

**Query Parameters:**
- `appId`: Required

#### POST /api/v1/admin/email-templates
Update email template.

**Headers:**
- `Authorization`: Bearer token required

**Body:**
```json
{
  "appId": "app-id",
  "templateType": "invitation",
  "subject": "You're invited!",
  "htmlContent": "<html>...</html>",
  "textContent": "Plain text version..."
}
```

## Cron Jobs

### GET /api/cron/invite-waitlist
Automated waitlist invitation job (runs hourly).

**Headers:**
- `Authorization`: Bearer CRON_SECRET

This endpoint is called by Vercel Cron to automatically invite waitlisted users based on app configurations.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message"
}
```

Common error codes:
- `UNAUTHORIZED` - Invalid or missing API key
- `FORBIDDEN` - Access denied
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid request parameters
- `INTERNAL_ERROR` - Server error

## Rate Limiting

API endpoints are rate limited:
- Public endpoints: 100 requests per minute per IP
- Admin endpoints: 1000 requests per minute per service key

## USD Value Tracking

When USD tracking is enabled for an app:
1. Include `usdValue` in `/v1/complete` requests
2. Values are stored with 2 decimal precision
3. Maximum single transaction: $10,000
4. Access metrics via `/v1/admin/metrics/usd`

## Invitation Codes

Unique invitation codes follow the format: `INV-XXXXXX`
- Valid for 7 days by default
- Single use per fingerprint
- Grants master referral credits upon redemption

## CORS Configuration

CORS is automatically handled for configured origins. Include your domain in the app's `corsOrigins` array during creation or update.
