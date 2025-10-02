# Simple Embed Mode - Quick Guide

## The Simple Approach (What You Originally Needed)

If you just want to embed the app-level waitlist on a landing page, use this simple approach:

### Usage

```tsx
import { WaitlistForm } from '@fenixblack/growthkit';

// Simple embedded waitlist - shows position, gives credits
<WaitlistForm layout="embed" variant="compact" />

// Or standard (larger card)
<WaitlistForm layout="embed" variant="standard" />
```

### What It Does

- ✅ Embeds app-level waitlist as a widget
- ✅ Shows waitlist position (#42)
- ✅ Gives credits for joining
- ✅ Uses existing waitlist data (no separate product)
- ✅ Works with existing admin/analytics
- ✅ Can be placed anywhere in your page

### Comparison

| Feature | Embed Mode | Product Waitlist |
|---------|------------|------------------|
| **Use Case** | Single landing page embed | Multiple products/features |
| **Data Model** | App-level waitlist | Separate per product |
| **Position Shown** | ✅ Yes (#42) | ❌ No (just "you're in") |
| **Credits Given** | ✅ Yes | ❌ No |
| **Admin Setup** | None (uses existing) | Create products in admin |
| **Analytics** | Existing waitlist dashboard | Per-product analytics |
| **Best For** | Simple landing pages | SaaS with multiple tiers |

### Example: Landing Page

```tsx
function LandingPage() {
  return (
    <div className="landing">
      <header>
        <h1>MyApp - Coming Soon</h1>
        <p>Join the waitlist for early access</p>
      </header>
      
      <section id="waitlist-section">
        {/* Embedded waitlist widget */}
        <WaitlistForm 
          layout="embed" 
          variant="standard"
          onSuccess={(position) => {
            console.log(`Joined at position ${position}!`);
          }}
        />
      </section>
      
      <footer>...</footer>
    </div>
  );
}
```

### When to Use Each

**Use Embed Mode when:**
- You have a single landing page
- You want to embed waitlist as a widget
- You want position tracking and credits
- You don't need multiple separate waitlists

**Use Product Waitlists when:**
- You have multiple products/features/tiers
- Each product needs separate waitlist management
- You want per-product analytics
- You're building a SaaS with multiple offerings

### Both Can Coexist

You can use both on the same app!

```tsx
// Landing page: Simple embed
<WaitlistForm layout="embed" variant="compact" />

// Pricing page: Product waitlists
<WaitlistForm productTag="premium" mode="inline" />
<WaitlistForm productTag="enterprise" mode="inline" />
```

---

## Bottom Line

**For your original need (embed waitlist on landing page):**
```tsx
<WaitlistForm layout="embed" variant="compact" />
```

That's it! No admin setup needed, no product creation, uses existing waitlist. Simple and clean.

