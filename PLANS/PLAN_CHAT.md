# Chat Mode Feature - PRD & Implementation Plan

## Overview

Transform GrowthKit widgets from static waitlist forms into intelligent conversational interfaces powered by LLM technology. The chat mode feature enables app owners to provide AI-powered customer support, lead qualification, and automated scheduling directly through the widget.

## Vision Statement

**"Every visitor interaction becomes a meaningful conversation that drives engagement, captures insights, and converts leads through AI-powered chat with seamless human handoff and intelligent scheduling."**

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

### Data Models (New Prisma Schema Additions)

```prisma
// Chat Core Models
model ChatConfiguration {
  id                    String    @id @default(cuid())
  appId                 String    @unique
  enabled               Boolean   @default(false)
  llmProvider           String    @default("groq") // groq, openai, anthropic
  llmModel              String    @default("llama-3.1-70b-versatile")
  systemPrompt          String?
  botName               String    @default("Assistant")
  welcomeMessage        String?
  fallbackMessage       String?
  maxContextLength      Int       @default(8000)
  enableRAG             Boolean   @default(false)
  enableCalendar        Boolean   @default(false)
  enableHumanHandoff    Boolean   @default(false)
  enableAnalytics       Boolean   @default(true)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  app                   App       @relation(fields: [appId], references: [id], onDelete: Cascade)
  conversations         ChatConversation[]
  knowledgeDocuments    ChatKnowledgeDocument[]
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

### Stage 1: MVP (Chat + Calendar)
**Goal**: Ship working chat with AI scheduling that consumes organization credits
**Priority**: Core features with KISS architecture

#### Database Foundation (Simple Schema)
- [ ] Add minimal chat models (ChatConfiguration, ChatConversation, ChatMessage)
- [ ] Add simple calendar models (ChatCalendarConfig, ChatMeetingType, ChatBooking)
- [ ] Run `npx prisma db push` to apply schema changes

#### Simple Backend (No WebSocket Initially)
- [ ] HTTP-based chat API (POST /api/public/chat/message)
- [ ] Groq API client with basic error handling
- [ ] Organization credit consumption (1 credit per message)
- [ ] Simple conversation context (last 10 messages)
- [ ] Calendar functions: check_availability(), book_meeting()

#### Simple Calendar System
- [ ] Fixed time slots approach (9am, 10am, 11am, etc.)
- [ ] Single timezone per app (app owner's timezone)
- [ ] Simple availability: working days + hours only
- [ ] Basic conflict detection (check existing bookings)
- [ ] Email notifications using existing email system

#### Clean Widget UI (Modal-based)
- [ ] Chat button that opens modal dialog
- [ ] Simple message bubbles interface
- [ ] Polling for new messages (every 2 seconds)
- [ ] Loading states and basic error handling
- [ ] Calendar booking UI within chat

#### Streamlined Admin Interface
- [ ] Single "Chat & Calendar" settings page
- [ ] Enable chat toggle + basic system prompt
- [ ] Simple calendar setup (working hours, meeting types)
- [ ] Conversation list view (simple table)
- [ ] Basic credit usage counter

**MVP Success Criteria**:
- ✅ Users can chat with AI that knows about the product
- ✅ AI can check availability and book meetings automatically
- ✅ Booking confirmations sent via email
- ✅ App owners can configure chat and availability easily
- ✅ All conversations saved with credit tracking
- ✅ Clean, responsive UI on mobile and desktop

---

### Stage 2: Incremental (Intelligence & Scheduling)
**Goal**: Add RAG knowledge base and calendar booking
**Priority**: Core differentiating features

#### Knowledge Base (RAG System)
- [ ] Upstash Vector integration for embeddings storage
- [ ] Document upload interface (PDF, TXT, DOCX support)
- [ ] Content processing pipeline (chunking, embedding generation)
- [ ] Vector similarity search integration
- [ ] RAG-enhanced response generation with source citations
- [ ] Knowledge management UI (upload, view, delete documents)

#### Internal Calendar System
- [ ] Calendar configuration models (availability rules, meeting types)
- [ ] Admin UI for working hours and timezone configuration
- [ ] Meeting type management (duration, description, buffer times)
- [ ] Availability calculation logic with conflict detection
- [ ] LLM function calling for calendar operations
- [ ] Booking creation, management, and email notifications

#### Context Enhancement System
- [ ] Page context capture (URL, title, content extraction)
- [ ] User activity integration from existing Activity model
- [ ] Dynamic context API for app owners to add custom context
- [ ] Context injection in conversation flows

#### Conversation Management
- [ ] Admin conversation list view with filtering and search
- [ ] Individual conversation detail view
- [ ] Conversation status management (active, ended, archived)
- [ ] Basic conversation export functionality

**Incremental Success Criteria**:
- ✅ AI answers questions using uploaded knowledge base
- ✅ AI can check availability and book meetings automatically
- ✅ Conversations include relevant page and user context
- ✅ App owners can manage knowledge base and calendar settings
- ✅ Email confirmations sent for all bookings

---

### Stage 3: Advanced (Human Handoff & Intelligence)
**Goal**: Advanced features for enterprise users
**Priority**: Competitive differentiators and enterprise features

#### Human Takeover System
- [ ] Real-time admin chat interface with live message updates
- [ ] "Take Over" conversation functionality with smooth handoff
- [ ] Message routing logic (AI vs human) with proper state management
- [ ] Typing indicators and presence status for admins
- [ ] "Release to AI" functionality with context preservation

#### Conversation Intelligence
- [ ] Background conversation analysis using LLM
- [ ] Automated extraction of interests, pain points, and intent
- [ ] Lead scoring based on conversation engagement
- [ ] Conversation insights dashboard with analytics
- [ ] Integration with existing Activity system for lead profiles

#### Advanced Chat Features
- [ ] BYOK support for multiple LLM providers (OpenAI, Anthropic)
- [ ] A/B testing system for different prompts and configurations
- [ ] Advanced analytics and reporting dashboard
- [ ] Webhook system for external integrations
- [ ] Rate limiting and abuse prevention

#### Enterprise Capabilities
- [ ] Advanced conversation search and filtering
- [ ] Bulk conversation operations and management
- [ ] Enhanced security and compliance features
- [ ] Advanced customization options for branding
- [ ] Performance monitoring and optimization tools

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
- `src/lib/chat/llm-service.ts` - Groq integration
- `src/lib/chat/rag-service.ts` - Vector search
- `src/lib/chat/calendar-service.ts` - Booking logic
- `src/lib/chat/context-builder.ts` - Context assembly
- `src/lib/chat/websocket-server.ts` - Real-time communication
- `src/lib/chat/credit-manager.ts` - Organization credit consumption

### API Routes
- `src/app/api/public/chat/ws/route.ts` - WebSocket endpoint
- `src/app/api/public/chat/message/route.ts` - HTTP fallback
- `src/app/api/admin/chat/` - All admin endpoints

### SDK Updates
- `sdk/src/components/ChatWidget.tsx` - Main chat UI
- `sdk/src/components/ChatButton.tsx` - Floating button
- `sdk/src/lib/chat-client.ts` - WebSocket client
- `sdk/src/api.ts` - Add chat methods

### Admin Dashboard
- `src/app/admin/chat/` - All admin interfaces
- `src/app/admin/chat/settings/page.tsx` - Configuration
- `src/app/admin/chat/conversations/page.tsx` - Conversation list
- `src/app/admin/chat/knowledge/page.tsx` - Knowledge management
- `src/app/admin/chat/calendar/page.tsx` - Calendar setup
- `src/app/admin/chat/live/page.tsx` - Live chat interface

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
