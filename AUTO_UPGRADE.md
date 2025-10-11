# Auto-Upgrade SDK Implementation

> **Goal**: Automatically update widget SDK in all apps when server deploys, similar to Expo OTA updates.

## Architecture Summary

- **Approach**: Hybrid loader with CDN delivery
- **TTL**: 2 minutes (testing phase)
- **Bundle**: UMD with React bundled (~150-200KB, <1MB acceptable)
- **Strategy**: Load bundled version immediately, upgrade in background
- **Version**: Read from `sdk/package.json` + build hash
- **Deployment**: Automatic on every server deployment (Vercel)
- **Storage**: Separate `SdkVersionUsage` table for tracking

---

## Implementation Phases

### Phase 1: Server Infrastructure ✅
- [x] Create SDK version endpoint (`/api/sdk/version/route.ts`)
  - Returns version, buildHash, buildTime, bundleUrl, forceUpdate flag
  - Reads from `sdk/package.json`
- [x] Create SDK bundle endpoint (`/api/sdk/latest/route.ts`)
  - Serves `sdk/dist/bundle.umd.js`
  - Sets proper CORS headers
  - Sets cache headers for CDN (2 min)
- [x] Update root build script to compile SDK before Next.js build
- [x] Add test script (`scripts/test-sdk-endpoints.js`)

### Phase 2: SDK Build System ✅
- [x] Create UMD build config (`sdk/tsup.umd.config.ts`)
  - Format: IIFE (self-executing)
  - Global name: `window.GrowthKit`
  - Bundle React + all dependencies
  - Minified output
- [x] Create browser-only entry point (`sdk/src/browser.ts`)
- [x] Add build:all script to `sdk/package.json` (builds both regular + UMD)
- [x] Update root `package.json` build script to use build:all
- [x] Test builds successfully (regular SDK + 323KB UMD bundle)
- [x] Create test HTML file for manual verification
- [x] Fix build issues (ensure both regular and UMD bundles coexist)

### Phase 3: Database Schema
- [ ] Add `SdkVersionUsage` table to Prisma schema
  - Fields: id, fingerprintId, appId, sdkVersion, loadSource, createdAt
  - Relations to Fingerprint and App
  - Indexes for querying
- [ ] Run `npx prisma db push`
- [ ] Verify table created in production database

### Phase 4: Loader Logic (SDK)
- [ ] Create loader wrapper in SDK
  - Version check logic with 2-min TTL
  - localStorage cache management
  - Fetch from CDN with fallback to bundled
  - Force update detection
- [ ] Update `GrowthKitProvider` to use loader
  - Add `autoUpdate`, `updateCheckTTL`, `updateStrategy` config options
  - Background loading with bundled fallback
- [ ] Log SDK version to server on initialization
  - Send version in API calls or separate tracking call
  - Create `SdkVersionUsage` record
- [ ] Add debug logging for version checks (dev mode)

### Phase 5: Testing & Rollout
- [ ] Publish new SDK version (v0.9.0)
- [ ] Update `example-app` to use new SDK
- [ ] Test auto-update flow
  - Deploy SDK change
  - Wait 2 minutes
  - Verify app loads new version
- [ ] Test fallback when offline
- [ ] Update 1-2 friend/family apps
- [ ] Monitor for issues

### Phase 6: Admin Dashboard
- [ ] Add SDK version stats to admin dashboard
  - Current version distribution per app
  - Load source breakdown (cdn/bundled/cache)
- [ ] Add version filter/search
- [ ] Show apps with outdated versions (if force update needed)

### Phase 7: Polish & Documentation
- [ ] Update SDK README with new loading behavior
- [ ] Document config options
- [ ] Add emergency force update instructions
- [ ] Update example-app documentation

---

## Configuration

```typescript
<GrowthKitProvider
  publicKey="gk_pub_xxxxx"
  config={{
    autoUpdate: true,              // Enable auto-updates
    updateCheckTTL: 120000,        // 2 min (milliseconds)
    updateStrategy: 'background',  // Load bundled, upgrade async
    updateTimeout: 3000,           // CDN fetch timeout
    updateDebug: true,             // Log version checks
  }}
/>
```

---

## Emergency Force Update

Edit version endpoint response to set `forceUpdate: true` - invalidates all caches immediately.

---

## Future Optimizations (Not Now)

- [ ] Switch React → Preact for smaller bundle (~50-80KB)
- [ ] Per-app version pinning
- [ ] Historical version serving
- [ ] Load performance monitoring
- [ ] Version rollback mechanism

---

## Notes

- Single database (production only)
- No separate dev/staging environments
- CORS config same as API endpoints
- Build happens automatically on Vercel deployment
- Version format: `{semver}+{timestamp}.{githash}`
- We don't run local server, just remote (use scripts if you need to test things)

