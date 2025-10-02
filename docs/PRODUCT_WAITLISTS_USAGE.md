# Product Waitlists - Usage Guide

## Overview

Product Waitlists allow you to embed lightweight waitlist forms anywhere in your app for specific products, features, or tiers. Unlike the app-level waitlist (which takes over the full page), product waitlists are embeddable widgets that fit naturally into your existing UI.

## Quick Start

### 1. Create a Product Waitlist (Admin)

1. Go to your app in the admin dashboard
2. Navigate to **Waitlist** → **Product Waitlists** tab
3. Click **"New Product Waitlist"**
4. Fill in:
   - **Name:** "Premium Plan"
   - **Tag:** Auto-generated as `premium-plan` (editable)
   - **Description:** "Get early access to premium features"
   - **Success Message:** "Thanks! We'll notify you when Premium is ready."
5. Click **"Create Product Waitlist"**
6. Copy the implementation code shown

### 2. Implement in Your React App

```tsx
import { WaitlistForm } from '@fenixblack/growthkit';

// Inline mode (embeds directly in page)
<WaitlistForm 
  productTag="premium-plan"
  mode="inline"
  variant="standard"
/>

// Compact mode (minimal, ~100px height)
<WaitlistForm 
  productTag="premium-plan"
  mode="inline"
  variant="compact"
/>

// Modal mode (triggered by button)
<WaitlistForm 
  productTag="premium-plan"
  mode="modal"
  trigger={<button>Join Premium Waitlist</button>}
/>

// Drawer mode (slides from side)
<WaitlistForm 
  productTag="premium-plan"
  mode="drawer"
  drawerPosition="right"
  trigger={<button>Request Access</button>}
/>
```

## Modes

### Inline Mode
- Renders directly in the DOM where placed
- Flows naturally with your page content
- No overlay or backdrop
- **Use for:** Landing pages, pricing tiers, feature sections

### Modal Mode
- Triggered by a custom element
- Centered overlay with backdrop
- Dismissible (ESC key, click outside)
- **Use for:** CTAs, navigation links, feature cards

### Drawer Mode
- Slides in from left or right
- Less intrusive than modal
- Can stay open while browsing
- **Use for:** Sticky widgets, side panels

## Variants

### Standard Variant
- Full form with logo, name, description
- Email input + submit button
- Success message and feedback
- **Height:** ~250-300px
- **Best for:** Feature pages, dedicated sections

### Compact Variant
- Minimal: just email + button in one row
- Small helper text
- **Height:** ~80-100px
- **Best for:** Tight spaces, pricing cards, sidebars

## Props Reference

```typescript
interface WaitlistFormProps {
  // Product waitlist props
  productTag?: string;           // Product identifier (e.g., "premium-plan")
  mode?: 'inline' | 'modal' | 'drawer';  // Display mode
  variant?: 'compact' | 'standard';      // Size variant
  trigger?: React.ReactNode;     // Custom trigger element (for modal/drawer)
  drawerPosition?: 'left' | 'right';    // Drawer slide direction
  
  // Callbacks
  onSuccess?: (position: number) => void;  // Called after successful join
  
  // Styling
  className?: string;            // Custom CSS classes
  style?: React.CSSProperties;   // Inline styles
  
  // App-level waitlist (backward compatible)
  message?: string;              // Custom message (app-level only)
}
```

## Hook API

```tsx
import { useGrowthKit } from '@fenixblack/growthkit';

function MyComponent() {
  const { 
    joinProductWaitlist,
    getProductWaitlistStatus,
    waitlist,
  } = useGrowthKit();

  // Check if user is on a product waitlist
  const premiumStatus = getProductWaitlistStatus('premium-plan');
  console.log(premiumStatus);
  // => { isOnList: true, status: 'WAITING' }

  // Join a product waitlist programmatically
  const handleJoin = async () => {
    const success = await joinProductWaitlist('premium-plan', 'user@example.com');
    if (success) {
      console.log('Joined successfully!');
    }
  };

  // Access all product waitlist statuses
  const products = waitlist?.products || {};
  // => { 
  //   "premium-plan": { isOnList: true, status: "WAITING", joinedAt: "..." },
  //   "mobile-app": { isOnList: true, status: "INVITED", joinedAt: "..." }
  // }

  return <div>...</div>;
}
```

