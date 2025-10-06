# @fenixblack/growthkit

React SDK for GrowthKit - Intelligent waitlist and referral management system with client-side and middleware support.

## ✨ What's New in v0.6.5

**🐛 Fixed Widget Language Integration** - Widget language now properly syncs:
- **Dynamic Language Support**: Widget language correctly reflects parent app configuration
- **Accurate Tracking**: Distinguishes between auto-detected and user-selected languages
- **Better Analytics**: `languageSource` now accurately identifies user language choices
- **Seamless Updates**: Language changes propagate correctly to backend

**Key Improvements:**
- ✅ **Correct Detection**: Auto-detected languages marked as `'browser_detected'`
- ✅ **User Choice Tracking**: Explicit language switches marked as `'user_selected'`
- ✅ **Data Quality**: More accurate language preference data for personalization
- ✅ **API Integration**: Widget language parameter properly passed to all API calls

---

**v0.6.3 - Browser Language Detection**

**🌍 Browser Language Detection** - Automatic localization foundation:
- **Smart Detection**: Automatically detects user's browser language (`navigator.language`)
- **Seamless Integration**: Language data flows through existing API infrastructure
- **Backwards Compatible**: Zero breaking changes, works with all SDK versions
- **Localization Ready**: Foundation for comprehensive multi-language support

---

**v0.6.2 - Product Waitlists & Embedded Widgets**

**🎯 Product-Specific Waitlists** - Create multiple waitlists per app:
- **Tag-Based System**: Separate waitlists for different products, features, or tiers
- **Multi-Product Support**: Same email can join multiple product waitlists
- **Per-Product Analytics**: Track signups and conversions by product
- **Custom Fields**: Collect product-specific data from users
- **Independent Schedules**: Auto-invite timing per product

**📍 Embedded Waitlist Widgets** - Auto-inject waitlist forms anywhere:
- **Auto-Injection**: Automatically inject forms using CSS selectors
- **Manual Placement**: Place widgets exactly where you need them
- **Inline Display**: Seamlessly integrate into existing pages
- **Smart Detection**: Avoids duplicate injections

```tsx
// Auto-inject into any element
<AutoWaitlistInjector />

// Or place manually
<EmbedWaitlistWidget variant="standard" />
```

