# Chat Mode Feature - PRD & Implementation Plan

## Overview

Transform GrowthKit widgets from static waitlist forms into intelligent conversational interfaces powered by LLM technology. The chat mode feature enables app owners to provide AI-powered customer support, lead qualification, and automated scheduling directly through the widget.

## Vision Statement

**"Every visitor interaction becomes a meaningful conversation that drives engagement, captures insights, and converts leads through AI-powered chat with seamless human handoff and intelligent scheduling."**

## MVP Philosophy: Complete but Simple

**All four core features in MVP, but KISS implementations:**
1. **💬 AI Chat** - Groq LLM with conversation context (HTTP polling, not WebSocket)
2. **📚 Knowledge Base** - Upstash Vector RAG with simple document upload (text chunking, vector search)
3. **📅 Calendar** - Fixed hourly time slots, basic availability (no complex rules)
4. **👤 Human Handoff** - Message routing, take over/release (single owner, no teams)

**Stage 2 & 3**: Polish, advanced features, and enterprise capabilities

---

## Product Requirements

### Core Value Propositions

1. **AI-First Customer Engagement**: Replace static forms with dynamic conversations
2. **Automated Lead Qualification**: Extract intent, interests, and pain points through natural conversation
3. **Intelligent Scheduling**: AI books meetings automatically using internal calendar system
4. **Seamless Human Handoff**: Organization owners can take over conversations instantly
5. **Conversation Intelligence**: Extract and analyze conversation data for targeted outreach

### Target Users

- **Primary**: SaaS companies, consultants, agencies using GrowthKit for lead generation
- **Secondary**: E-commerce, service businesses needing customer support automation

---

## Technical Architecture

### Credit System Integration

**Organization-Level Credits**: Chat consumes credits from `Organization.creditBalance`

**Credit Costs**:
- Simple message: 1 credit
- RAG-enhanced message (with knowledge base): 2 credits  
- Calendar availability check: 0 credits
- Meeting booking: 0 credits
- Human Handoff intervention: 2 credits
- Conversation analysis (background): 0 credits

### Enhanced Fingerprint System Integration

**Multi-Fingerprint Support**: Leverages improved fingerprint tracking for better user identification:
- Primary: FingerprintJS (client-side, most unique)
- Secondary: Canvas fingerprint (fallback option)  
- Tertiary: Browser signature hash (additional validation)
- Server fingerprint: IP + headers fallback

**Language-Aware Chat**: Utilizes fingerprint language fields:
- `browserLanguage`: Auto-detected user language
- `preferredLanguage`: User-selected language preference
- System prompts can be customized based on detected/preferred language

**Cross-App Conversations** (Future): With shared accounts (`orgUserAccountId`):
- Potential for conversation continuity across organization apps
- Consolidated user profiles for better context

### Data Models (New Prisma Schema Additions)

