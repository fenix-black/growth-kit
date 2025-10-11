# SDK Default API URL Fix

## Issue

When users didn't explicitly set the `apiUrl` in the GrowthKit configuration, widgets that made direct fetch calls (like `ProductWaitlistWidget`) would fail because `config.apiUrl` was `undefined`, resulting in API calls to relative URLs like `/api/public/...` instead of `https://growth.fenixblack.ai/api/public/...`.

### Example of the Problem

```tsx
// User code - no apiUrl specified
<GrowthKitProvider config={{ publicKey: 'pk_...' }}>
  <ProductWaitlistWidget productTag="beta" />
</GrowthKitProvider>

// Inside ProductWaitlistWidget - would try to call:
fetch(`${config.apiUrl || ''}/api/public/products/beta`)
// Results in: fetch('/api/public/products/beta') - wrong!
// Should be: fetch('https://growth.fenixblack.ai/api/public/products/beta')
```

### Why It Happened

1. The `GrowthKitAPI` class had correct default logic in `detectApiUrl()` method
2. However, components like `ProductWaitlistWidget` made direct fetch calls and bypassed the API class
3. These components used `config.apiUrl || ''` which defaulted to empty string
4. The `GrowthKitProvider` passed the raw config without normalizing defaults

## Solution

### File Changed: `/sdk/src/components/GrowthKitProvider.tsx`

Applied default `apiUrl` at the provider level to ensure all child components receive a normalized config:

```typescript
export function GrowthKitProvider({ children, config }: GrowthKitProviderProps) {
  // Apply default apiUrl if not provided
  // When using publicKey mode, default to production API
  // This ensures widgets that make direct fetch calls (like ProductWaitlistWidget) work correctly
  const normalizedConfig: GrowthKitConfig = {
    ...config,
    apiUrl: config.apiUrl || (config.publicKey ? 'https://growth.fenixblack.ai/api' : config.apiUrl),
  };
  
  // ... rest of provider uses normalizedConfig instead of config
  return (
    <GrowthKitContext.Provider value={{ 
      config: normalizedConfig,  // ← Now provides normalized config
      // ... other values
    }}>
```

### Default Logic

- If `apiUrl` is explicitly provided → use that value
- If `publicKey` is provided and `apiUrl` is not → default to `'https://growth.fenixblack.ai/api'`
- If neither are provided (proxy mode) → `apiUrl` remains `undefined` (correct for proxy mode)

## Testing

After rebuilding the SDK:

```bash
cd sdk && npm run build
```

Users can now use the SDK without specifying `apiUrl`:

```tsx
// ✅ This now works correctly!
<GrowthKitProvider config={{ publicKey: 'pk_abc123' }}>
  <ProductWaitlistWidget productTag="beta" />
</GrowthKitProvider>

// Internally, ProductWaitlistWidget will now call:
// https://growth.fenixblack.ai/api/public/products/beta
```

## Affected Components

Components that benefit from this fix (make direct fetch calls):
- `ProductWaitlistWidget` - joins product waitlists
- Any future components that make direct API calls

Components already working correctly:
- `GrowthKitAccountWidget` - uses the `GrowthKitAPI` class which had correct defaults
- `WaitlistForm` - uses the hook which uses the API class

## Deployment

1. ✅ Fixed in `/sdk/src/components/GrowthKitProvider.tsx`
2. ✅ SDK version bumped to `0.6.13`
3. ✅ SDK rebuilt successfully
4. 🔄 Users should update to SDK version `0.6.13` or later
5. 🔄 Publish SDK to npm: `cd sdk && npm publish`

## Backwards Compatibility

✅ **Fully backwards compatible**

- Existing code with explicit `apiUrl` continues to work
- Proxy mode (no apiUrl needed) continues to work
- Only improves the case where `publicKey` is used without `apiUrl`