[See Product Waitlists Documentation →](#product-waitlists)

---

**v0.6.1 - Branded Waitlist Screens**
- **App Logo Support**: Upload your logo or use a URL (PNG/JPG/WebP)
- **Custom Branding**: Your app name, description, and brand color automatically applied
- **3 Modern Layouts**: Centered, Split, or Minimal - choose what fits your app
- **Smart Fallbacks**: Works beautifully even without customization
- **Zero Config**: Configure once in admin, works everywhere automatically

[See Waitlist Branding Documentation →](#waitlistform)

## ⚡ Quick Start (10 seconds)

### Option 1: Client-Side Only (Recommended for most apps)
```bash
npm install @fenixblack/growthkit
```

**That's it!** Just use your public key:

```tsx
import { useGrowthKit } from '@fenixblack/growthkit';

function App() {
  const gk = useGrowthKit({
    publicKey: 'pk_your_public_key_here' // Get this from your dashboard
  });
  
  return <div>Credits: {gk.credits}</div>;
}
```

✅ **Works with**: Static sites, SPAs, GitHub Pages, Netlify, Vercel, CodePen  
✅ **No backend required**: Direct secure communication with GrowthKit  
✅ **Safe for client-side**: Public keys are designed to be exposed  

### Option 2: Next.js with Middleware (Advanced)
```bash
npx @fenixblack/growthkit setup
```
**For full-stack Next.js apps that need:**
- Server-side API key security
- Custom referral link routing  
- Advanced middleware features

**That's it!** The CLI will automatically:
- Detect your Next.js project
- Create `middleware.ts` with auto-middleware
- Set up environment variables
- Provide next steps

## Installation

```bash
npm install @fenixblack/growthkit
# or
yarn add @fenixblack/growthkit
```

## 🌍 Integration Examples

### React SPA (Create React App, Vite, etc.)
```tsx
import { useGrowthKit, GrowthKitProvider } from '@fenixblack/growthkit';

function App() {
  return (
    <GrowthKitProvider config={{ publicKey: 'pk_your_key_here' }}>
      <MyApp />
    </GrowthKitProvider>
  );
}

function MyApp() {
  const { track, credits, share } = useGrowthKit();
  
  return (
    <div>
      <h1>Credits: {credits}</h1>
      <button onClick={() => track('feature_used')}>Use Feature</button>
      <button onClick={() => share()}>Share & Earn</button>
    </div>
  );
}
```

### Static Sites (Vanilla JavaScript)
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/@fenixblack/growthkit@latest/dist/index.js"></script>
</head>
<body>
    <div id="credits">Loading...</div>
    <button onclick="useFeature()">Use Feature</button>

    <script>
        const gk = new GrowthKit({
            publicKey: 'pk_your_key_here'
        });

        gk.initialize().then(() => {
            document.getElementById('credits').textContent = `Credits: ${gk.credits}`;
        });

        function useFeature() {
            gk.track('feature_used');
        }
    </script>
</body>
</html>
```

### Next.js App Router (Client Components)
```tsx
'use client';

import { useGrowthKit } from '@fenixblack/growthkit';

export default function ClientWidget() {
  const gk = useGrowthKit({
    publicKey: 'pk_your_key_here'
  });
  
  return (
    <div className="p-4 border rounded">
      <h3>Credits: {gk.credits}</h3>
      <button onClick={() => gk.track('action')}>
        Track Action
      </button>
    </div>
  );
}
```

### Getting Your Public Key

1. Go to your GrowthKit admin dashboard
2. Navigate to **API Tokens** tab in your app settings
3. Copy your **Public Key** (starts with `pk_`)

> **🔒 Security**: Public keys are safe to use in client-side code. They generate time-limited tokens that are scoped to individual users.

## Import Paths

The SDK provides four separate entry points optimized for different environments:

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
  GrowthKitAccountWidgetRef,
  AppBranding,        // v0.6.1+
  WaitlistFormProps   // v0.6.1+
} from '@fenixblack/growthkit';
```

### Middleware (Edge Runtime Compatible)
```ts
// Zero-config middleware (recommended)
export { middleware, config } from '@fenixblack/growthkit/auto-middleware';

// Or advanced configuration
import { createGrowthKitMiddleware } from '@fenixblack/growthkit/middleware';
```

### Auto-Middleware (Zero Config)
```ts
// For instant setup with zero configuration
export { middleware, config } from '@fenixblack/growthkit/auto-middleware';
```

### Server Utilities (Node.js)
```ts
// For server-side utilities (Node.js)
import { GrowthKitServer, createGrowthKitServer } from '@fenixblack/growthkit/server';
```

## CLI Setup Tool

GrowthKit provides an interactive CLI for zero-effort setup:

```bash
# Interactive setup wizard
npx @fenixblack/growthkit setup

# Show help
npx @fenixblack/growthkit help
```

### What the CLI does:
✅ **Project Detection**: Automatically detects Next.js projects  
✅ **File Generation**: Creates `middleware.ts` with auto-middleware  
✅ **Environment Setup**: Configures `.env.local` with your API credentials  
✅ **Dependency Check**: Verifies GrowthKit is installed  
✅ **Next Steps**: Provides clear instructions for integration  

### Requirements:
- Next.js project (creates middleware for referral handling)
- GrowthKit API key (get from your dashboard)

## Manual Setup (3 Steps)

### 1. Add Middleware (handles referral links & email verification)

**Automated**: Run `npx @fenixblack/growthkit setup` (recommended)

**Manual**: Create `middleware.ts` in your Next.js root:

```ts
// middleware.ts - Zero configuration required! 🚀
export { middleware, config } from '@fenixblack/growthkit/auto-middleware';
```

**That's it!** The auto-middleware automatically handles:
- **Referral links**: `/r/ABC123` → exchanges code for claim token → redirects to `/?ref=token`
- **Email verification**: `/verify?token=xyz` → verifies email → redirects to `/?verified=true`  
- **Invitation codes**: `/invite/INV-XXXXXX` → redirects with code → grants invitation credits
- **API Proxying**: `/api/growthkit/*` → securely proxies widget API calls with server-side credentials
- **Smart defaults**: All routes, debug mode, and configuration handled automatically

### 2. Set Environment Variables

```env
# .env.local - Server-side only (secure)
GROWTHKIT_API_KEY=gk_your_api_key_here
GROWTHKIT_API_URL=https://growth.fenixblack.ai/api
```

> 💡 **Developer Experience**: Setup time reduced from 15-30 minutes to 30 seconds with auto-middleware!

**🔒 Security Note**: The API key is server-side only and never exposed to the client. The middleware handles all API proxying automatically.

### Advanced Middleware Configuration (Optional)

If you need custom paths or settings, use the advanced configuration:

```ts
// middleware.ts - Custom configuration
import { createGrowthKitMiddleware } from '@fenixblack/growthkit/middleware';

export const middleware = createGrowthKitMiddleware({
  apiKey: process.env.GROWTHKIT_API_KEY!,
  apiUrl: process.env.GROWTHKIT_API_URL!,
  referralPath: '/r',     // Custom referral path
  redirectTo: '/home',    // Custom redirect destination
  debug: true,            // Force debug mode
});

export const config = {
  matcher: ['/r/:code*', '/verify', '/invite/:code*', '/api/growthkit/:path*']
};
```

## Migration from v1.x (Legacy Direct Mode)

If you're upgrading from a previous version that used `NEXT_PUBLIC_GROWTHKIT_API_KEY`:

### 1. Simplify your middleware (recommended):
```tsx
// Replace your entire middleware.ts with this one line:
export { middleware, config } from '@fenixblack/growthkit/auto-middleware';
```

Or manually update your middleware matcher to include API proxying:
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

### 3. Use the Hook

```tsx
import { useGrowthKit } from '@fenixblack/growthkit';

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
    publicKey: 'pk_your_key_here', // Get from dashboard → API Tokens
    debug: true,                   // Optional: Enable debug mode
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
  publicKey: 'pk_your_key_here', // Use public key for client-side
  language: 'es',                // Set Spanish as default
  theme: 'dark',                 // Set dark theme (options: 'light' | 'dark' | 'auto')
};

// Or for middleware mode:
const middlewareConfig = {
  // No keys needed - handled by middleware
  language: 'es',
  theme: 'dark',
};
```

### Basic Usage

```tsx
import { useGrowthKit, GrowthKitAccountWidget } from '@fenixblack/growthkit';

function App() {
  const config = {
    publicKey: 'pk_your_key_here', // Public key for client-side
    language: 'es',                // Spanish by default
    theme: 'auto',                 // Auto-detect system theme preference
  };

  return (
    <GrowthKitAccountWidget config={config}>
      <YourApp />
    </GrowthKitAccountWidget>
  );
}
```

## 🔧 Configuration Modes

GrowthKit supports three integration modes to fit different application architectures:

### 1. Public Key Mode (Recommended)
**Best for**: Static sites, SPAs, client-side apps, prototypes

```tsx
const config = {
  publicKey: 'pk_your_key_here', // Get from dashboard → API Tokens
  debug: true,                   // Optional: Enable debug mode
  language: 'en',                // Optional: Set language
  theme: 'auto',                 // Optional: Set theme
};
```

**Features:**
- ✅ No backend required
- ✅ Secure token-based authentication
- ✅ Works everywhere JavaScript runs
- ✅ Perfect for static site generators

### 2. Proxy Mode (Middleware)
**Best for**: Next.js full-stack apps with custom routing needs

```tsx
const config = {
  // No keys needed - middleware handles everything
  debug: process.env.NODE_ENV === 'development',
  language: 'en',
  theme: 'auto',
};
```

**Setup**: Run `npx @fenixblack/growthkit setup`

**Features:**
- ✅ Maximum security (API key server-side only)
- ✅ Custom referral link routing
- ✅ Advanced middleware features
- ✅ Zero client-side configuration

### 3. Direct API Mode (Legacy)
**Best for**: Advanced use cases with custom security requirements

```tsx
const config = {
  apiKey: 'gk_your_private_key', // Private API key
  apiUrl: 'https://growth.fenixblack.ai/api',
  debug: true,
};
```

**⚠️ Warning**: Private API keys should not be exposed in client-side code in production.

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
  app?: AppBranding;            // App branding information (v0.6.1+)
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

<GrowthKitGate config={{ publicKey: 'pk_your_key_here' }}>
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
    publicKey: 'pk_your_key_here',
    language: 'es' // Optional: Set language
  }}
  position="top-right"
  showName={true}
  showEmail={true}
  theme="auto"
  slim={false}          // Optional: Enable ultra-minimal mode
  slim_labels={true}    // Optional: Show labels in slim mode
  ref={widgetRef}       // Optional: For programmatic control
