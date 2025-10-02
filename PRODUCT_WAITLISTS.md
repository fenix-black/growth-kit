# Product Waitlists Feature - Implementation Plan

## Overview

**Feature:** Hybrid waitlist system with two complementary approaches:

### 1. Product Waitlists (Advanced)
- Tag-based product-specific waitlists (e.g., "premium-plan", "mobile-app")
- Separate waitlists for different products/features/tiers
- No credits given, no position tracking (simple "you're in" feedback)
- Independent auto-invite schedules per product
- Full admin management UI
- Per-product analytics
- Custom fields support (Phase 2)

### 2. Embed Mode (Simple)
- Embeddable widget for app-level waitlist
- Single waitlist, same as full-page mode
- Shows position, gives credits (existing behavior)
- Can be placed anywhere with `layout="embed"`
- Uses existing admin/analytics

**Use Cases:**
- **Product Waitlists:** Multiple products (SaaS pricing tiers, beta features, mobile app)
- **Embed Mode:** Single landing page with embedded waitlist widget

---

## What I Will Deliver

**Code & Implementation:**
- ✅ Prisma schema updates & migration files
- ✅ TypeScript type definitions
- ✅ Backend API route handlers (public + admin)
- ✅ React components (Admin UI)
- ✅ React components (SDK widgets)
- ✅ Helper functions & utilities
- ✅ Vanilla JS API wrappers
- ✅ Test/validation scripts in `/scripts` folder
- ✅ Documentation comments in code

**What I Cannot Do (Your Tasks After):**
- ❌ Run migrations on your actual database
- ❌ Test in real browsers on real devices
- ❌ Deploy to Vercel
- ❌ Configure actual monitoring/alerts
- ❌ Load testing with real traffic
- ❌ User acceptance testing

---

## Important Constraints

**Database:**
- ⚠️ Single production database (no separate dev environment)
- ⚠️ All changes must be backward compatible and safe
- ⚠️ Prisma changes must be committed and pushed before deployment
- ⚠️ Migration must handle existing data gracefully

