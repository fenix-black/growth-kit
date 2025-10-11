# Activity Tracking Implementation Plan for GrowthKit

## Overview
This document outlines the implementation plan for adding activity tracking capabilities to GrowthKit, allowing developers to track user behavior and interactions within their applications using the fingerprint system.

## Core Concept
- **Purpose**: Track user interactions and behavior analytics similar to Vercel Analytics or Google Analytics
- **Integration**: Built on GrowthKit's fingerprint system for user identification
- **Independence**: Separate from credit system but can be viewed together in unified timeline

## Implementation Phases

### Phase 1: Core Tracking Infrastructure

#### 1.1 Database Schema
Add new `Activity` model to Prisma schema:

```prisma
model Activity {
  id            String   @id @default(cuid())
  appId         String
  fingerprintId String
  eventName     String
  properties    Json?    // JSONB column for flexible data
  context       Json     // JSONB for browser, device, page info
  sessionId     String
  timestamp     DateTime @default(now())
  
  app           App      @relation(fields: [appId], references: [id])
  fingerprint   Lead     @relation(fields: [fingerprintId], references: [fingerprint])
  
  @@index([appId, timestamp])
  @@index([fingerprintId, timestamp])
  @@index([appId, eventName])
}
```

#### 1.2 SDK Implementation
- Add `track(eventName: string, properties?: Record<string, any>)` method to useGrowthKit hook
- Implement automatic context collection:
  - Browser information (user agent, browser type/version)
  - Device info (OS, screen size, device type)
  - Page context (URL, referrer, title)
  - Session data (duration, page views count)
- Event batching system:
  - Queue events client-side
  - Send batches every 30 seconds or when 10 events accumulate
  - Use `sendBeacon` API for reliability on page unload
- Update TypeScript definitions

#### 1.3 API Endpoint
- Create `/api/v1/track` POST endpoint
- Features:
  - Accept batched events array
  - Validate fingerprint and app authentication
  - Rate limiting: 100 events/minute per fingerprint (configurable per app)
  - Efficient batch storage in database

### Phase 2: Dashboard Visualization

#### 2.1 Activity Feed Component
- Real-time event stream display
- Features:
  - Filter by event name, date range, properties
  - Expandable event details
  - Search functionality
  - Quick stats (events/hour, unique users, popular events)

#### 2.2 Analytics Dashboard
- Repurpose existing "Analytics" tab in app settings (currently showing general analytics comment with no value)
- Replace current content with activity tracking visualizations:
  - Event frequency charts (bar charts showing most common events)
  - Popular events ranking
  - Time-based activity heatmap
  - Basic funnel visualization
  - User segments by behavior

#### 2.3 Individual Fingerprint View
- Enhance existing lead details page
- Add:
  - Complete activity history
  - Event patterns and frequency analysis
  - Timeline visualization

### Phase 3: Advanced Features

#### 3.1 Unified Timeline
- Combine track events with credit operations
- Features:
  - Chronological mixed view
  - Visual differentiation (🔵 for track events, 💰 for credit operations)
  - Show relationships between exploration and credit usage
  - Time gap indicators

Example timeline:
```
10:32:15 - 🔵 page_viewed { page: '/dashboard' }
10:32:18 - 🔵 button_clicked { button: 'new-project' }
10:32:46 - 💰 create-project (5 credits spent)
10:32:48 - 🔵 project_created { projectId: 'abc123' }
```

#### 3.2 Performance Optimizations
- Database index optimization
- Data aggregation for events older than 90 days
- Caching strategies for dashboard queries
- Efficient query patterns for timeline views

#### 3.3 Export & Integration
- CSV/JSON export endpoint
- API for querying activity data
- Potential webhook support for real-time events (future)

## Technical Specifications

### Event Structure
```typescript
// Client-side tracking call
interface TrackedEvent {
  eventName: string
  properties?: Record<string, any>
}

// Stored activity record
interface StoredActivity {
  id: string
  appId: string
  fingerprintId: string
  eventName: string
  properties: Record<string, any> | null
  context: {
    browser: string
    os: string
    device: 'desktop' | 'mobile' | 'tablet'
    screenResolution: string
    viewport: string
    url: string
    referrer: string
    userAgent: string
  }
  sessionId: string
  timestamp: Date
}
```

### SDK Usage Examples
```typescript
// Simple event tracking
growthKit.track('button_clicked', { button: 'generate' })

// Page view with duration
growthKit.track('page_viewed', { 
  path: '/dashboard', 
  duration: 120 
})

// Feature usage tracking
growthKit.track('feature_used', { 
  feature: 'ai_generation',
  model: 'gpt-4',
  success: true
})

// Conversion tracking
growthKit.track('signup_completed', {
  method: 'email',
  referrer: 'landing_page'
})
```

### API Endpoint Design
```typescript
// POST /api/v1/track
{
  events: [
    {
      eventName: string,
      properties?: Record<string, any>,
      timestamp: number
    }
  ]
}
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Update Prisma schema with Activity model
- [ ] Run database migration
- [ ] Implement basic SDK track() method
- [ ] Create /api/v1/track endpoint with validation

### Week 2: Client-Side Features
- [ ] Add automatic context collection
- [ ] Implement event batching system
- [ ] Add sendBeacon support
- [ ] Update SDK TypeScript definitions
- [ ] Add rate limiting to API

### Week 3: Basic Dashboard
- [ ] Create Activity Feed component
- [ ] Build Analytics tab in app settings
- [ ] Implement basic event charts
- [ ] Add filtering and search

### Week 4: Advanced Features
- [ ] Build unified timeline view
- [ ] Add performance optimizations
- [ ] Implement data aggregation
- [ ] Create export functionality

### Week 5: Polish & Documentation
- [ ] Comprehensive testing
- [ ] Performance testing with high volume
- [ ] Documentation and examples
- [ ] SDK usage guide

## Success Criteria

1. **Reliability**
   - Events tracked with <1s latency
   - No data loss on page navigation
   - Handles offline scenarios gracefully

2. **Performance**
   - No noticeable impact on app performance
   - Dashboard loads in <500ms
   - Efficient with high event volumes

3. **Developer Experience**
   - Simple, intuitive API
   - Clear documentation
   - Useful error messages
   - TypeScript support

4. **Analytics Value**
   - Actionable insights for developers
   - Clear user behavior patterns
   - Conversion tracking capabilities

## Data Retention Policy

- **Detailed Events**: 90 days
- **Aggregated Data**: Indefinite
- **Export Window**: Last 90 days

## Future Enhancements (Not in MVP)

1. Custom event schemas
2. Automated insights and anomaly detection
3. A/B testing integration
4. Cohort analysis
5. Retention analysis
6. Custom alerts and notifications
7. Third-party integrations (Slack, webhooks)

## Notes

- Keep tracking system independent from credit system
- Focus on developer experience and simplicity
- Ensure compatibility with existing GrowthKit patterns
- Maintain performance at scale
- Don't create unit tests