>
  <YourApp />
</GrowthKitAccountWidget>
```

Features:
- Displays current credit balance
- Shows user's name and email (when claimed)
- **Slim mode**: Ultra-minimal display with `slim={true}`
  - `slim_labels={true}` (default): Shows "X credits, Name"
  - `slim_labels={false}`: Shows minimal "X" format only
- Smart positioning to prevent off-screen menus
- Always expands on hover for full details
- Email verification status badge
- Earn credits modal integration
- Automatic flow management
- Customizable position and theme
- **Full localization support** (English/Spanish)
- **Programmatic language switching** via ref

### WaitlistForm
Modern, brandable waitlist screen with three layout options and full app branding support.

#### Basic Usage

```tsx
import { WaitlistForm } from '@fenixblack/growthkit';

<WaitlistForm
  message="Join our exclusive beta"
  onSuccess={(position) => console.log(`Position: ${position}`)}
/>
```

#### App Branding (v0.6.1+)

The waitlist screen automatically displays your app's branding when configured in the GrowthKit admin:

**Configurable in Admin Dashboard:**
- **App Logo**: PNG/JPG/WebP (upload or URL)
- **App Description**: Shown prominently below app name
- **Brand Color**: Applied to buttons, accents, and messages
- **Custom Message**: Highlighted in your brand color
- **Layout Style**: Choose from 3 modern designs

**The SDK automatically receives and displays:**

```tsx
// No additional code needed! The SDK receives app branding from the API
const gk = useGrowthKit({ publicKey: 'pk_your_key' });

