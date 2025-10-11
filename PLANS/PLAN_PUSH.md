# Web Push Notifications - PLAN_PUSH.md

## Overview
Enable web push notifications through the GrowthKit widget, with credit incentives for users who opt-in.

## User Flow

### 1. Permission Request
- Widget shows modal: "Get notified about updates and never miss important news!"
- Credit incentive: "Enable notifications and earn {X} credits" (dynamic based on app config)
- User clicks "Enable Notifications" → Browser permission dialog
- On grant: Award credits + subscribe to push notifications

### 2. Credit Integration
```
Current Credits System (configurable per app):
- Name provided: X credits
- Email provided: X credits  
- Email verified: X credits
- Referral signup: X credits
+ Push enabled: X credits (NEW)
```

### 3. Subscription Flow
- Permission granted → Register service worker
- Generate push subscription → Send to GrowthKit backend
- Track subscription per user/app/domain
- Credits awarded immediately

## Technical Implementation

### Widget (SDK)
```javascript
// Auto-register service worker
await navigator.serviceWorker.register(generatedServiceWorker);

// Subscribe to push
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY
});

// Send subscription + award credits
await api.post('/push/subscribe', {
  subscription,
  userId,
  appId
  // Backend will determine credits from app configuration
});
```

### Service Worker (Auto-generated)
```javascript
// Handle incoming push messages
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    data: { url: data.url, notificationId: data.id }
  });
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  // Track click + open URL
  fetch('/api/push/track-click', { 
    method: 'POST', 
    body: JSON.stringify({ notificationId: event.notification.data.notificationId })
  });
  clients.openWindow(event.notification.data.url);
});
```

## Backend Features

### API Endpoints
- `POST /api/push/subscribe` - Register push subscription + award credits
- `POST /api/push/unsubscribe` - Remove subscription
- `POST /api/push/send` - Send notifications to segments
- `POST /api/push/track-click` - Track engagement

### Database Schema
```prisma
model PushSubscription {
  id           String   @id @default(cuid())
  userId       String
  appId        String
  subscription Json     // Browser subscription object
  domain       String
  createdAt    DateTime @default(now())
  active       Boolean  @default(true)
  
  user User @relation(fields: [userId], references: [id])
  app  App  @relation(fields: [appId], references: [id])
}

model PushCampaign {
  id          String   @id @default(cuid())
  appId       String
  title       String
  body        String
  url         String?
  targetRules Json     // Segment targeting rules
  sentCount   Int      @default(0)
  clickCount  Int      @default(0)
  createdAt   DateTime @default(now())
  
  app App @relation(fields: [appId], references: [id])
}
```

## Dashboard Features

### Campaign Creation
```
┌─ Create Push Campaign ─────────────┐
│ Title: [                          ] │
│ Message: [                        ] │
│ Target URL: [                     ] │
│                                    │
│ Target Audience:                   │
│ ☑ All users                       │
│ ☐ Segment: Premium users          │
│ ☐ Segment: Trial ending soon      │
│ ☐ Custom rules                    │
│                                    │
│ [Send Now] [Schedule] [Save Draft] │
└────────────────────────────────────┘
```

### Analytics
- Push subscriptions by app
- Campaign performance (sent/delivered/clicked)
- Credits awarded for push opt-ins
- Unsubscribe rates

## Credit Strategy

### Configurable Incentive Amount
- Credits per push notification opt-in configured per app in admin dashboard
- App owners can set appropriate incentive based on their user value
- Suggested default: 2-5 credits (similar range to name/email)
- One-time reward per user per app

### Dynamic Messaging
- Widget displays actual credit amount from app configuration
- "Enable notifications for {X} credits"
- "Stay updated and earn credits"
- "Get notified about new features - {X} credits bonus!"

### Admin Configuration
- Dashboard setting: "Credits for push notification opt-in"
- Part of existing app credit configuration system
- Allows A/B testing different incentive amounts

## Implementation Phases

### Phase 1: Basic Push (MVP)
- [ ] Service worker auto-generation
- [ ] Push subscription management
- [ ] Credits integration
- [ ] Simple dashboard campaign creation

### Phase 2: Advanced Features
- [ ] Audience segmentation
- [ ] Campaign scheduling
- [ ] Rich notifications (images, actions)
- [ ] A/B testing

### Phase 3: Advanced Analytics
- [ ] Conversion tracking
- [ ] Push performance insights
- [ ] Automated campaigns based on user behavior

## Success Metrics
- Push opt-in rate (target: >15%)
- Credits awarded via push notifications
- Push campaign click-through rate (target: >3%)
- User retention impact from push notifications

## Technical Notes
- VAPID keys required for push service authentication
- Service worker must be served from same origin as widget
- Push notifications work across all apps on same domain
- Graceful fallback if push API not supported

## Future Enhancements
- Web push automation (welcome series, re-engagement)
- Location-based push notifications
- Push notification preferences center
- Integration with email campaigns
