# @fenixblack/growthkit

React SDK for GrowthKit - Intelligent waitlist and referral management system with Next.js middleware support.

## Installation

```bash
npm install @fenixblack/growthkit
# or
yarn add @fenixblack/growthkit
```

## Import Paths

The SDK provides three separate entry points optimized for different environments:

### Main Package (React Components & Hooks)
```tsx
// For React components and hooks (client-side)
import { 
  useGrowthKit, 
  GrowthKitGate, 
  WaitlistForm,
  GrowthKitAccountWidget,
  useTranslation,
  useLocalization,
  // Theme utilities
  getThemeColors,
  getEffectiveTheme,
  lightTheme,
  darkTheme
} from '@fenixblack/growthkit';

// TypeScript types
import type { 
  Language, 
  Translations, 
  GrowthKitTheme,
  ThemeColors,
  GrowthKitAccountWidgetRef 
} from '@fenixblack/growthkit';
```

### Middleware (Edge Runtime Compatible)
```ts
// For Next.js middleware (Edge Runtime)
import { createGrowthKitMiddleware } from '@fenixblack/growthkit/middleware';
```

### Server Utilities (Node.js)
```ts
// For server-side utilities (Node.js)
import { GrowthKitServer, createGrowthKitServer } from '@fenixblack/growthkit/server';
```

## Complete Setup (3 Steps)

### 1. Add Middleware (handles referral links & email verification)

Create `middleware.ts` in your Next.js root:

```ts
// middleware.ts
import { createGrowthKitMiddleware } from '@fenixblack/growthkit/middleware';

export const middleware = createGrowthKitMiddleware({
  apiKey: process.env.GROWTHKIT_API_KEY!,
  apiUrl: process.env.GROWTHKIT_API_URL!,
  referralPath: '/r',  // Handles /r/CODE links
  redirectTo: '/',      // Where to redirect after processing
});

export const config = {
  matcher: ['/r/:code*', '/verify', '/invite/:code*', '/api/growthkit/:path*']  // Handles referrals, verification, invitations, and API proxying
};
```

The middleware automatically handles:
- **Referral links**: `/r/ABC123` → exchanges code for claim token → redirects to `/?ref=token`
- **Email verification**: `/verify?token=xyz` → verifies email → redirects to `/?verified=true`  
- **Invitation codes**: `/invite/INV-XXXXXX` → redirects with code → grants invitation credits
- **API Proxying**: `/api/growthkit/*` → securely proxies widget API calls with server-side credentials

### 2. Set Environment Variables

```env
# .env.local - Server-side only (secure)
GROWTHKIT_API_KEY=gk_your_api_key_here
GROWTHKIT_API_URL=https://growth.fenixblack.ai/api
```

**🔒 Security Note**: The API key is server-side only and never exposed to the client. The middleware handles all API proxying automatically.

## Migration from v1.x (Legacy Direct Mode)

If you're upgrading from a previous version that used `NEXT_PUBLIC_GROWTHKIT_API_KEY`:

### 1. Update your middleware matcher to include API proxying:
```tsx
export const config = {
  matcher: ['/r/:code*', '/verify', '/invite/:code*', '/api/growthkit/:path*']
};
```

### 2. Update your environment variables:
```env
# Remove these (old, insecure):
# NEXT_PUBLIC_GROWTHKIT_API_KEY=...
# NEXT_PUBLIC_GROWTHKIT_API_URL=...

# Keep these (secure):
GROWTHKIT_API_KEY=gk_your_api_key_here
GROWTHKIT_API_URL=https://growth.fenixblack.ai/api
```

### 3. Update your GrowthKitProvider config:
```tsx
// Old way (still works but shows deprecation warning):
<GrowthKitProvider config={{ 
  apiKey: process.env.NEXT_PUBLIC_GROWTHKIT_API_KEY 
}}>

// New way (secure):
<GrowthKitProvider config={{ 
  debug: process.env.NODE_ENV === 'development'
}}>
```

The SDK automatically detects proxy mode when no `apiKey` is provided and routes all requests through your middleware's secure proxy.

### 4. Use the Hook

```tsx
import { useGrowthKit } from '@growthkit/sdk';

function App() {
  const gk = useGrowthKit({
    // No apiKey needed - uses secure proxy mode automatically
    debug: process.env.NODE_ENV === 'development'
  });
  
  // That's it! The hook handles everything securely
  return <div>Credits: {gk.credits}</div>;
}
```

## Quick Start