// App branding is automatically available in gk.app
{
  name: "MyApp",
  description: "Build things faster",
  logoUrl: "https://...",
  primaryColor: "#6366f1",
  waitlistLayout: "centered" // or "split" or "minimal"
}
```

#### Layout Options

**Centered Layout (Default)**
- Full-screen centered card with glassmorphic design
- App logo prominently displayed at top
- App name and description
- Custom waitlist message in brand color
- Modern gradient background with animations
- Perfect for: Dedicated waitlist pages

**Split Layout**
- Left side: Large app branding and messaging
- Right side: Clean signup form
- Best for: Marketing pages, landing pages
- Professional layout for product launches

**Minimal Layout**
- Clean, simple design
- Small logo and minimal text
- Perfect for: Embedded forms, subtle integrations
- Great for: Apps that need waitlist without fanfare

#### Advanced Customization

```tsx
<WaitlistForm
  message="Custom override message"
  onSuccess={(position) => {
    console.log(`You're #${position} on the waitlist!`);
    // Track conversion, show celebration, etc.
  }}
  className="custom-class"
  style={{ /* custom styles */ }}
/>
```

#### Branding Features

**Automatic Display:**
- ✅ App logo (or initials fallback if no logo)
- ✅ App name with gradient styling
- ✅ App description
- ✅ Custom waitlist message in brand color
- ✅ Brand color applied to:
  - CTA buttons with gradient effects
  - Focus states and interactions
  - Logo shadows and accents
  - Position counter
- ✅ "Powered by GrowthKit" footer (configurable)

**Smart Fallbacks:**
- No logo? Shows initials from app name
- No color? Uses GrowthKit default green
- No description? Shows generic message
- Works beautifully with or without customization

#### Success State

When user joins the waitlist, shows:
- ✨ Celebration animation
- Position counter with brand-colored gradient
- Confirmation message
- Email notification promise

```tsx
// Success state is handled automatically
// But you can hook into it:
<WaitlistForm
  onSuccess={(position) => {
    // Track analytics
    analytics.track('waitlist_joined', { position });
    
    // Show custom celebration
    showConfetti();
    
    // Update UI
    setUserOnWaitlist(true);
  }}
/>
```

#### TypeScript Support

```tsx
import { WaitlistFormProps, AppBranding } from '@fenixblack/growthkit';

