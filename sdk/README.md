# @fenixblack/growthkit

React SDK for GrowthKit - Intelligent waitlist and referral management system for client-side applications.

> 📝 **Version History**: See [CHANGELOG.md](./CHANGELOG.md) for updates  
> 🔧 **Advanced Setup**: See [MIDDLEWARE.md](./MIDDLEWARE.md) for Next.js server-side integration

## Table of Contents

- [Quick Start](#-quick-start-10-seconds)
- [Installation](#installation)
- [Complete Widget Example](#-complete-widget-integration-example)
- [Getting Your Public Key](#getting-your-public-key)
- [Configuration Options](#-configuration-options)
- [Components](#components)
  - [GrowthKitAccountWidget](#growthkitaccountwidget)
  - [WaitlistForm](#waitlistform)
  - [GrowthKitGate](#growthkitgate)
- [API Reference](#api-reference)
- [Localization](#localization-support)
- [Theming](#theming-support)
- [Product Waitlists](#product-waitlists)
- [TypeScript](#typescript-support)

## ⚡ Quick Start (10 seconds)

```bash
npm install @fenixblack/growthkit
```

**That's it!** Just use your public key:

```tsx
import { GrowthKitAccountWidget } from '@fenixblack/growthkit';

function App() {
  return (
    <GrowthKitAccountWidget
      config={{ publicKey: 'pk_your_public_key_here' }}
      position="top-right"
    >
      <YourApp />
    </GrowthKitAccountWidget>
  );
}
```

✅ **Works with**: Static sites, SPAs, React, Next.js, Vue, GitHub Pages, Netlify, Vercel  
✅ **No backend required**: Direct secure communication with GrowthKit  
✅ **Safe for client-side**: Public keys are designed to be exposed

## Installation

```bash
npm install @fenixblack/growthkit
# or
yarn add @fenixblack/growthkit
```

## Getting Your Public Key

Before you start, you'll need your public API key:

1. Log into your [GrowthKit Dashboard](https://growth.fenixblack.ai)
2. Select your app (or create a new one)
3. Go to **API Tokens** tab in app settings
4. Copy your **Public Key** (starts with `pk_`)

> **🔒 Security Note**: Public keys are safe to use in client-side code. They're designed to be exposed and automatically handle secure token generation.

## 🎯 Complete Widget Integration Example

Here's a complete, copy-paste ready example showing how to integrate the GrowthKit widget in your app:

### React App (Most Common)

```tsx
import React from 'react';
import { GrowthKitAccountWidget } from '@fenixblack/growthkit';

function App() {
  return (
    <GrowthKitAccountWidget
      config={{
        publicKey: 'pk_your_public_key_here', // Get this from your dashboard
        theme: 'auto',                        // Options: 'light', 'dark', 'auto'
        language: 'en',                       // Options: 'en', 'es'
      }}
      position="top-right"                    // Where to display the widget
      showName={true}                         // Show user's name
      showEmail={true}                        // Show user's email
    >
      {/* Your entire app goes here */}
      <div>
        <h1>Welcome to My App</h1>
        <p>The widget appears in the top-right corner automatically!</p>
        
        {/* Your app content */}
        <YourComponents />
      </div>
    </GrowthKitAccountWidget>
  );
}

export default App;
```

**That's it!** The widget automatically:
- ✅ Displays credit balance in the corner
- ✅ Tracks referrals when users share
- ✅ Manages email verification
- ✅ Handles user profile (name/email)
- ✅ Shows referral link and stats
- ✅ Works with any React app

### Next.js App Router

```tsx
// app/layout.tsx
'use client';

import { GrowthKitAccountWidget } from '@fenixblack/growthkit';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GrowthKitAccountWidget
          config={{
            publicKey: 'pk_your_public_key_here',
            theme: 'auto',
          }}
          position="top-right"
        >
          {children}
        </GrowthKitAccountWidget>
      </body>
    </html>
  );
}
```

### Static HTML / Vanilla JS

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App with GrowthKit</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@fenixblack/growthkit@latest/dist/index.umd.js"></script>
</head>
<body>
  <div id="root">
    <h1>Welcome to My App</h1>
    <p>Your content here...</p>
  </div>

  <script>
    // Initialize GrowthKit widget
    const { GrowthKitAccountWidget } = window.GrowthKit;
    const config = {
      publicKey: 'pk_your_public_key_here',
      theme: 'auto'
    };

    // Wrap your app with the widget
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      React.createElement(GrowthKitAccountWidget, { 
        config, 
        position: 'top-right' 
      }, document.getElementById('root').innerHTML)
    );
  </script>
</body>
</html>
```

### What Users See

Once integrated, your users will see:

1. **Corner Widget**: Minimalist credit counter (e.g., "⭐ 10 credits")
2. **On Hover**: Expands to show:
   - Full credit balance
   - User's name and email (if claimed)
   - Referral stats
   - Share button
3. **Interactive Modals**:
   - Name claiming flow
   - Email verification
   - Referral sharing interface
   - Credit earning opportunities

### Advanced: Accessing the Hook Directly

If you need more control, use the hook directly:

```tsx
import { useGrowthKit, GrowthKitProvider } from '@fenixblack/growthkit';

function MyComponent() {
  const gk = useGrowthKit();

  return (
    <div>
      <h1>Credits: {gk.credits}</h1>
      <button onClick={() => gk.share()}>Share & Earn</button>
      <p>Your link: {gk.getReferralLink()}</p>
      
      {/* Track custom actions */}
      <button 
        onClick={() => gk.completeAction('custom_action')}
        disabled={!gk.canPerformAction('custom_action')}
      >
        Do Something (costs credits)
      </button>
    </div>
  );
}

function App() {
  return (
    <GrowthKitProvider config={{ publicKey: 'pk_your_key_here' }}>
      <MyComponent />
    </GrowthKitProvider>
  );
}
```

---

## 🌍 More Integration Examples

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

## 🔧 Configuration Options

Configure the widget with your public key and optional settings:

```tsx
const config = {
  publicKey: 'pk_your_key_here', // Required: Get from dashboard → API Tokens
  theme: 'auto',                 // Optional: 'light' | 'dark' | 'auto' (default: 'auto')
  language: 'en',                // Optional: 'en' | 'es' (default: 'en')
  debug: false,                  // Optional: Enable debug logging (default: false)
};
```

**All options:**
- ✅ **publicKey** (required): Your app's public API key
- ✅ **theme**: Visual theme for the widget
- ✅ **language**: Interface language
- ✅ **debug**: Show detailed logs in console

> **🔧 Advanced**: For server-side middleware integration in Next.js apps, see [MIDDLEWARE.md](./MIDDLEWARE.md)

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

## API Reference

### useGrowthKit Hook

The `useGrowthKit` hook provides access to all GrowthKit functionality:

```typescript
const gk = useGrowthKit();

// User State
gk.credits: number              // Current credit balance
gk.usage: number                // Total credits used
gk.name: string | null          // User's claimed name
gk.email: string | null         // User's claimed email
gk.hasClaimedName: boolean      // Whether user has claimed a name
gk.hasClaimedEmail: boolean     // Whether user has claimed an email
gk.hasVerifiedEmail: boolean    // Whether email is verified

// Referral System
gk.referralCode: string | null  // User's unique referral code
gk.getReferralLink(): string    // Get shareable referral link
gk.share(options?): void        // Share referral link (opens native share or copies)

// Actions
gk.completeAction(action: string, options?): Promise<boolean>
gk.canPerformAction(action: string): boolean
gk.claimName(name: string): Promise<boolean>
gk.claimEmail(email: string): Promise<boolean>
gk.verifyEmail(token: string): Promise<boolean>

// App State
gk.loading: boolean             // Initial loading state
gk.initialized: boolean         // Whether SDK is initialized
gk.app?: AppBranding            // App branding information
gk.error: Error | null          // Any error that occurred
gk.policy: GrowthKitPolicy      // App credit policy
gk.refresh(): Promise<void>     // Refresh user data

// Customization
gk.language: 'en' | 'es'        // Current language
gk.setLanguage(lang): void      // Change language
gk.setTheme(theme): void        // Change theme ('light' | 'dark' | 'auto')
```

**Example Usage:**

```tsx
function MyComponent() {
  const gk = useGrowthKit();

  return (
    <div>
      <h1>You have {gk.credits} credits</h1>
      
      <button 
        onClick={() => gk.completeAction('generate')}
        disabled={!gk.canPerformAction('generate')}
      >
        Generate Image (1 credit)
      </button>
      
      <button onClick={() => gk.share()}>
        Share & Earn 5 Credits
      </button>
      
      <p>Your link: {gk.getReferralLink()}</p>
    </div>
  );
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

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```tsx
import type { 
  GrowthKitConfig,
  GrowthKitHook,
  Language, 
  Translations, 
  GrowthKitTheme,
  ThemeColors,
  GrowthKitAccountWidgetRef,
  AppBranding,
  WaitlistFormProps
} from '@fenixblack/growthkit';
```

All components, hooks, and utilities are fully typed for the best developer experience.

## License

MIT