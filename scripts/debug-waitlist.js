#!/usr/bin/env node

/**
 * Debug script to check what the WaitlistForm should receive
 * 
 * This simulates what the SDK state should contain
 */

console.log(`
📋 Debugging Waitlist Component
================================

The WaitlistForm component does:

1. const { app } = useGrowthKit();
2. const brandColor = app?.primaryColor || themeColors.primary;
3. const layout = app?.waitlistLayout || 'centered';

✅ If app branding is working, you should see in browser console (with debug: true):
   [GrowthKit] API Response: { ..., app: { name, logoUrl, description, ... } }

❌ If app is undefined or missing fields, check:

1. Is the API returning app data?
   Run: node scripts/test-me-endpoint.js <appId>
   
2. Is the SDK state being updated with app data?
   Check sdk/src/useGrowthKit.ts line 242: app: data.app
   
3. Is the deployed SDK the latest version?
   The deployed app should use @fenixblack/growthkit@0.6.1 from NPM
   
4. Browser cache issue?
   Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

🔍 To debug in browser:
   1. Open browser console on the waitlist page
   2. Type: localStorage.clear(); sessionStorage.clear();
   3. Refresh the page
   4. Look for: [GrowthKit] logs if debug mode is on

💡 Quick test - Add this to WaitlistForm.tsx temporarily:
   
   console.log('🎨 WaitlistForm Debug:', {
     hasApp: !!app,
     appName: app?.name,
     logoUrl: app?.logoUrl,
     primaryColor: app?.primaryColor,
     waitlistLayout: app?.waitlistLayout,
   });

This will show you if the app object is reaching the component.
`);