## Examples

### Pricing Page

```tsx
<div className="pricing-grid">
  <PricingTier name="Free" price="$0" />
  <PricingTier name="Pro" price="$29" />
  
  <div className="pricing-card">
    <h3>Premium</h3>
    <p className="badge">Coming Soon</p>
    
    {/* Embedded product waitlist */}
    <WaitlistForm 
      productTag="premium"
      mode="inline"
      variant="compact"
    />
  </div>
</div>
```

### Feature Page

```tsx
<div className="feature-section">
  <h2>AI-Powered Analytics</h2>
  <p>Our new AI analytics engine is currently in beta...</p>
  
  <WaitlistForm 
    productTag="ai-analytics"
    mode="modal"
    variant="standard"
    trigger={
      <button className="cta-button">
        Request Beta Access
      </button>
    }
    onSuccess={() => {
      toast.success('Added to waitlist!');
    }}
  />
</div>
```

### Sidebar Widget

```tsx
<aside className="sidebar">
  <h4>Mobile App Coming Soon</h4>
  <p>Be first to try our mobile app</p>
  
  <WaitlistForm 
    productTag="mobile-app"
    mode="inline"
    variant="compact"
  />
</aside>
```

## Branding

Products automatically inherit your app's branding (colors, logo) but can override individually:

**In Admin:**
1. Edit product
2. Scroll to "Branding Overrides"
3. Set custom logo URL or primary color
4. Leave empty to inherit from app

**Result:** Each product can have unique branding while maintaining consistency.

## Auto-Invites (Optional)

Enable automatic invitations for products:

1. Edit product in admin
2. Check "Enable Auto-Invites"
3. Set daily quota (e.g., 5 per day)
4. Set send time (e.g., 10:00 AM)
5. Select email template (create in Email Templates tab)
6. Save

The system will automatically invite users from the product waitlist based on your schedule.

## Analytics

View product-specific analytics in admin:

1. Go to Product Waitlists tab
2. Click "Manage" on any product
3. Switch to "Analytics" view

**Metrics Available:**
- Total signups
- Status breakdown (Waiting/Invited/Accepted)
- Signups over time (last 30 days)
- Conversion rate (invited → accepted)
- Export to CSV

## Best Practices

### 1. Keep It Simple
- Use compact variant for minimal friction
- Don't ask for too much information (just email for Phase 1)
- Clear, concise descriptions

### 2. Strategic Placement
- Inline mode: Feature pages, pricing tiers
- Modal mode: Navigation CTAs, hero sections
- Drawer mode: Sticky widgets, persistent access

### 3. Consistent Messaging
- Align success messages with product value
- Set expectations ("We'll notify you when ready")
- No spam promises

### 4. Monitor Interest
- Check analytics regularly
- Popular products = high demand
- Use insights for product roadmap decisions

## Troubleshooting

### Widget not showing?
- Verify product is "enabled" in admin
- Check browser console for errors
- Ensure public key is configured correctly
- Verify product tag matches exactly

### Form submission fails?
- Check network tab for API errors
- Verify CORS origins are configured
- Ensure email format is valid
- Check product exists and is enabled

### Styling issues?
- Widget inherits branding from app settings
- Override with `className` or `style` props
- Check color format (must be valid hex)

## Support

- Validation script: `node scripts/check-product-waitlists.js`
- View implementation plan: `PRODUCT_WAITLISTS.md`
- View summary: `PRODUCT_WAITLISTS_IMPLEMENTATION_SUMMARY.md`