```prisma
// Chat Core Models
model ChatConfiguration {
  id                    String    @id @default(cuid())
  appId                 String    @unique
  enabled               Boolean   @default(false)
  systemPrompt          String?
  botName               String    @default("Assistant")
  welcomeMessage        String?
  
  // Feature toggles (all enabled by default for MVP)
  enableCalendar        Boolean   @default(true)   // MVP feature
  enableHumanHandoff    Boolean   @default(true)   // MVP feature
  enableRAG             Boolean   @default(true)   // MVP feature
  
  // LLM configuration
  llmProvider           String    @default("groq")
  llmModel              String    @default("openai/gpt-oss-120b")
  maxContextLength      Int       @default(8000)
  
  // Advanced features for later stages
  enableAnalytics       Boolean   @default(true)
  fallbackMessage       String?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Widget positioning inherited from App model
  
  app                   App       @relation(fields: [appId], references: [id], onDelete: Cascade)
  conversations         ChatConversation[]
  knowledgeDocuments    ChatKnowledgeDocument[] // Stage 2
  calendarConfig        ChatCalendarConfig?
  
  @@map("chat_configurations")
}

model ChatConversation {
  id                    String    @id @default(cuid())
  appId                 String
  configId              String
  fingerprintId         String    // Always use fingerprint as primary identifier
  sessionId             String    @unique
  status                String    @default("active") // active, ended, taken_over, archived
  humanTakeoverAt       DateTime?
  humanTakeoverBy       String?   // user ID who took over
  endedAt               DateTime?
  metadata              Json?     // page context, user agent, etc.
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  app                   App       @relation(fields: [appId], references: [id], onDelete: Cascade)
  config                ChatConfiguration @relation(fields: [configId], references: [id], onDelete: Cascade)
  fingerprint           Fingerprint @relation(fields: [fingerprintId], references: [id])
  messages              ChatMessage[]
  conversationInsights  ChatConversationInsights?
  
  // Note: If user provides email during chat, create/update Lead record
  // but always keep fingerprintId as the primary reference
  // To get lead info: query Lead.fingerprintId = conversation.fingerprintId
  
  @@index([appId, createdAt])
  @@index([fingerprintId])
  @@index([status])
  @@map("chat_conversations")
}

model ChatMessage {
  id              String    @id @default(cuid())
  conversationId  String
  role            String    // user, assistant, system
  content         String    @db.Text
  metadata        Json?     // function calls, context used, etc.
  creditsUsed     Int       @default(0)
  createdAt       DateTime  @default(now())
  
  conversation    ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@index([conversationId, createdAt])
  @@map("chat_messages")
}

model ChatKnowledgeDocument {
  id           String    @id @default(cuid())
  configId     String
  title        String
  content      String    @db.Text
  sourceType   String    // upload, url, manual
  sourceUrl    String?
  status       String    @default("processing") // processing, ready, error
  chunkCount   Int       @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  config       ChatConfiguration @relation(fields: [configId], references: [id], onDelete: Cascade)
  chunks       ChatKnowledgeChunk[]
  
  @@index([configId])
  @@map("chat_knowledge_documents")
}

model ChatKnowledgeChunk {
  id           String    @id @default(cuid())
  documentId   String
  content      String    @db.Text
  embedding    String?   // Base64 encoded vector
  chunkIndex   Int
  metadata     Json?     // section title, page number, etc.
  
  document     ChatKnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@index([documentId])
  @@map("chat_knowledge_chunks")
}

// Calendar System Models
model ChatCalendarConfig {
  id                String    @id @default(cuid())
  configId          String    @unique
  timezone          String    @default("America/New_York")
  workingHours      Json      // { monday: {start: "09:00", end: "17:00"}, ... }
  bufferMinutes     Int       @default(15)
  maxDaysOut        Int       @default(30)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  config            ChatConfiguration @relation(fields: [configId], references: [id], onDelete: Cascade)
  meetingTypes      ChatMeetingType[]
  
  @@map("chat_calendar_configs")
}

model ChatMeetingType {
  id                String    @id @default(cuid())
  calendarConfigId  String
  name              String
  description       String?
  durationMinutes   Int
  bufferBefore      Int       @default(0)
  bufferAfter       Int       @default(0)
  isActive          Boolean   @default(true)
  color             String    @default("#3B82F6")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  calendarConfig    ChatCalendarConfig @relation(fields: [calendarConfigId], references: [id], onDelete: Cascade)
  bookings          ChatBooking[]
  
  @@index([calendarConfigId])
  @@map("chat_meeting_types")
}

model ChatBooking {
  id              String    @id @default(cuid())
  appId           String
  meetingTypeId   String
  conversationId  String?   // Link to conversation (which has fingerprintId)
  attendeeName    String
  attendeeEmail   String
  startTime       DateTime
  endTime         DateTime
  status          String    @default("confirmed") // confirmed, cancelled, completed
  notes           String?
  meetingLink     String?
  cancellationReason String?
  cancelledAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  app             App       @relation(fields: [appId], references: [id], onDelete: Cascade)
  meetingType     ChatMeetingType @relation(fields: [meetingTypeId], references: [id])
  conversation    ChatConversation? @relation(fields: [conversationId], references: [id])
  
  // Note: To get lead/fingerprint info, use conversation.fingerprint relationship
  // attendeeName and attendeeEmail store the booking details directly
  
  @@index([appId, startTime])
  @@index([attendeeEmail])
  @@index([status])
  @@map("chat_bookings")
}

// Analytics & Insights
model ChatConversationInsights {
  id              String    @id @default(cuid())
  conversationId  String    @unique
  interests       String[]  @default([])
  painPoints      String[]  @default([])
  intent          String?   // high, medium, low, unknown
  urgency         Int?      // 1-5 scale
  sentiment       String?   // positive, neutral, negative
  featuresDiscussed String[] @default([])
  objections      String[]  @default([])
  budgetIndicators String[]  @default([])
  extractedAt     DateTime  @default(now())
  
  conversation    ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@index([intent])
  @@index([urgency])
  @@map("chat_conversation_insights")
}

// Update existing models
model App {
  // ... existing fields ...
  
  // New relationships
  chatConfig          ChatConfiguration?
  chatConversations   ChatConversation[]
  chatBookings        ChatBooking[]
}

model Fingerprint {
  // ... existing fields ...
  
  // New relationships
  chatConversations   ChatConversation[]
}

// Note: Lead model doesn't need direct chat relationships
// since we always go through fingerprint as the primary identifier
```