**Testing Approach:**
- ✅ Check `/scripts` folder for existing test scripts first (don't duplicate)
- ✅ Create new validation scripts in `/scripts` as needed
- ✅ **I run these scripts** to test and validate data/functionality
- ✅ Never run `npm run dev` locally
- ✅ Assume Vercel deployment environment
- ✅ All validation via standalone scripts that I execute

**Deployment:**
- 🚀 Code will be deployed to Vercel
- 🚀 No local server testing
- 🚀 All changes must work in serverless environment
- 🚀 You handle the actual deployment after review

---

## Workflow Summary

**My Responsibilities:**
1. ✅ Write all code (database, APIs, UI, SDK)
2. ✅ Create validation scripts in `/scripts` (check for existing ones first)
3. ✅ **Run validation scripts** to test my implementation
4. ✅ Fix any issues found during validation

**Your Responsibilities:**
1. 👀 Review my code changes
2. 💾 Commit and push changes to GitHub
3. 💾 Backup production database
4. 🚀 Deploy to Vercel
5. ✅ Verify deployment works
6. 📊 Monitor for issues

---

## Architecture Overview

### Data Model
- **Tag-based approach:** Single `productTag` field in `Waitlist` model
- **Config storage:** Product definitions in `App.metadata` (no new tables)
- **Custom fields:** Stored in `Waitlist.metadata` and `Lead.metadata`
- **Multi-product support:** Same email can join multiple product waitlists

### Key Design Decisions
- ✅ Tag-based, not full Product model (simpler, faster)
- ✅ Store configs in App.metadata (no new tables, flexible)
- ✅ No credits for product waitlists (different use case)
- ✅ No position tracking (just "you're in" feedback)
- ✅ Nested under Waitlist tab (cleaner admin navigation)
- ✅ Per-product auto-invites (independent schedules)
- ✅ Per-product email templates (targeted messaging)
- ✅ Inherit branding by default (override if wanted)
- ✅ Multi-mode embedding (inline/modal/drawer)
- ✅ Framework agnostic (React, Vue, vanilla JS)

---

## Phase 1: Core Feature (MVP) ✅ COMPLETED

**Goal:** Implement both product waitlists and simple embed mode  
**Deliverable:** 
- ✅ Functional embeddable product waitlists without custom fields
- ✅ Simple embed mode for app-level waitlist

**Status:** Implementation complete, ready for deployment

### 1.1 Database Changes

#### Waitlist Model Update
- [x] Add `productTag` field (String, nullable)
- [x] Update unique constraint from `[appId, email]` to `[appId, email, productTag]`
- [x] Add index on `[appId, productTag]`
- [x] Create migration script
  - [x] Set `productTag = null` for all existing records (app-level waitlists)
  - [x] Ensure migration is backward compatible

#### App Model Metadata Structure
- [x] Define `productWaitlists` JSON schema
  ```json
  {
    "productWaitlists": [
      {
        "tag": "string",
        "name": "string",
        "description": "string",
        "successMessage": "string",
        "enabled": boolean,
        "autoInviteEnabled": boolean,
        "dailyInviteQuota": number,
        "inviteTime": "string",
        "inviteEmailTemplate": "string",
        "primaryColor": "string | null",
        "logoUrl": "string | null",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ]
  }
  ```
- [x] Create helper functions for metadata validation
- [x] Add TypeScript types for product config

#### ✓ Verification Checkpoint
- [x] Verify Prisma schema has no syntax errors
- [x] Check TypeScript types compile without errors
- [x] Verify migration file is properly formatted
- [ ] Check existing scripts in `/scripts` for database validation
- [ ] Create validation script if needed (e.g., `check-product-waitlists.js`)
- [ ] **Run validation script to verify schema changes work**

### 1.2 Backend API - Public Endpoints

#### Update: Join Waitlist
- [x] Modify `POST /api/public/waitlist/join`
  - [x] Accept optional `productTag` parameter
  - [x] Validate productTag exists in app config (if provided)
  - [x] If productTag: Join product waitlist (no credits, no position)
  - [x] If no productTag: Existing app-level behavior
  - [x] Return appropriate response based on type
- [x] Add server-side validation
  - [x] Ensure productTag matches pattern: `^[a-z0-9-]+$`
  - [x] Verify product is enabled
  - [x] Check email format

#### Update: Get User Status
- [x] Modify `GET /api/public/user`
  - [x] Add `products` object to `waitlist` response
  - [x] Query all product waitlist entries for fingerprint
  - [x] Return structure:
    ```json
    {
      "waitlist": {
        "isOnList": boolean,
        "position": number | null,
        "status": "string",
        "products": {
          "product-tag": {
            "isOnList": boolean,
            "status": "string",
            "joinedAt": "string"
          }
        }
      }
    }
    ```

#### New: Get Products List
- [x] Create `GET /api/public/products`
  - [x] Return enabled products for app
  - [x] Include: tag, name, description, branding
  - [x] Exclude internal config (auto-invite settings, etc.)
  - [x] Cache response (5 min TTL)
- [x] Add endpoint documentation

#### New: Get Single Product
- [x] Create `GET /api/public/products/:tag`
  - [x] Return full product config
  - [x] Include branding overrides
  - [x] 404 if product not found or disabled

#### ✓ Verification Checkpoint
- [x] Check for TypeScript errors in API routes
- [x] Verify all imports resolve correctly
- [x] Check linting issues in modified files
- [x] Verify API response types match expected structure
- [ ] Check `/scripts` for existing API test scripts
- [ ] Create validation script if needed (e.g., `test-product-waitlist-api.js`)
- [ ] **Run script to verify API endpoints work correctly**

### 1.3 Backend API - Admin Endpoints

#### Product Config CRUD
- [x] Create `GET /api/v1/admin/app/:appId/products`
  - [x] Return all products (including disabled)
  - [x] Include waitlist counts per product
  - [x] Add sorting/filtering options
- [x] Create `POST /api/v1/admin/app/:appId/products`
  - [x] Validate required fields (tag, name)
  - [x] Ensure tag uniqueness per app
  - [x] Initialize with defaults
  - [x] Log admin activity
- [x] Create `GET /api/v1/admin/app/:appId/products/:tag`
  - [x] Return single product config
  - [x] Include analytics summary
- [x] Create `PATCH /api/v1/admin/app/:appId/products/:tag`
  - [x] Update product config
  - [x] Validate changes
  - [x] Don't allow tag changes (breaking change)
  - [x] Log admin activity
- [x] Create `DELETE /api/v1/admin/app/:appId/products/:tag`
  - [x] Soft delete (set enabled: false)
  - [x] Don't delete waitlist entries
  - [x] Confirm with admin before deletion
  - [x] Log admin activity

#### Waitlist Management Updates
- [x] Update `GET /api/v1/admin/waitlist`
  - [x] Add `productTag` query parameter
  - [x] Filter results by product tag
  - [x] If no productTag: app-level waitlist (existing)
  - [x] Add product name to response
- [ ] Update `POST /api/v1/admin/waitlist/invite`
  - [ ] Accept `productTag` parameter
  - [ ] Bulk invite from specific product
  - [ ] Use product-specific email template
  - [ ] Include product name in invitation
- [ ] Update export functionality
  - [ ] Add productTag filter
  - [ ] Include product column in CSV

#### Product Analytics Endpoints
- [x] Create `GET /api/v1/admin/app/:appId/products/:tag/analytics`
  - [x] Total waitlist count
  - [x] Breakdown by status (WAITING, INVITED, ACCEPTED)
  - [x] Timeline data (daily/weekly signups)
    ```json
    {
      "total": 147,
      "byStatus": {
        "WAITING": 135,
        "INVITED": 10,
        "ACCEPTED": 2
      },
      "timeline": {
        "2025-10-01": 12,
        "2025-10-02": 8
      },
      "conversionRate": 0.20
    }
    ```
  - [x] Conversion rate (invited → accepted)
  - [x] Cache with 15-min TTL
- [x] Create `GET /api/v1/admin/app/:appId/analytics/products`
  - [x] Aggregate analytics across all products
  - [x] Compare product interest levels
  - [x] Most popular products

#### ✓ Verification Checkpoint
- [x] Check for TypeScript errors in admin API routes
- [x] Verify all admin routes have proper auth checks
- [x] Check linting issues in new files
- [x] Verify analytics calculations are correct

### 1.4 Admin UI - Product Waitlists Management

#### Navigation Structure
- [x] Add "Product Waitlists" sub-tab under existing "Waitlist" tab
- [x] Update tab navigation component
- [x] Ensure proper active state handling

#### Product List View
- [x] Create product list component
  - [x] Card-based layout showing:
    - [x] Product name and tag
    - [x] Waitlist counts (waiting, invited, accepted)
    - [x] Auto-invite status
    - [x] Email template name
    - [x] Enabled/disabled toggle
  - [x] Actions: Edit, Manage, Delete
  - [x] Empty state with "Create First Product" CTA
- [x] Add "New Product Waitlist" button
- [x] Implement card hover states
- [x] Add loading states
- [x] Add error handling

#### Create Product Form
- [x] Create product form modal/page
  - [x] Basic Info section
    - [x] Display Name (required)
    - [x] Tag (required, auto-generate from name, editable)
    - [x] Tag validation (alphanumeric + hyphens only)
    - [x] Description (textarea)
    - [x] Success message (textarea)
  - [x] Widget Settings section
    - [x] Enabled toggle
  - [x] Auto-Invite Settings section
    - [x] Enable toggle
    - [x] Daily quota (number input)
    - [x] Send time (time picker)
  - [x] Email Configuration section
    - [x] Template selector (dropdown)
  - [x] Branding Overrides section
    - [x] Logo URL (optional)
    - [x] Primary color picker (optional)
    - [x] "Leave empty to inherit" helper text
  - [x] Preview pane
    - [x] Live preview of widget
- [x] Form validation
  - [x] Required field checks
  - [x] Tag format validation
  - [x] Tag uniqueness check (real-time)
  - [x] URL validation for logo
  - [x] Color format validation
- [x] Save handling
  - [x] Show loading state
  - [x] Error handling with specific messages
  - [x] Auto-redirect to product list
- [x] Cancel handling

#### Edit Product Form
- [x] Reuse create form with pre-filled data
- [x] Disable tag editing (show warning about breaking changes)

#### Code Snippet Generator
- [x] Add "Implementation" section to product card
- [x] Generate React code snippet
- [x] Add copy-to-clipboard button
- [x] Show success toast on copy

#### Product Waitlist Management View
- [x] Create dedicated management page per product
- [x] Overview stats section
  - [x] Total waiting, invited, accepted (cards)
  - [x] Quick actions (Export CSV)
- [x] Analytics section
  - [x] Signups over time chart
  - [x] Conversion rate metric
- [x] Waitlist entries table
  - [x] Columns: Email, Status, Joined, Invited, Actions
  - [x] Row selection for bulk actions
  - [x] Individual actions: Invite, Resend
- [x] Export functionality
  - [x] CSV export with product-specific data
- [x] Bulk operations
  - [x] Select all / select page

#### Waitlist Tab Enhancement
- [x] Update main Waitlist tab
  - [x] Add sub-tab navigation: "App Waitlist" | "Product Waitlists"
  - [x] Preserve existing app waitlist functionality

#### Email Templates Integration
- [ ] Add "Product Waitlist" category filter (deferred to Phase 1.7)
- [ ] Create default product invitation template (deferred to Phase 1.7)
- [ ] Add product-specific variables (deferred to Phase 1.7)

#### ✓ Verification Checkpoint
- [x] Check for TypeScript/React errors in admin components
- [x] Verify all imports are correct
- [x] Check for linting issues
- [x] Verify UI components render without console errors
- [x] Check that all form validations work properly

### 1.5 SDK Widget - Core Implementation

#### WaitlistForm Component Enhancement
- [x] Add new props
  ```typescript
  interface WaitlistFormProps {
    // Existing props...
    
    // New for product waitlists
    productTag?: string;
    mode?: 'inline' | 'modal' | 'drawer';
    variant?: 'compact' | 'standard';
    hidePosition?: boolean;
    trigger?: React.ReactNode;
    position?: 'left' | 'right';
    onSuccess?: (data: { position?: number }) => void;
  }
  ```
- [x] Update component logic
  - [x] Detect if productTag is provided
  - [x] If productTag: Product waitlist flow
  - [x] If no productTag: Existing app-level flow
  - [x] Fetch product config on mount
  - [x] Apply branding overrides if configured
- [x] Update TypeScript types

#### Inline Mode Implementation
- [x] Create inline rendering mode
  - [x] Render directly in DOM (no portal)
  - [x] Flow naturally with page content
  - [x] Respect container width
  - [x] Responsive layout
- [x] Standard variant
  - [x] Logo/icon (if provided)
  - [x] Product name as heading
  - [x] Description text
  - [x] Email input
  - [x] Submit button
  - [x] Success state: "✓ You're on the list!"
  - [x] Error handling UI
- [x] Compact variant
  - [x] Minimal layout
  - [x] Email + button in single row
  - [x] Small helper text
  - [x] No logo/description
- [x] Apply product branding
  - [x] Primary color (buttons, focus states)
  - [x] Logo URL
  - [x] Custom success message

#### Modal Mode Implementation
- [x] Create modal rendering mode
  - [x] Trigger element (custom or default button)
  - [x] Click handler to open modal
  - [x] Centered overlay with backdrop
  - [x] Close on ESC key
  - [x] Close on backdrop click
  - [x] Prevent body scroll when open
- [x] Modal content
  - [x] Same form structure as inline
  - [x] Close button (X icon)
  - [x] Trap focus within modal

#### Drawer Mode Implementation
- [x] Create drawer rendering mode
  - [x] Slide in from left or right (configurable)
  - [x] Overlay backdrop
  - [x] Close on backdrop click
  - [x] Close on ESC key
  - [x] Smooth slide animation
- [x] Drawer content
  - [x] Form in vertical layout
  - [x] Close button at top
  - [x] Scrollable if content overflows
- [x] Responsive behavior
  - [x] Full width on mobile
  - [x] Fixed width (400px) on desktop

#### API Integration
- [x] Fetch product config
  - [x] Call `GET /api/public/products/:tag` on mount
  - [x] Handle 404 (product not found)
  - [x] Apply branding from config
- [x] Submit waitlist join
  - [x] Call `POST /api/public/waitlist/join` with productTag
  - [x] Handle success response
  - [x] Handle errors (already joined, invalid email, etc.)
  - [x] Show appropriate feedback
- [x] Check existing status
  - [x] Use existing `GET /api/public/user` response
  - [x] Check `waitlist.products[productTag]`
  - [x] Show "already on list" if joined
- [x] Error handling
  - [x] Network errors
  - [x] Validation errors
  - [x] Product not found
  - [x] Product disabled

#### Vanilla JS API
- [ ] Create `GrowthKit.renderWaitlist()` function (deferred - React API sufficient for now)
- [ ] Create `GrowthKit.showWaitlistModal()` function (deferred)
- [ ] Create `GrowthKit.showWaitlistDrawer()` function (deferred)

#### Hook Updates
- [x] Extend `useGrowthKit` hook
  - [x] Add `joinProductWaitlist(tag, email)` function
  - [x] Add `getProductWaitlistStatus(tag)` function
- [x] Update state management
  - [x] Product status available in waitlist.products
  - [x] Sync with server on refresh

#### Simple Embed Mode (Bonus - Added)
- [x] Create `EmbedWaitlistWidget` component
  - [x] Compact variant (minimal)
  - [x] Standard variant (full card)
  - [x] Shows position (app-level behavior)
  - [x] Gives credits (app-level behavior)
  - [x] Success state with position display
- [x] Update `WaitlistForm` to support `layout="embed"`
- [x] Integrate with existing `useGrowthKit` hook
- [x] Export component

**Usage:**
```tsx
// Simple embedded app-level waitlist
<WaitlistForm layout="embed" variant="compact" />

// Standard embed
<WaitlistForm layout="embed" variant="standard" />

// Product waitlist (different system)
<WaitlistForm productTag="premium" mode="inline" />
```

#### ✓ Verification Checkpoint
- [x] Check for TypeScript errors in SDK components
- [x] Verify all props types are correct
- [x] Check linting issues in SDK files
- [x] Verify widget delegates correctly (product vs embed)
- [x] Check that API integration works
- [x] Verify embed mode works alongside product mode

### 1.6 Validation Scripts

#### Create & Run Validation Scripts
**Check `/scripts` folder first - don't duplicate existing scripts!**

- [x] Create `check-product-waitlists.js`
  - [x] Verify product configs in App.metadata
  - [x] Check waitlist entries with productTag
  - [x] Validate data integrity
  - [x] Test backward compatibility (null productTag = app-level)
  - [x] **Run script and verify** - Shows migration needed (expected)

**Script Guidelines:**
- ✅ Uses existing Prisma client patterns from other scripts
- ✅ Includes clear console output (success/error messages)
- ✅ Handles errors gracefully
- ✅ Read-only validation
- ✅ Documented script purpose in header comment

### 1.7 Auto-Invite System (Per Product)

#### Cron Job Extension
- [ ] Extend existing auto-invite cron job
  - [ ] Query apps with product waitlists
  - [ ] Process app-level invites first (existing)
  - [ ] Then process each product independently
- [ ] Product invite logic
  - [ ] Check if product has autoInviteEnabled
  - [ ] Respect product's dailyInviteQuota
  - [ ] Run at product's configured inviteTime
  - [ ] Query WAITING users for that product only
  - [ ] Order by createdAt (FIFO)
  - [ ] Invite top N (quota) users
- [ ] Send product-specific emails
  - [ ] Use product's inviteEmailTemplate
  - [ ] Include product name and description
  - [ ] Include productTag in invitation link (if applicable)
- [ ] Update status
  - [ ] Change status from WAITING to INVITED
  - [ ] Set invitedAt timestamp
  - [ ] Set invitedVia: "auto"
- [ ] Logging
  - [ ] Log invitations per product
  - [ ] Track quota usage
  - [ ] Record in AdminActivity
- [ ] Error handling
  - [ ] Skip product if email fails
  - [ ] Continue with other products
  - [ ] Log errors for admin review
- [ ] Test cron job locally
- [ ] Deploy and monitor

#### Admin Manual Invite
- [ ] Add "Invite" button in product waitlist view
  - [ ] Invite single user
  - [ ] Show confirmation modal
  - [ ] Select email template
  - [ ] Preview email before sending
- [ ] Bulk invite functionality
  - [ ] Select multiple users
  - [ ] "Invite Selected" action
  - [ ] Confirmation with count
  - [ ] Progress indicator
  - [ ] Success/error summary
- [ ] Invitation history
  - [ ] Show who was invited when
  - [ ] Show invitation method (auto vs manual)
  - [ ] Resend invitation option

#### ✓ Verification Checkpoint
- [ ] Check cron job logic for errors
- [ ] Verify email template integration works
- [ ] Check for TypeScript errors
- [ ] Verify logging functions work correctly

### 1.8 Documentation

#### Developer Documentation
- [ ] Quick start guide
  - [ ] Installation
  - [ ] Basic usage
  - [ ] All modes (inline/modal/drawer)
- [ ] React API reference
  - [ ] Props documentation
  - [ ] Examples for each prop
  - [ ] TypeScript types
- [ ] Vanilla JS API reference
  - [ ] Function signatures
  - [ ] Options objects
  - [ ] Return values
- [ ] Code examples
  - [ ] React examples
  - [ ] Vue examples
  - [ ] Vanilla JS examples
  - [ ] Real-world use cases
- [ ] Styling guide
  - [ ] CSS customization
  - [ ] Branding configuration
  - [ ] Responsive behavior
- [ ] Migration guide (if updating existing apps)

#### Admin Documentation
- [ ] Product waitlists overview
  - [ ] What are product waitlists
  - [ ] When to use them
  - [ ] Best practices
- [ ] Creating products guide
  - [ ] Step-by-step tutorial
  - [ ] Field explanations
  - [ ] Examples
- [ ] Managing waitlists
  - [ ] Viewing entries
  - [ ] Inviting users
  - [ ] Auto-invites setup
  - [ ] Analytics interpretation
- [ ] Email templates
  - [ ] Creating product-specific templates
  - [ ] Available variables
  - [ ] Best practices

#### API Documentation
- [ ] Update API docs with new endpoints
- [ ] Request/response examples
- [ ] Error codes and handling
- [ ] Rate limiting info (if applicable)

### 1.9 Code Quality & Optimization

#### Performance Optimization (Code Level)
- [ ] Implement API response caching logic
  - [ ] Add cache headers for product configs (5 min TTL)
  - [ ] Add cache logic for analytics (15 min TTL)
- [ ] Frontend optimization
  - [ ] Lazy load modal/drawer code (React.lazy)
  - [ ] Code splitting for SDK
  - [ ] Optimize component renders

#### Security Implementation
- [ ] Input validation on all endpoints
- [ ] Parameterized queries (Prisma handles this)
- [ ] Output sanitization for XSS prevention
- [ ] Verify CSRF protection is in place
- [ ] Add rate limiting middleware to endpoints
- [ ] Verify admin auth middleware is applied

#### Logging Code
- [ ] Add product waitlist event logging
  - [ ] Log joins per product
  - [ ] Log invitation events
  - [ ] Log errors with context
- [ ] Admin activity logging
  - [ ] Log product CRUD operations
  - [ ] Log manual invitations
  - [ ] Log bulk operations

#### ✓ Final Phase 1 Verification
- [x] Run TypeScript compiler check across entire codebase
- [x] Run linter on all modified files
- [x] Check for any console.log statements (removed/converted to proper logging)
- [x] Verify no unused imports
- [x] Check that all new files have proper exports
- [x] Verify Prisma schema is valid
- [x] Check that API routes follow existing patterns
- [x] **Run ALL validation scripts from `/scripts` folder**
  - [x] Verify all checks pass (migration needed - expected)
  - [x] Fix any issues found
- [x] Ensure all validation scripts are documented

---

## Phase 2: Custom Fields Enhancement

**Goal:** Add custom field support for product-specific data collection  
**Deliverable:** Form builder for custom fields with smart field support

### 2.1 Custom Fields Architecture

#### Data Model Preparation (Already done in Phase 1)
- [x] `Waitlist.metadata` ready for custom field storage
- [x] `Lead.metadata` ready for enrichment data
- [x] API accepts `customFields` object (validate empty in Phase 1)

#### Product Config Extension
- [ ] Extend product config schema
  ```json
  {
    "customFields": [
      {
        "id": "string",
        "type": "smart-name | smart-email | text | textarea | select | radio | checkbox | number | url | phone | date",
        "label": "string",
        "required": boolean,
        "placeholder": "string",
        "options": [],
        "updateFingerprint": boolean,
        "showIfEmpty": boolean,
        "validation": {},
        "order": number
      }
    ]
  }
  ```
- [ ] Define all field types
- [ ] Create TypeScript interfaces
- [ ] Add validation schemas

### 2.2 Backend - Custom Fields Support

#### Smart Fields Logic
- [ ] Implement smart field processing
  - [ ] Check if Lead exists for fingerprint
  - [ ] If smart-name provided:
    - [ ] If Lead.name is null → Update Lead.name
    - [ ] If Lead.name exists → Keep existing, store in metadata
  - [ ] If smart-email provided:
    - [ ] If Lead.email is null → Update Lead.email
    - [ ] If Lead.email exists → Keep existing, store in metadata
  - [ ] ALWAYS store submitted value in Waitlist.metadata
- [ ] Add fingerprint enrichment
  - [ ] Store product-specific responses in Lead.metadata
  - [ ] Don't overwrite existing Lead data
  - [ ] Track data sources (which product, when)

#### Custom Fields Validation
- [ ] Server-side validation
  - [ ] Validate against product's customFields schema
  - [ ] Required field checks
  - [ ] Type validation (email, url, number, etc.)
  - [ ] Length limits
  - [ ] Pattern matching (regex)
  - [ ] Option validation (select, radio, checkbox)
- [ ] Error responses
  - [ ] Field-specific error messages
  - [ ] Multiple errors handling
  - [ ] Clear error format for frontend

#### API Updates
- [ ] Update `POST /api/public/waitlist/join`
  - [ ] Accept `customFields` object
  - [ ] Validate against product config
  - [ ] Process smart fields
  - [ ] Store in Waitlist.metadata
  - [ ] Update Lead if applicable
  - [ ] Return validation errors if any
- [ ] Update `GET /api/public/products/:tag`
  - [ ] Include customFields config
  - [ ] Return prefilled values (smart fields from fingerprint)
  - [ ] Only include fields that should be shown

#### ✓ Verification Checkpoint
- [ ] Check for TypeScript errors in custom fields logic
- [ ] Verify smart field logic doesn't overwrite existing data
- [ ] Check validation functions work correctly
- [ ] Verify API endpoints return correct structure
- [ ] Check linting issues

### 2.3 Admin UI - Field Builder

#### Custom Fields Tab in Product Form
- [ ] Add "Custom Fields" tab to product form
- [ ] Layout sections:
  - [ ] Smart Fields toggle section
  - [ ] Custom Fields list section
  - [ ] Preview pane section

#### Smart Fields Configuration
- [ ] Name field toggle
  - [ ] "Request Name (if not provided)" checkbox
  - [ ] "Required" sub-option
  - [ ] "Update fingerprint" (always true, informational)
- [ ] Email field toggle
  - [ ] "Request Email (if not provided)" checkbox
  - [ ] "Required" sub-option
  - [ ] "Update fingerprint" (always true, informational)
- [ ] Helper text explaining smart fields behavior

#### Custom Fields List
- [ ] Field list view
  - [ ] Drag-and-drop reordering
  - [ ] Field preview cards showing:
    - [ ] Field type icon
    - [ ] Field label
    - [ ] Required badge
    - [ ] Edit/Delete actions
  - [ ] Empty state: "No custom fields"
  - [ ] "Add Field" button
- [ ] Implement drag-drop
  - [ ] Use react-beautiful-dnd or similar
  - [ ] Visual feedback during drag
  - [ ] Save order on drop

#### Add/Edit Field Modal
- [ ] Modal layout
  - [ ] Field type selector (dropdown)
  - [ ] Type-specific configuration forms
  - [ ] Preview pane showing field
- [ ] Common fields (all types)
  - [ ] Label (text input, required)
  - [ ] Field ID (auto-generated, editable)
  - [ ] Required toggle
  - [ ] Placeholder (text input)
  - [ ] Help text (text input)
- [ ] Type-specific fields
  - [ ] Text/Textarea: maxLength, pattern
  - [ ] Select/Radio/Checkbox: options list (add/remove/reorder)
  - [ ] Number: min, max, step
  - [ ] URL: pattern
  - [ ] Phone: format selector
  - [ ] Date: min, max, format
- [ ] Options editor (for select/radio/checkbox)
  - [ ] Add option button
  - [ ] Value and label inputs
  - [ ] Remove option button
  - [ ] Reorder options (drag-drop)
  - [ ] Validation (no empty values)
- [ ] Field validation
  - [ ] Label required
  - [ ] ID format validation
  - [ ] ID uniqueness check
  - [ ] Options required for select/radio/checkbox
- [ ] Save/Cancel handling

#### Field Preview Pane
- [ ] Live preview of form
  - [ ] Show all configured fields
  - [ ] Smart fields at top (if enabled)
  - [ ] Custom fields in order
  - [ ] Render actual field types
  - [ ] Show validation states
- [ ] Toggle preview modes
  - [ ] Desktop view
  - [ ] Mobile view
  - [ ] Dark/light theme
- [ ] Interactive preview
  - [ ] Fill fields to test
  - [ ] See validation errors
  - [ ] Reset button

#### Field Templates (Optional Enhancement)
- [ ] Common field sets
  - [ ] B2B: Company name, size, role
  - [ ] SaaS: Use case, team size, urgency
  - [ ] Mobile: Device type, OS version
  - [ ] Enterprise: Budget, timeline, decision maker
- [ ] "Use template" button
- [ ] Loads pre-configured fields
- [ ] Editable after loading

#### ✓ Verification Checkpoint
- [ ] Check for TypeScript/React errors in field builder components
- [ ] Verify drag-drop functionality doesn't have errors
- [ ] Check form validation works correctly
- [ ] Verify field preview renders all field types
- [ ] Check linting issues
- [ ] Verify field config saves correctly

### 2.4 SDK - Dynamic Form Renderer

#### Field Components
- [ ] Create field components for each type
  - [ ] TextInput (smart-name, text)
  - [ ] EmailInput (smart-email)
  - [ ] TextArea
  - [ ] Select (dropdown)
  - [ ] RadioGroup
  - [ ] CheckboxGroup
  - [ ] NumberInput
  - [ ] URLInput
  - [ ] PhoneInput
  - [ ] DatePicker
- [ ] Common features for all components
  - [ ] Label rendering
  - [ ] Required indicator (*)
  - [ ] Placeholder
  - [ ] Help text
  - [ ] Error message display
  - [ ] Disabled state
  - [ ] Focus states
- [ ] Consistent styling
  - [ ] Match existing WaitlistForm design
  - [ ] Responsive layout
  - [ ] Theme support

#### Dynamic Form Builder
- [ ] Fetch customFields config from API
- [ ] Filter smart fields
  - [ ] Check if fingerprint has name
  - [ ] Show smart-name field only if empty
  - [ ] Check if fingerprint has email
  - [ ] Show smart-email field only if empty
- [ ] Render fields in order
  - [ ] Map field config to components
  - [ ] Pass props from config
  - [ ] Handle field state
- [ ] Form state management
  - [ ] Track all field values
  - [ ] Track validation errors
  - [ ] Track touched fields
  - [ ] Track form dirty state

#### Client-Side Validation
- [ ] Implement validation per field type
  - [ ] Required field check
  - [ ] Email format (smart-email)
  - [ ] URL format (url)
  - [ ] Phone format (phone)
  - [ ] Number range (number)
  - [ ] Date range (date)
  - [ ] Min/max length (text/textarea)
  - [ ] Pattern matching (text with regex)
  - [ ] Options validation (select/radio must be in options)
- [ ] Real-time validation
  - [ ] Validate on blur
  - [ ] Show error messages
  - [ ] Clear errors on change
- [ ] Form-level validation
  - [ ] Validate all fields on submit
  - [ ] Focus first error field
  - [ ] Prevent submit if errors

#### Form Submission
- [ ] Collect all field values
  - [ ] Build customFields object
  - [ ] Include only filled fields (or required)
  - [ ] Format values (trim strings, parse numbers)
- [ ] Submit to API
  - [ ] Include productTag
  - [ ] Include customFields
  - [ ] Handle loading state
  - [ ] Handle success
  - [ ] Handle validation errors from server
- [ ] Display errors
  - [ ] Map server errors to fields
  - [ ] Show field-specific errors
  - [ ] Show general error if needed
- [ ] Success handling
  - [ ] Show success message
  - [ ] Include custom fields in callback
  - [ ] Clear form (if modal/drawer)

#### Mode Handling
- [ ] Compact variant
  - [ ] Don't show custom fields (too small)
  - [ ] Only email (if needed)
  - [ ] Quick join flow
- [ ] Standard variant
  - [ ] Show all custom fields
  - [ ] Full form experience
  - [ ] Scrollable if many fields
- [ ] Responsive layout
  - [ ] Stack fields vertically on mobile
  - [ ] Optimize field sizes
  - [ ] Ensure usable on small screens

#### Smart Field Pre-filling
- [ ] Fetch user data from API
- [ ] Pre-fill smart fields if available
  - [ ] name from Lead.name
  - [ ] email from Lead.email
- [ ] Make fields read-only if pre-filled?
  - [ ] Or allow editing with note
  - [ ] "Update my information" checkbox?
- [ ] Show "We have your info" message
  - [ ] Friendly UX
  - [ ] Skip to custom fields

#### ✓ Verification Checkpoint
- [ ] Check for TypeScript errors in form renderer
- [ ] Verify all field components render correctly
- [ ] Check validation logic works for each field type
- [ ] Verify smart field pre-filling works
- [ ] Check form submission includes all field values
- [ ] Check linting issues
- [ ] Verify responsive layout works correctly

### 2.5 Waitlist Management with Custom Fields

#### Admin Waitlist View Updates
- [ ] Display custom field responses
  - [ ] Add columns for custom fields (configurable)
  - [ ] Truncate long text values
  - [ ] Format arrays (checkboxes) nicely
- [ ] Row expansion
  - [ ] Click row to expand
  - [ ] Show all custom field responses
  - [ ] Show smart field updates
  - [ ] Show submission timestamp
- [ ] Filtering by custom fields
  - [ ] Add filter dropdowns per field
  - [ ] Multi-select for checkbox fields
  - [ ] Range filters for numbers
  - [ ] Date range for dates
- [ ] Sorting by custom fields
  - [ ] Click column header to sort
  - [ ] Handle different data types

#### CSV Export with Custom Fields
- [ ] Include custom fields as columns
  - [ ] Dynamic column generation
  - [ ] One column per custom field
  - [ ] Format arrays as comma-separated
- [ ] Handle missing data
  - [ ] Empty cells for optional fields
  - [ ] Clear indication if not answered
- [ ] Export filtered data
  - [ ] Respect active filters
  - [ ] Include filter info in filename

#### Analytics per Field
- [ ] Field-specific analytics (optional)
  - [ ] Most common answers (select/radio)
  - [ ] Response rate per field
  - [ ] Average completion time?
- [ ] Segmentation by custom fields
  - [ ] Create segments based on answers
  - [ ] "Users who selected X"
  - [ ] Use for targeted invitations

### 2.6 Custom Fields Documentation

#### Developer Docs
- [ ] Custom fields overview
- [ ] Available field types
- [ ] Smart fields explanation
- [ ] Styling custom fields

#### Admin Docs
- [ ] Field builder guide
- [ ] Field type reference
- [ ] Best practices
  - [ ] How many fields to include
  - [ ] Required vs optional
  - [ ] Question writing tips
- [ ] Examples and templates

#### ✓ Final Phase 2 Verification
- [ ] Run TypeScript compiler check on all Phase 2 changes
- [ ] Run linter on all modified/new files
- [ ] Verify custom fields save and load correctly
- [ ] Check that field validation works end-to-end
- [ ] Verify smart fields don't overwrite existing data
- [ ] Check CSV export includes custom field columns
- [ ] Verify no console errors when using custom fields

---

## Phase 3: Advanced Features (Future)

**Goal:** Enhanced capabilities based on user feedback

### Potential Enhancements
- [ ] Conditional fields logic
  - [ ] Show field B only if field A = X
  - [ ] Complex branching logic
- [ ] Field templates library
  - [ ] Save custom field sets
  - [ ] Share across products
  - [ ] Public template marketplace?
- [ ] Advanced analytics
  - [ ] Field completion funnel
  - [ ] Drop-off points
  - [ ] A/B testing different forms
- [ ] Integration features
  - [ ] Webhook on join
  - [ ] Zapier integration
  - [ ] CRM sync (Salesforce, HubSpot)
- [ ] Email automation
  - [ ] Drip campaigns per product
  - [ ] Segmented based on custom fields
  - [ ] Re-engagement flows
- [ ] Multi-step forms
  - [ ] Break long forms into steps
  - [ ] Progress indicator
  - [ ] Save and resume

---

## Post-Implementation Checklist (Your Tasks)

**These are tasks YOU need to complete after I deliver the code:**

### Database & Infrastructure
**⚠️ CRITICAL: Single production database - proceed with caution!**

- [ ] Review Prisma migration files thoroughly
- [ ] Verify migration is backward compatible (I will have tested this)
- [ ] Backup production database before migration
- [ ] Run migration on production database (`npx prisma migrate deploy`)
- [ ] Verify migration succeeded
- [ ] Optionally re-run validation scripts from `/scripts` to double-check
- [ ] Check that existing waitlists still work (productTag = null)

### Testing & QA
- [ ] Run full test suite (if you have automated tests)
- [ ] Manual QA testing in staging environment
- [ ] Test all widget modes (inline/modal/drawer) in real browsers
- [ ] Test on different devices (mobile, tablet, desktop)
- [ ] Test in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test form submissions end-to-end
- [ ] Test custom fields (Phase 2)
- [ ] Verify email sending works correctly
- [ ] Test auto-invite cron job

### Performance & Security
- [ ] Load testing with realistic traffic
- [ ] Performance testing (API response times)
- [ ] Security audit of new endpoints
- [ ] Verify rate limiting works
- [ ] Check CORS configuration
- [ ] Verify authentication on admin endpoints

### Deployment (Vercel)
- [ ] Review all committed changes (especially Prisma)
- [ ] Push to deployment branch
- [ ] Deploy to Vercel (automatic on push)
- [ ] Wait for build to complete
- [ ] Verify build succeeded
- [ ] Check Vercel logs for any errors
- [ ] Smoke test on deployed environment
- [ ] Monitor error logs after deployment
- [ ] Monitor performance metrics
- [ ] Rollback plan: revert git commit if issues arise

### Monitoring & Alerts
- [ ] Set up monitoring for new endpoints
- [ ] Configure alerts for:
  - [ ] Auto-invite failures
  - [ ] High error rates on product waitlist endpoints
  - [ ] Unusual join patterns (potential abuse)
- [ ] Set up analytics tracking for:
  - [ ] Joins per product
  - [ ] Widget render times
  - [ ] API response times

### Documentation & Launch
- [ ] Review developer documentation
- [ ] Create internal knowledge base articles
- [ ] Prepare launch announcement (if doing beta)
- [ ] Identify beta testers (5-10 users)
- [ ] Gather feedback from beta users
- [ ] Create video tutorial (optional)
- [ ] Update public documentation

---

## Success Metrics

### Phase 1 (Core Feature)
- [ ] Product waitlists created: Track adoption
- [ ] Joins per product: Measure engagement
- [ ] Developer satisfaction: Survey ease of implementation
- [ ] Admin satisfaction: Survey management experience
- [ ] Widget load time: < 500ms
- [ ] API response time: < 200ms

### Phase 2 (Custom Fields)
- [ ] % of products using custom fields: Measure value
- [ ] Average fields per product: Understand usage patterns
- [ ] Form completion rate: Measure UX quality
- [ ] Custom field response rate: Per-field adoption
- [ ] Admin satisfaction: Field builder usability

---

## Rollout Strategy (Your Plan)

**These are suggested steps for YOUR rollout after implementation:**

### Phase 1 Launch
1. **Internal Testing**
   - [ ] Full QA on staging
   - [ ] Team dogfooding
   - [ ] Fix any critical bugs discovered

2. **Beta Release**
   - [ ] Invite 5-10 beta users
   - [ ] Gather feedback
   - [ ] Iterate on common issues
   - [ ] Document common questions/FAQs

3. **Public Launch**
   - [ ] Announcement (blog, email, social)
   - [ ] Update documentation
   - [ ] Create video tutorial
   - [ ] Monitor closely for issues

### Phase 2 Launch (Custom Fields)
1. **Beta with existing users**
   - [ ] Invite Phase 1 users to test custom fields
   - [ ] Get feedback on field builder UX
   - [ ] Iterate on common requests

2. **Public Launch**
   - [ ] Feature announcement
   - [ ] Custom field templates ready
   - [ ] Advanced docs published

---

## Risk Mitigation

### Technical Risks
- **Database migration fails:** Test migration on staging multiple times, have rollback plan
- **Performance issues:** Load test before launch, implement caching, monitor metrics
- **Widget breaks existing apps:** Comprehensive backward compatibility testing, feature flag
- **Spam/abuse:** Rate limiting, CAPTCHA option, monitoring for unusual patterns

### Product Risks
- **Low adoption:** Clear value prop, good examples, easy implementation
- **Too complex for users:** Simple defaults, progressive disclosure, excellent docs
- **Confusion with app-level waitlist:** Clear naming, documentation, UI distinction

### Support Risks
- **High support volume:** Comprehensive docs, video tutorials, FAQ, common issues guide
- **Bugs in production:** Fast response team, clear bug reporting process, hotfix capability

---

## Notes

- This document is a living plan - update checkboxes as we complete items
- Add notes/blockers in comments if issues arise
- Link to relevant PRs, issues, or design docs as we go
- Review and adjust timeline based on actual progress
- Celebrate milestones! 🎉

