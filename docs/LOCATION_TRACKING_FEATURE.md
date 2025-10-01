# Location & Browser Tracking Feature

## Overview
Enhanced the Users & Leads table with browser context and location tracking to provide better insights into user demographics.

## What Was Added

### 1. Database Schema
- **New fields in `Fingerprint` model:**
  - `browser` (String): Browser name (Chrome, Firefox, Safari, etc.)
  - `device` (String): Device type (Desktop, Mobile, Tablet)
  - `location` (JSON): City, country, and region data

### 2. Backend Implementation
- **Geolocation utility** (`src/lib/utils/geolocation.ts`):
  - Uses `geoip-lite` for IP-based geolocation
  - Detects browser from User-Agent
  - Detects device type from User-Agent
  - Privacy-friendly: Only stores city-level location

- **API Updates:**
  - `/api/public/auth/token`: Captures browser/device/location from SDK context or headers
  - `/api/public/user`: Accepts browser context from SDK (public key mode)
  - `/api/v1/me`: Accepts browser context from SDK (proxy/direct API modes)
  - `/api/v1/waitlist/redeem`: Captures browser context on invitation redemption
  - `/api/v1/admin/app/[id]/users`: Returns location data with user list

- **SDK Updates** (`sdk/src/api.ts`):
  - **All SDK modes** now send browser context:
    - Public Key Mode: Sends context with token requests AND user data requests
    - Proxy Mode: Sends context with `/v1/me` requests
    - Direct API Mode: Sends context with `/v1/me` requests
  - Uses `getBrowserContext()` to provide browser/device info
  - Server-side detection from headers as fallback
  - SDK rebuilt and ready to use (v0.5.7)

### 3. UI Enhancement
**Users & Leads Table** now displays:
- **User Column:**
  - Fingerprint icon (teal colored)
  - Display name (or `fp_xxxxx` if no name)
  - Browser • Device info
  - Email with verification badge

- **New Location Column:**
  - City or country name with map pin icon
  - Active/Inactive status badge (green if active within 5 minutes)

- **CSV Export:** Now includes Browser, Device, and Location columns

## Technology Stack
- **geoip-lite**: Free, offline IP geolocation (no API limits)
- **Prisma**: Database ORM for schema updates
- **Lucide React**: Icons (Fingerprint, MapPin)
- **Tailwind CSS**: Styling

## Privacy Considerations
- Only city-level location is stored (not precise coordinates)
- Local IPs (127.0.0.1, 192.168.x, 10.x) are skipped
- No tracking cookies or invasive methods
- Data is only captured on authentication/fingerprint creation

## Migration
The migration file is located at:
`prisma/migrations/20250930_add_browser_device_location/migration.sql`

To apply it when the database is accessible:
```bash
npx prisma migrate deploy
```

## Usage
The feature works automatically:
1. When users authenticate via SDK, their browser/device/location is captured
2. Admin dashboard displays this info in the Users & Leads table
3. Data updates if browser or device changes

## Future Enhancements
- Country flag icons
- Browser-specific icons
- Time zone detection
- Session tracking by location