```tsx
import { useGrowthKit } from '@fenixblack/growthkit';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

function App() {
  const gk = useGrowthKit({
    apiKey: 'your-api-key',
    apiUrl: 'https://growth.fenixblack.ai/api', // Optional
  });

  // Handle email verification redirects from middleware
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('verified') === 'true') {
      toast.success('Email verified! +1 credit earned');
      gk.refresh(); // Refresh credits
      window.history.replaceState({}, '', '/');
    } else if (params.get('verified') === 'false') {
      toast.error('Verification failed');
      window.history.replaceState({}, '', '/');
    }
  }, [gk]);

  // The hook automatically:
  // 1. Generates a browser fingerprint
  // 2. Checks for referral cookies (if user came from /r/CODE link)
  // 3. Registers the user and applies any referral credits
  // 4. Fetches current credits and usage

  if (gk.loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Credits: {gk.credits}</h1>
      <p>Your Referral Link: {gk.getReferralLink()}</p>
      
      {/* Users can perform actions that consume credits */}
      <button 
        onClick={() => gk.completeAction('generate')}
        disabled={!gk.canPerformAction('generate')}
      >
        Generate ({gk.policy?.actions.generate?.creditsRequired || 1} credits)
      </button>

      {/* Users can share to earn more credits */}
      <button onClick={() => gk.share()}>
        Share & Earn Credits
      </button>
    </div>
  );
}
```

## Localization Support

The SDK supports multiple languages with real-time language switching capabilities.

### Supported Languages

- **English** (`en`) - Default
- **Spanish** (`es`)

### Configuration

Set the default language in your configuration:

```tsx
const config = {
  apiKey: 'your-api-key',
  language: 'es',      // Set Spanish as default
  theme: 'dark',       // Set dark theme (options: 'light' | 'dark' | 'auto')
};
```

### Basic Usage

```tsx
import { useGrowthKit, GrowthKitAccountWidget } from '@fenixblack/growthkit';

function App() {
  const config = {
    apiKey: 'your-api-key',
    language: 'es',    // Spanish by default
    theme: 'auto',     // Auto-detect system theme preference
  };

  return (
    <GrowthKitAccountWidget config={config}>
      <YourApp />
    </GrowthKitAccountWidget>
  );
}
```

### Programmatic Language Switching

You can change the language dynamically from the parent app:

```tsx
import { useRef } from 'react';
import { GrowthKitAccountWidget, GrowthKitAccountWidgetRef } from '@fenixblack/growthkit';

function App() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const widgetRef = useRef<GrowthKitAccountWidgetRef>(null);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'es' : 'en';
    setLanguage(newLang);
    
    // Update the widget language programmatically
    widgetRef.current?.setLanguage(newLang);
  };

  return (
    <>
      <button onClick={toggleLanguage}>
        🌍 {language === 'en' ? 'ES' : 'EN'}
      </button>
      
      <GrowthKitAccountWidget 
        ref={widgetRef}
        config={{ apiKey: 'your-key', language }}
      >
        <YourApp />
      </GrowthKitAccountWidget>
    </>
  );
}
```

### Localized Components

All user-facing components support localization:

- **WaitlistForm**: Form labels, error messages, success notifications
- **GrowthKitAccountWidget**: Credit displays, profile sections, tooltips
- **CreditExhaustionModal**: All tabs (Name, Email, Verify, Share) with complete localization
- **GrowthKitGate**: Loading states and gating messages

### Custom Translations (Advanced)

Access the translation system directly:

```tsx
import { useTranslation, useLocalization } from '@fenixblack/growthkit';

function CustomComponent() {
  const { t } = useTranslation(); // Translation function with interpolation
  const { language, setLanguage } = useLocalization(); // Current language state
  
  return (
    <div>
      <p>{t('waitlist.joinWaitlistMessage')}</p>
      <p>{t('modal.earnCreditsName', { credits: 5 })}</p>
      <p>Current language: {language}</p>
    </div>
  );
}
```

### Language Switching Features

- **Instant Updates**: Language changes apply immediately to all components
- **No Remounting**: Components update without losing state
- **Type Safety**: Full TypeScript support for language types
- **String Interpolation**: Dynamic content like "Earn {{credits}} credits"
- **Persistent State**: Widget remembers language preference

## Hook Properties

The `useGrowthKit` hook returns an object with the following properties:

```typescript
{
  // User State
  credits: number;              // Current credit balance
  usage: number;                // Total credits used
  name: string | null;          // User's claimed name
  email: string | null;         // User's claimed email
  hasClaimedName: boolean;      // Whether user has claimed a name
  hasClaimedEmail: boolean;     // Whether user has claimed an email
  hasVerifiedEmail: boolean;    // Whether email is verified
  
  // Referral System
  referralCode: string | null;  // User's unique referral code
  getReferralLink: () => string; // Get shareable referral link
  share: (options?) => void;    // Share referral link
  
  // Actions
  completeAction: (action: string, options?) => Promise<boolean>;
  canPerformAction: (action: string) => boolean;
  claimName: (name: string) => Promise<boolean>;
  claimEmail: (email: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  
  // App State
  loading: boolean;             // Initial loading state
  initialized: boolean;         // Whether SDK is initialized
  error: Error | null;          // Any error that occurred
  policy: GrowthKitPolicy;      // App credit policy
  refresh: () => Promise<void>; // Refresh user data
  
  // Localization (when using translation hooks)
  language?: 'en' | 'es';       // Current language
  setLanguage?: (lang: 'en' | 'es') => void; // Change language
  
  // Theming
  setTheme: (theme: 'light' | 'dark' | 'auto') => void; // Change theme
}
```

## Theming Support

The SDK provides comprehensive theming support with light, dark, and auto modes that maintains the GrowthKit + FenixBlack brand identity.