---

## Implementation Plan

### Stage 1: MVP (Complete Feature Set)
**Goal**: AI chat with knowledge base, scheduling, and human handoff
**Priority**: All core features - chat + RAG + calendar + handoff - the complete value proposition

#### Database Foundation (Complete Schema)
- [x] Add chat models (ChatConfiguration, ChatConversation, ChatMessage)
- [x] Add calendar models (ChatCalendarConfig, ChatMeetingType, ChatBooking)
- [x] Add knowledge base models (ChatKnowledgeDocument, ChatKnowledgeChunk)
- [x] Run `npx prisma db push` to apply schema changes

#### Simple Backend (HTTP Only)
- [x] HTTP-based chat API (POST /api/public/chat/message)
- [x] Groq API client with basic error handling
- [x] Organization credit consumption (1 credit simple, 2 credits with RAG)
- [x] Conversation context (last 10 messages + RAG results)
- [x] Calendar functions: check_availability(), book_meeting()
- [x] Upstash Vector integration (reuse existing Upstash account)
- [x] Document processing and embedding generation
- [x] RAG query and context injection

#### Simple Calendar System
- [x] Fixed time slots approach (9am, 10am, 11am, etc.)
- [x] Single timezone per app (app owner's timezone)
- [x] Simple availability: working days + hours only
- [x] Basic conflict detection (check existing bookings)
- [x] Email notifications using existing email system

#### Integrated Widget UI (Position-Aware)
- [x] Chat mode replaces waitlist capsule when enabled
- [x] Floating button shows credits (inherits existing widget positioning)
- [x] Slide-up/down chat panel (direction based on widget position)
- [x] Dynamic height based on screen size (70vh max, 400px min)
- [x] Message bubbles with auto-scroll to bottom
- [x] Polling for new messages (every 2 seconds)
- [x] Input field with send button
- [x] Loading states and basic error handling

#### Complete Admin Interface (Conditional "Chat" Tab)
- [x] Add new "Chat" tab to app details (only visible when `app.chatConfig?.enabled === true`)
- [x] Initial setup: Chat enabled via ChatSettingsCard toggle
- [x] Once enabled, "Chat" tab appears alongside Overview, Branding, Waitlist
- [x] Within Chat tab, display all cards:
  - [x] ChatSettingsCard: Bot name, system prompt, disable toggle
  - [x] KnowledgeBaseCard: Upload docs, view, delete (simple table)
  - [x] CalendarSettingsCard: Working hours, timezone, meeting types
  - [x] LiveConversationsCard: Active chats table with "Take Over" buttons
- [x] Dedicated admin chat page (`/admin/chat/live/[conversationId]`) for human handoff
- [x] "Release to AI" button in admin chat interface
- [x] Credit tracking integrated into message system

**MVP Success Criteria**:
- ✅ Users can chat with AI powered by uploaded knowledge base (RAG)
- ✅ AI answers accurately using company documents and information
- ✅ AI can check availability and book meetings automatically
- ✅ Booking confirmations sent via email
- ✅ App owners can upload/manage knowledge base documents
- ✅ App owners can view live conversations in admin dashboard
- ✅ App owners can "take over" any conversation (human handoff)
- ✅ Smooth transition: AI → Human → AI with context preservation
- ✅ App owners can configure chat, knowledge, and availability easily
- ✅ All conversations saved with proper credit tracking (1 vs 2 credits)
- ✅ Clean, responsive UI on mobile and desktop

---

### Stage 2: Polish & Enhancements
**Goal**: Improve UX and add nice-to-have features
**Priority**: Polish and optimizations

#### Calendar Integration
- [ ] Generate subscribable ICS calendar feed endpoint
- [ ] Display calendar URL in app details (e.g., `https://growthkit.app/cal/[appId]/bookings.ics`)
- [ ] App owners can subscribe in Apple Calendar, Google Calendar, Outlook, etc.
- [ ] Real-time sync of all chat bookings to owner's personal calendar
- [ ] Include booking details (attendee name, email, meeting type, notes)

#### RAG Improvements (Optional)
- [ ] PDF document support (MVP only supports text files)
- [ ] Document preview before upload

#### Language & Localization Support
- [ ] Chat widget UI (client) support for also spanish (as the rest of the widget, using the internal 'setLanguage' widget method)
- [ ] schedule invitation email customization per language (maybe it would be good to also enable this email customization for the other templates as well, or leave them better prepared)
- [ ] Language detection from fingerprint data (browserLanguage, preferredLanguage)
- [ ] Language-specific system prompts and responses (bot name, welcome message, system prompt, and meeting types descriptions)
- [ ] Multi-language knowledge base support (this is not necesary)
- [ ] Timezone-aware scheduling using fingerprint location data

#### Context Enhancement System
- [ ] Page context capture (URL, title, content extraction)
- [ ] User activity integration from existing Activity model
- [ ] Context injection in conversation flows
- [ ] Cross-app context sharing (for shared accounts)
- [ ] Dynamic context API for app owners to add custom context (not now)

#### Advanced Conversation Management
- [ ] Individual conversation detail view with user profile integration
- [ ] Conversation status management (active, ended, archived)
- [ ] Conversation export with fingerprint metadata
- [ ] User identification improvements using multi-fingerprint data
- [ ] Admin conversation list view with filtering and search

### UI Customization - this is also really needed
- [ ] Advanced customization options for branding: custom colors, like how we customize the 'waitlist' mode colors, but within the admin 'Chat' tab.

**Stage 2 Success Criteria**:
- ✅ App owners can subscribe to calendar feed and see bookings in their own calendar apps
- ✅ Real-time sync of GrowthKit bookings to personal calendars
- ✅ Better document format support if needed (PDF)
- ✅ Multi-language support for international users
- ✅ Enhanced context from user activity and fingerprint data

---

### Stage 3: Advanced (Analytics & Automation)
**Goal**: Advanced features for enterprise users
**Priority**: Competitive differentiators and enterprise features

#### Enhanced Human Takeover Features
- [ ] Typing indicators and presence status
- [ ] Conversation notes and tagging
- [ ] Handoff history and analytics

#### Conversation Intelligence - this is really needed
- [ ] Background conversation analysis using LLM
- [ ] Automated extraction of interests, pain points, and intent
- [ ] Lead scoring based on conversation engagement
- [ ] Conversation insights dashboard with analytics
- [ ] Integration with existing Activity system for lead profiles

#### Advanced Chat Features - not too relevant right now
- [ ] Advanced analytics and reporting dashboard

**Advanced Success Criteria**:
- ✅ Seamless human takeover with zero conversation disruption
- ✅ Automated conversation insights with high accuracy
- ✅ Comprehensive analytics dashboard
- ✅ Enterprise-ready security and customization
- ✅ Extensible integration capabilities

---

## API Endpoints

### Public API (for SDK)
```typescript
// Chat WebSocket endpoint
WS /api/public/chat/connect?appKey=xxx&fingerprint=xxx

// HTTP fallback for messages
POST /api/public/chat/message
GET  /api/public/chat/history/:sessionId
POST /api/public/chat/context
```

### Admin API 
```typescript
// Configuration
GET    /api/admin/chat/config
PUT    /api/admin/chat/config
POST   /api/admin/chat/config/test

// Knowledge Base
GET    /api/admin/chat/knowledge
POST   /api/admin/chat/knowledge/upload
DELETE /api/admin/chat/knowledge/:id
POST   /api/admin/chat/knowledge/reindex

// Calendar
GET    /api/admin/chat/calendar/config
PUT    /api/admin/chat/calendar/config
GET    /api/admin/chat/calendar/bookings
PUT    /api/admin/chat/calendar/bookings/:id

// Conversations
GET    /api/admin/chat/conversations
GET    /api/admin/chat/conversations/:id
POST   /api/admin/chat/conversations/:id/takeover
POST   /api/admin/chat/conversations/:id/release
POST   /api/admin/chat/conversations/:id/message

// Analytics
GET    /api/admin/chat/analytics/overview
GET    /api/admin/chat/analytics/conversations
GET    /api/admin/chat/analytics/insights
```

---

## Key Files to Create/Modify

### Database
- `prisma/schema.prisma` - Add all chat models

### Backend Services  
- `src/lib/chat/llm-service.ts` - Groq integration with function calling
- `src/lib/chat/calendar-service.ts` - Booking logic and availability
- `src/lib/chat/context-builder.ts` - Context assembly (history + RAG)
- `src/lib/chat/credit-manager.ts` - Organization credit consumption
- `src/lib/chat/message-router.ts` - Route messages (AI vs human)
- `src/lib/chat/rag-service.ts` - Upstash Vector search
- `src/lib/chat/document-processor.ts` - Chunking and embedding generation
- `src/lib/chat/upstash-vector.ts` - Upstash Vector client (reuse existing config)

### API Routes (HTTP Polling)
- `src/app/api/public/chat/message/route.ts` - Send message, get AI response (with RAG)
- `src/app/api/public/chat/messages/route.ts` - Poll for new messages
- `src/app/api/public/cal/[appId]/bookings.ics/route.ts` - ICS calendar feed (Stage 2)
- `src/app/api/admin/chat/config/route.ts` - Settings management
- `src/app/api/admin/chat/knowledge/route.ts` - Upload/list/delete documents
- `src/app/api/admin/chat/knowledge/process/route.ts` - Process uploaded docs
- `src/app/api/admin/chat/conversations/route.ts` - List conversations
- `src/app/api/admin/chat/takeover/route.ts` - Human handoff
- `src/app/api/admin/chat/release/route.ts` - Release back to AI
- `src/app/api/admin/chat/send/route.ts` - Admin sends message

### SDK Updates
- `sdk/src/components/ChatWidget.tsx` - Main widget (chat mode)
- `sdk/src/components/ChatFloatingButton.tsx` - Position-aware button
- `sdk/src/components/ChatPanel.tsx` - Slide-up chat panel
- `sdk/src/components/ChatMessages.tsx` - Message bubbles with auto-scroll
- `sdk/src/components/ChatInput.tsx` - Input field + send button
- `sdk/src/lib/chat-client.ts` - HTTP polling client
- `sdk/src/api.ts` - Add chat API methods

### Admin Dashboard (Conditional "Chat" Tab in App Details)
- `src/app/admin/app/[id]/AppDetailDashboard.tsx` - Conditionally show "Chat" tab when enabled
- `src/app/admin/components/ChatTab.tsx` - Container for all chat-related cards
- `src/app/admin/components/ChatEnableCard.tsx` - Initial "Enable Chat Mode" card (Overview tab)
- `src/app/admin/components/ChatSettingsCard.tsx` - Chat settings (disable toggle, prompt, bot name)
- `src/app/admin/components/KnowledgeBaseCard.tsx` - Upload/manage documents
- `src/app/admin/components/CalendarSettingsCard.tsx` - Working hours, meeting types
- `src/app/admin/components/LiveConversationsCard.tsx` - Active chats with "Take Over" buttons
- `src/app/admin/chat/live/[conversationId]/page.tsx` - Dedicated page for admin chat interface

---

## Success Metrics

### MVP Metrics
- **Engagement**: Avg. messages per conversation
- **Adoption**: % of apps with chat enabled
- **Technical**: Message latency < 2s, 99% uptime

### Business Metrics
- **Conversion**: Chat → Lead conversion rate
- **Revenue**: Credit consumption per organization
- **Satisfaction**: App owner NPS score

### Advanced Metrics  
- **Intelligence**: Conversation insight accuracy
- **Efficiency**: Human handoff → resolution time
- **Automation**: % conversations resolved by AI

---

## Risk Mitigation

### Technical Risks
1. **LLM Costs**: Start with Groq (cheap), add BYOK option
2. **WebSocket Scale**: Use Redis pub/sub, horizontal scaling
3. **Vector Search**: Upstash Vector handles scaling automatically
4. **Database Load**: Proper indexing, read replicas if needed

### Business Risks
1. **Credit Consumption**: Clear pricing, usage alerts
2. **Feature Complexity**: Staged rollout, feature flags
3. **User Adoption**: Simple onboarding, clear value props

### Compliance Risks
1. **Data Privacy**: GDPR compliance, data retention policies
2. **AI Safety**: Content filtering, prompt injection prevention
3. **Security**: Input validation, rate limiting

---

## Future Enhancements (Post-MVP)

### Integration Expansions
- CRM integrations (Salesforce, HubSpot)
- Email marketing (Mailchimp, ConvertKit)
- Calendar sync (Google Calendar, Outlook)
- Zapier automation triggers

### Advanced AI Features
- Multi-language support
- Voice message support
- Image/document analysis
- Sentiment analysis dashboard

### Enterprise Features
- SSO integration
- Advanced security controls
- Custom model fine-tuning
- Dedicated infrastructure

---

## Implementation Approach

**Stage 1 (MVP)**: Foundation → Basic working chat with organization credit consumption
**Stage 2 (Incremental)**: Intelligence → RAG knowledge base + Calendar booking system
**Stage 3 (Advanced)**: Enterprise → Human handoff + Conversation intelligence

**Development Notes**:
- Each stage builds upon the previous stage's foundation
- Features can be implemented in parallel within each stage where dependencies allow
- All database schema changes should be applied incrementally using `npx prisma db push`
- Focus on functional implementation over optimization until Stage 3

---

*This PRD serves as the comprehensive guide for AI-assisted chat feature development. Each task is designed to be implementable through collaborative AI-human development.*