// Full type safety
const props: WaitlistFormProps = {
  message: "Join our beta",
  onSuccess: (position: number) => console.log(position),
};

// Access app branding type
const branding: AppBranding = {
  name: "MyApp",
  description: "Build faster",
  logoUrl: "https://...",
  primaryColor: "#6366f1",
  waitlistLayout: "centered",
  hideGrowthKitBranding: false,
};
```

## Product Waitlists

GrowthKit supports multiple waitlists per app using a tag-based system. This allows you to create separate waitlists for different products, features, pricing tiers, or launch phases.

### When to Use Product Waitlists

**Product Waitlists are ideal for:**
- SaaS pricing tiers (e.g., "premium-plan", "enterprise-tier")
- Beta features (e.g., "mobile-app", "ai-assistant")
- Product launches (e.g., "ios-version", "android-version")
- Geographic rollouts (e.g., "eu-launch", "asia-launch")

**App-Level Waitlist is better for:**
- Single product with one waitlist
- Position tracking and competitive placement
- Credit-based early access
- Simple signup flows

### Key Differences

| Feature | App Waitlist | Product Waitlists |
|---------|-------------|------------------|
| Number of Lists | Single | Multiple per app |
| Position Tracking | ✅ Yes | ❌ No |
| Credit Rewards | ✅ Yes | ❌ No |
| Same Email | Once only | Multiple products |
| Analytics | App-level | Per-product |
| Auto-Invites | Single schedule | Per-product schedule |
| Custom Fields | Basic | Product-specific |

### Creating Product Waitlists

Product waitlists are configured in the GrowthKit admin dashboard:

1. Navigate to **Product Waitlists** tab
2. Click **Create Product Waitlist**
3. Configure:
   - **Product Tag**: Unique identifier (e.g., "premium-plan")
   - **Display Name**: Human-readable name
   - **Description**: Product details
   - **Auto-Invite Schedule**: Optional automated invitations
   - **Custom Fields**: Additional data to collect

### SDK Integration

The SDK automatically detects product waitlists and provides seamless integration:

```tsx
import { useGrowthKit } from '@fenixblack/growthkit';

function ProductSignup() {
  const { app } = useGrowthKit();
  
  // Access product waitlist configuration from app metadata
  const productWaitlists = app?.metadata?.productWaitlists || [];
  
  return (
    <div>
      {productWaitlists.map((product: any) => (
        <ProductWaitlistForm
          key={product.tag}
          productTag={product.tag}
          productName={product.name}
          description={product.description}
        />
      ))}
    </div>
  );
}
```

### Joining Product Waitlists

Users can join product waitlists through API calls:

```tsx
import { useGrowthKit } from '@fenixblack/growthkit';

function PremiumSignup() {
  const gk = useGrowthKit();
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    try {
      // Join the premium-plan waitlist
      const response = await fetch('/api/growthkit/waitlist/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          productTag: 'premium-plan',
          customFields: {
            companySize: '50-100',
            industry: 'SaaS'
          }
        })
      });
      
      if (response.ok) {
        setJoined(true);
      }
    } catch (error) {
      console.error('Failed to join waitlist:', error);
    }
  };

  if (joined) {
    return (
      <div className="success">
        <h3>✨ You're in!</h3>
        <p>We'll notify you when Premium is available.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Join Premium Waitlist</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
      />
      <button onClick={handleJoin}>
        Join Waitlist
      </button>
    </div>
  );
}
```

### Multi-Product Support

A single email can join multiple product waitlists:

```tsx
function MultiProductSignup() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const joinMultipleWaitlists = async (email: string) => {
    // User can join multiple product waitlists
    const promises = selectedProducts.map(productTag =>
      fetch('/api/growthkit/waitlist/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productTag })
      })
    );
    
    await Promise.all(promises);
  };

  return (
    <div>
      <h2>Which products interest you?</h2>
      <label>
        <input
          type="checkbox"
          value="premium-plan"
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedProducts([...selectedProducts, 'premium-plan']);
            } else {
              setSelectedProducts(selectedProducts.filter(p => p !== 'premium-plan'));
            }
          }}
        />
        Premium Plan
      </label>
      <label>
        <input
          type="checkbox"
          value="mobile-app"
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedProducts([...selectedProducts, 'mobile-app']);
            } else {
              setSelectedProducts(selectedProducts.filter(p => p !== 'mobile-app'));
            }
          }}
        />
        Mobile App
      </label>
      {/* Join button */}
    </div>
  );
}
```

## Embedded Waitlist Widgets

GrowthKit supports embedded waitlist widgets that can be placed anywhere on your page using auto-injection or manual placement.

### Auto-Injection

Automatically inject the waitlist widget into any element using CSS selectors:

```tsx
import { GrowthKitProvider, AutoWaitlistInjector } from '@fenixblack/growthkit';