### Supported Themes

- **Light Mode** (`light`): Clean, bright interface
- **Dark Mode** (`dark`): Dark theme with proper contrast
- **Auto Mode** (`auto`): Automatically follows system color scheme preference

### Configuration

Set the theme in your configuration:

```tsx
const config = {
  apiKey: 'your-api-key',
  theme: 'dark',  // Options: 'light' | 'dark' | 'auto'
};
```

### Dynamic Theme Switching

Change themes programmatically using the `setTheme` method:

```tsx
import { useGrowthKit } from '@fenixblack/growthkit';

function ThemeToggle() {
  const { setTheme } = useGrowthKit();
  
  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Theme
    </button>
  );
}
```

### Complete Theme Example

```tsx
import { useState } from 'react';
import { GrowthKitAccountWidget, useGrowthKit } from '@fenixblack/growthkit';

function App() {
  const [currentTheme, setCurrentTheme] = useState('auto');
  
  const config = {
    apiKey: 'your-api-key',
    theme: currentTheme,
  };

  return (
    <GrowthKitAccountWidget config={config}>
      <ThemeControls onThemeChange={setCurrentTheme} />
      <YourApp />
    </GrowthKitAccountWidget>
  );
}

function ThemeControls({ onThemeChange }) {
  const { setTheme } = useGrowthKit();
  
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);        // Update SDK theme
    onThemeChange(newTheme);   // Update app state
  };
  
  return (
    <div>
      <button onClick={() => handleThemeChange('light')}>☀️ Light</button>
      <button onClick={() => handleThemeChange('dark')}>🌙 Dark</button>
      <button onClick={() => handleThemeChange('auto')}>⚡ Auto</button>
    </div>
  );
}
```

### Theme System Exports

For advanced theming needs, the SDK exports utility functions and types:

```tsx
import { 
  getThemeColors, 
  getEffectiveTheme,
  lightTheme,
  darkTheme,
  createThemeVariables,
  onSystemThemeChange 
} from '@fenixblack/growthkit';

// Get current theme colors
const colors = getThemeColors('dark');

// Resolve 'auto' to actual theme
const effectiveTheme = getEffectiveTheme('auto'); // Returns 'light' or 'dark'

// Access color palettes directly
console.log(lightTheme.primary);  // '#10b981'
console.log(darkTheme.background); // '#1e293b'

// Generate CSS custom properties
const cssVars = createThemeVariables('dark');

// Listen to system theme changes
const cleanup = onSystemThemeChange((isDark) => {
  console.log('System theme changed:', isDark ? 'dark' : 'light');
});
```

### Features

- **Brand Consistency**: Maintains GrowthKit + FenixBlack aesthetic in all themes
- **Accessibility**: Proper contrast ratios for all theme variants
- **System Integration**: Auto mode follows OS color scheme preferences
- **Smooth Transitions**: Seamless theme switching without page refresh
- **Component Coverage**: All SDK components support theming
- **TypeScript Support**: Full type safety for theme-related APIs

## Components

### GrowthKitGate
Protect content behind waitlist or paywall:

```tsx
import { GrowthKitGate } from '@fenixblack/growthkit';

<GrowthKitGate config={{ apiKey: 'your-api-key' }}>
  {/* Protected content */}
  <YourApp />
</GrowthKitGate>
```

### GrowthKitAccountWidget
All-in-one account widget with credit display and profile management:

```tsx
import { GrowthKitAccountWidget } from '@fenixblack/growthkit';

<GrowthKitAccountWidget 
  config={{ 
    apiKey: 'your-api-key',
    language: 'es' // Optional: Set language
  }}
  position="top-right"
  showName={true}
  showEmail={true}
  theme="auto"
  ref={widgetRef} // Optional: For programmatic control
>
  <YourApp />
</GrowthKitAccountWidget>
```

Features:
- Displays current credit balance
- Shows user's name and email (when claimed)
- Email verification status badge
- Earn credits modal integration
- Automatic flow management
- Customizable position and theme
- **Full localization support** (English/Spanish)
- **Programmatic language switching** via ref

### WaitlistForm
Customizable waitlist signup:

```tsx
import { WaitlistForm } from '@fenixblack/growthkit';

<WaitlistForm
  growthKit={gk}
  message="Join our exclusive beta"
  onSuccess={(position) => console.log(`Position: ${position}`)}
/>
```

## Server-Side Usage

```ts
import { createGrowthKitServer } from '@fenixblack/growthkit/server';

const gk = createGrowthKitServer();

// Get user data
const user = await gk.getUser('fingerprint-123');

// Track actions
await gk.completeAction('fingerprint-123', 'generate');

// Add to waitlist
await gk.addToWaitlist('user@example.com', 'fingerprint-123');
```

## Architecture Benefits

This SDK follows modern best practices:

1. **Separate Entry Points**: Different builds for different environments (React, Edge Runtime, Node.js)
2. **Tree Shaking**: Import only what you need
3. **Type Safety**: Full TypeScript support with proper types for each environment
4. **Performance**: Optimized bundles for each runtime
5. **Developer Experience**: Clear import paths that indicate where code runs

## License

MIT