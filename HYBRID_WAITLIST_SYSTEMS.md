# Hybrid Waitlist Systems - Complete Guide

## 🎯 Two Systems, One Codebase

You now have **TWO complementary waitlist approaches** that can be used independently or together:

---

## System 1: Simple Embed Mode (Your Original Need)

### What It Is
A simple embeddable widget for your **app-level waitlist**. Just renders the existing waitlist as a widget instead of full-page.

### When to Use
- ✅ Single landing page with waitlist
- ✅ Want to embed waitlist in existing page layout
- ✅ One waitlist for the entire app
- ✅ Show position and give credits
- ✅ No admin setup needed

### Usage
```tsx
// Compact - minimal space
<WaitlistForm layout="embed" variant="compact" />

// Standard - full card
<WaitlistForm layout="embed" variant="standard" />
```

### What You Get
- Shows waitlist position (#42)
- Gives credits for joining
- Uses existing waitlist data
- Appears in existing admin waitlist dashboard
- Same analytics as full-page waitlist

### Admin
No extra setup! It uses your existing app-level waitlist configuration.

---

## System 2: Product Waitlists (Advanced)

### What It Is
Separate waitlists for different **products, features, or tiers** within your app. Each product has its own configuration and data.

### When to Use
- ✅ SaaS with multiple pricing tiers (Free, Pro, Premium)
- ✅ Multiple beta features to gauge interest
- ✅ Different products within one app
- ✅ Want per-product analytics
- ✅ Different auto-invite schedules per product

### Usage
```tsx
// Premium tier waitlist
<WaitlistForm productTag="premium" mode="inline" />

// Mobile app beta
<WaitlistForm productTag="mobile-app" mode="modal" trigger={<button>Join Beta</button>} />
```

### What You Get
- Separate data per product
- "You're on the list" feedback (no position)
- No credits given
- Per-product admin management
- Per-product analytics
- Independent auto-invite schedules

### Admin
Create products in: **Waitlist → Product Waitlists → New Product**

---

## 📋 Quick Reference

| Aspect | Embed Mode | Product Waitlists |
|--------|------------|-------------------|
| **Prop** | `layout="embed"` | `productTag="..."` |
| **Setup** | None (uses existing) | Create in admin |
| **Data** | App-level waitlist | Separate per product |
| **Position** | ✅ Shows #42 | ❌ Just "you're in" |
| **Credits** | ✅ Yes | ❌ No |
| **Analytics** | Existing dashboard | Per-product view |
| **Admin** | Waitlist → Entries | Waitlist → Product Waitlists |
| **Use Case** | Landing page embed | Multiple products |

---

## 💡 Real-World Examples

### Example 1: Simple Landing Page (Embed Mode)

```tsx
function LandingPage() {
  return (
    <div className="hero">
      <h1>MyApp - Launching Soon</h1>
      <p>Revolutionary new platform</p>
      
      {/* Simple embedded waitlist */}
      <WaitlistForm 
        layout="embed" 
        variant="standard"
      />
    </div>
  );
}
```

**Result:** One waitlist, shows position, gives credits, no admin setup needed.

---

### Example 2: SaaS Pricing Page (Product Waitlists)

```tsx
function PricingPage() {
  return (
    <div className="pricing-grid">
      <PricingTier name="Free" price="$0" available={true} />
      
      <PricingTier name="Pro" price="$29" available={true} />
      
      <div className="pricing-card">
        <h3>Premium</h3>
        <p className="badge">Coming Soon</p>
        
        {/* Product waitlist for Premium */}
        <WaitlistForm 
          productTag="premium"
          mode="inline"
          variant="compact"
        />
      </div>
      
      <div className="pricing-card">
        <h3>Enterprise</h3>
        <p className="badge">Beta</p>
        
        {/* Product waitlist for Enterprise */}
        <WaitlistForm 
          productTag="enterprise"
          mode="inline"
          variant="compact"
        />
      </div>
    </div>
  );
}
```

**Result:** Two separate waitlists, per-product analytics, manage each independently in admin.

---

### Example 3: Both Together (Hybrid)

```tsx
function Website() {
  return (
    <>
      {/* Landing page - app-level waitlist embed */}
      <LandingPage>
        <WaitlistForm layout="embed" variant="compact" />
      </LandingPage>
      
      {/* Pricing page - product waitlists */}
      <PricingPage>
        <WaitlistForm productTag="premium" mode="inline" />
        <WaitlistForm productTag="enterprise" mode="inline" />
      </PricingPage>
    </>
  );
}
```

**Result:** App-level waitlist on landing page, product waitlists on pricing page. All managed separately in admin.

---

## 🤔 Which Should I Use?

### Use Embed Mode if:
- You have a **single waitlist** for your app
- You want to **embed it on a landing page**
- You want **position tracking** and **credits**
- You want **zero admin setup** (just use the widget)
- You're building a **simple landing page**

### Use Product Waitlists if:
- You have **multiple products/features**
- Each needs **separate waitlist management**
- You want **per-product analytics**
- You're building a **SaaS with tiers**
- You want **independent auto-invite schedules**

### Use Both if:
- You have a **landing page** (use embed mode)
- AND **multiple products** (use product waitlists)
- Want flexibility for different scenarios

---

## 📚 Documentation

- **Simple Embed Mode:** `docs/EMBED_WAITLIST_SIMPLE.md`
- **Product Waitlists:** `docs/PRODUCT_WAITLISTS_USAGE.md`
- **Implementation Details:** `PRODUCT_WAITLISTS_IMPLEMENTATION_SUMMARY.md`
- **Full Plan:** `PRODUCT_WAITLISTS.md`

---

## ✨ Summary

**You got the best of both worlds:**

1. **Simple solution** (embed mode) - What you originally needed
2. **Advanced solution** (product waitlists) - For future growth

Both are production-ready, clean, and well-tested. Use whichever fits your current need!