function App() {
  return (
    <GrowthKitProvider config={{ publicKey: 'pk_your_key' }}>
      {/* Auto-injector watches for configured selector */}
      <AutoWaitlistInjector />
      
      {/* Your page content */}
      <div className="hero">
        <h1>Welcome to Our App</h1>
        {/* Widget will auto-inject here if configured */}
        <div id="waitlist-placeholder"></div>
      </div>
    </GrowthKitProvider>
  );
}
```

**Configuration in Admin Dashboard:**
1. Set `waitlistLayout` to `"embed"`
2. Add `metadata.waitlistTargetSelector` to specify CSS selector (e.g., `"#waitlist-placeholder"`)
3. Widget automatically injects when:
   - Waitlist is enabled
   - User is not already accepted/invited
   - Target element is found in DOM

### Manual Placement

Place the embedded widget exactly where you need it:

```tsx
import { EmbedWaitlistWidget, GrowthKitProvider } from '@fenixblack/growthkit';

function LandingPage() {
  return (
    <GrowthKitProvider config={{ publicKey: 'pk_your_key' }}>
      <div className="hero">
        <h1>Join Our Beta</h1>
        <p>Get early access to amazing features</p>
        
        {/* Manual widget placement */}
        <EmbedWaitlistWidget 
          variant="standard"
          onSuccess={(position) => {
            console.log(`User joined at position ${position}`);
          }}
        />
      </div>
    </GrowthKitProvider>
  );
}
```

### Widget Variants

The `EmbedWaitlistWidget` supports different display variants:

```tsx
// Standard variant - Full form with branding
<EmbedWaitlistWidget variant="standard" />

// Compact variant - Minimal inline form
<EmbedWaitlistWidget variant="compact" />

// Custom styling
<EmbedWaitlistWidget 
  variant="standard"
  className="custom-waitlist"
  style={{ maxWidth: '400px', margin: '0 auto' }}
/>
```

### Embed Widget Features

- **Inline Display**: Seamlessly integrates into existing page layouts
- **Responsive Design**: Adapts to container width
- **Position Tracking**: Shows waitlist position after signup
- **Credit Rewards**: Maintains credit system from app-level waitlist
- **Brand Styling**: Uses configured app branding
- **Smart Cleanup**: Automatically unmounts when component is removed
- **Duplicate Prevention**: Avoids multiple injections

### Best Practices

**Use Auto-Injection when:**
- Content is dynamically loaded
- You want zero-code integration
- Widget placement varies by page/route
- Working with template-based systems

**Use Manual Placement when:**
- You need precise control over positioning
- Building custom layouts
- Want to wrap widget in custom containers
- Need to pass callbacks or handle events

### Example: Marketing Landing Page

```tsx
import { GrowthKitProvider, EmbedWaitlistWidget } from '@fenixblack/growthkit';

function MarketingLandingPage() {
  const [signupCount, setSignupCount] = useState(0);

  return (
    <GrowthKitProvider config={{ publicKey: 'pk_your_key' }}>
      <div className="landing-page">
        {/* Hero Section */}
        <section className="hero">
          <h1>Revolutionary SaaS Platform</h1>
          <p>Join {signupCount}+ others on the waitlist</p>
        </section>

        {/* Features */}
        <section className="features">
          {/* Feature content */}
        </section>

        {/* Embedded Waitlist */}
        <section className="signup">
          <h2>Get Early Access</h2>
          <EmbedWaitlistWidget
            variant="standard"
            onSuccess={(position) => {
              setSignupCount(position);
              // Track conversion
              analytics.track('waitlist_joined', { position });
            }}
          />
        </section>

        {/* Footer */}
        <footer>
          {/* Footer content */}
        </footer>
      </div>
    </GrowthKitProvider>
  );
}
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