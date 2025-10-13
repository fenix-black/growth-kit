# Changelog

All notable changes to the GrowthKit SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.8] - 2025-10-12

### Added
- **Smart Adaptive Timestamps**: Intelligent auto-refresh system that adapts to message age
  - Recent messages (< 1min): Update every 4-6 seconds
  - Mid-age messages (1-5min): Update every 8-12 seconds
  - Older messages (> 5min): Update every 12-18 seconds
  - ±20% randomness for natural, organic feel
- **Hybrid Timestamp Format**: Smart display that adapts to message age:
  - "just now" (< 5 seconds)
  - "12s ago" (5-59 seconds)
  - "3m ago" (1-4 minutes)
  - "14:35" (≥ 5 minutes - absolute time in user's timezone)

### Changed
- Replaced verbose timestamps with compact format (e.g., "20s ago" instead of "less than 20 seconds ago")
- Implemented hybrid smart + random refresh algorithm for optimal performance and UX
- Custom `formatRelativeTime` function for precise, compact time display

### Performance
- Reduces unnecessary updates as conversation ages
- More efficient CPU usage compared to fixed-interval updates
- Automatic cleanup prevents memory leaks

## [0.9.7] - 2025-10-12

### Added
- **Table Styling**: Properly formatted markdown tables with visible borders, headers, and hover effects
- Table features:
  - Gray header background with bold text
  - Visible borders and cell padding
  - Row hover effect for better readability
  - Responsive design with proper spacing

### Changed
- Enhanced CSS styling for tables in chat messages
- Improved visual hierarchy for markdown content

## [0.9.6] - 2025-10-12

### Added
- **Message Timestamps**: All messages now display relative timestamps (e.g., "2 minutes ago", "just now")
- **Sender Labels**: Messages show sender information:
  - User messages: "• You"
  - Human agent messages: "• Human"
  - Bot messages: No label (default)
- Custom `formatRelativeTime` utility for human-readable timestamps without external dependencies

### Changed
- Restructured message bubble layout to accommodate timestamp and sender label
- Timestamp colors adapt to message type:
  - User messages: Light blue timestamps
  - Human messages: Green timestamps
  - Bot messages: Gray timestamps

## [0.9.5] - 2025-10-12

### Added
- **Visual Distinction for Human Messages**: Messages sent by human agents during "Take Over" now display with a light green background and green border
- Added metadata support to Message interface to track message source
- Human messages use `#d1fae5` background with `#6ee7b7` border (similar to admin interface)

### Changed
- Updated polling endpoint to include message metadata
- ChatMessages component now renders different colors based on message source:
  - User messages: Blue background (unchanged)
  - Bot messages: White background (unchanged)
  - Human agent messages: Light green background with green border (new)

## [0.9.4] - 2025-10-12

### Fixed
- **Duplicate Messages**: Fixed issue where user and bot messages appeared twice in chat window
- Added intelligent message filtering: user messages shown instantly (optimistic), bot messages via polling
- Message deduplication prevents any duplicates from appearing

### Changed
- **Optimized UX**: User messages now appear instantly for immediate feedback
- Bot responses fetched via polling (max 2 second delay)
- Polling now skips user role messages to prevent duplicates
- Error handling: failed messages are removed and error shown

### Improved
- Best of both worlds: instant user feedback + reliable bot responses
- No duplicate messages while maintaining responsive feel

## [0.9.3] - 2025-10-12

### Fixed
- **Human Handoff Message Display**: Fixed critical bug where messages sent by human agents during "Take Over" were not appearing in the user's chat window
- Corrected polling response handling in ChatPanel - now properly accesses `response.messages` array instead of treating response as direct array
- Human agent messages now display correctly in real-time via polling mechanism

## [0.9.2] - 2025-10-12

### Added
- **📝 Markdown Rendering in Chat Widget**: Messages now support full markdown formatting including:
  - **Bold**, *italic*, and ***bold italic*** text
  - `inline code` and code blocks
  - Bullet and numbered lists (both ordered and unordered)
  - Headings (H1-H6)
  - Links with proper styling
  - Blockquotes
  - Horizontal rules
- Improved chat message styling with proper spacing and typography
- Enhanced code block rendering with monospace fonts and background highlighting

### Changed
- Chat messages now render markdown instead of plain text
- Updated message styling to better handle formatted content

### Dependencies
- Added `marked` (v11.1.0) for markdown parsing and rendering

## [0.9.1] - 2025-10-12

### Added
- **💬 Chat Mode - Complete AI Chat System**:
  - New `ChatWidget` component for AI-powered conversations
  - `ChatFloatingButton` with position awareness and credit display
  - `ChatPanel` with dynamic height and responsive design
  - `ChatMessages` with auto-scroll and typing indicators
  - `ChatInput` with auto-resize textarea
  - All chat components exported from main package
  
- **🤖 Chat API Methods**:
  - `sendChatMessage(sessionId, message)` - Send message, get AI response
  - `pollChatMessages(sessionId, since?)` - Poll for new messages (HTTP-based)
  - Full integration with existing GrowthKit API and auth system
  
- **✨ Chat Features**:
  - RAG-powered responses using knowledge base
  - Calendar booking capability with LLM function calling
  - Human handoff support for seamless AI → Human transitions
  - HTTP polling architecture (Vercel-compatible, no WebSocket)
  - Position-aware widget inheriting existing positioning settings
  - Dynamic panel sizing based on screen height
  - Mobile-responsive design
  - Credit consumption integration (1 credit simple, 2 credits with RAG)

### Changed
- Widget mode detection: Automatically switches between waitlist and chat modes
- Enhanced API client with chat-specific endpoints
- Component exports expanded to include all chat components

## [0.9.0] - 2025-10-11

### Changed
- Version bump to 0.9.0 (clean slate after reverting experimental auto-update features)
- Stable release based on proven 0.8.0 codebase
- All features from 0.8.0 included (multi-fingerprint system, token management, image/video sharing)

### Note
- Versions 0.8.1-0.8.7 contained experimental auto-update features that were reverted
- This release returns to the stable 0.8.0 base with version bumped for npm compatibility
- Auto-update feature deferred for future implementation with better architecture

## [0.7.1] - 2025-10-09

### Fixed
- **🔄 Resilient Token Management**: Enhanced authentication reliability for client-side widgets
  - Infinite retry with exponential backoff for token acquisition (never gives up)
  - 3-attempt retry for credit-consuming actions with clean error handling
  - Proactive token refresh before expiry (80% of lifetime)
  - Network errors now return `temporarily_unavailable` instead of technical failures
  - Credit integrity protection - no more free services during connectivity issues

## [0.7.0] - 2025-10-08

### Added
- **🎉 Share Images & Videos**: Major enhancement to `share()` method supporting locally generated images and videos
  - Share Blob objects from Canvas (`canvas.toBlob()`)
  - Share File objects directly
  - Share videos from MediaRecorder or other sources
  - Support for multiple files in a single share
  - Custom filename support via optional `filenames` array
  - Auto-generated filenames based on MIME type and timestamp
  - Smart fallback: Downloads files when native share unavailable
  - Enhanced error handling (AbortError, NotAllowedError, DataError)
  - **Referral link included by default** in all shares
  - Supports common formats: PNG, JPEG, GIF, WebP, SVG, MP4, WebM, OGG, MOV
- Comprehensive documentation with real-world examples (AI generators, meme makers, video editors)
- Browser compatibility table for file sharing

### Changed
- `ShareOptions` interface now includes:
  - `files?: (File | Blob)[]` - Array of files to share
  - `filenames?: string[]` - Optional custom filenames
  - `url` now defaults to referral link (can be overridden)
- Enhanced `share()` method with `navigator.canShare()` check for better file compatibility
- Improved fallback strategy: Downloads files + copies message to clipboard when native share unavailable

### Technical
- Added helper functions: `getExtensionFromMimeType`, `blobToFile`, `downloadFile`
- Better debugging logs for file sharing in debug mode
- Type-safe implementation with proper File/Blob handling

## [0.6.14] - 2025-10-07

### Added
- **Public Complete Endpoint**: Added `/api/public/complete` endpoint for `completeAction` method when using public key authentication

### Fixed
- **completeAction with Public Key**: `completeAction` method now correctly uses `/public/complete` endpoint when SDK is in public key mode
- **completeAction Request Body**: Optimized `completeAction` to exclude fingerprint from request body in public mode (fingerprint is already in JWT token)

### Changed
- Enhanced endpoint transformation mapping to include `/v1/complete` → `/public/complete`

## [0.6.13] - 2025-10-07

### Fixed
- **Default API URL**: `GrowthKitProvider` now properly defaults `apiUrl` to `https://growth.fenixblack.ai/api` when using `publicKey` mode without explicitly setting `apiUrl`. This fixes issues where widgets like `ProductWaitlistWidget` would fail to make API calls due to missing API URL configuration.

### Changed
- Normalized config at provider level to ensure all child components receive correct defaults

## [0.6.4 - 0.6.12] - 2025-09-26 to 2025-10-06

### Added
- **Comprehensive Localization System**: Full internationalization support with English (en) and Spanish (es)
  - Translation hooks (`useTranslation`, `useLocalization`)
  - Language detection from browser settings
  - Language persistence across sessions
  - Animated language switcher component
- **Enhanced Theme System**: Auto-detection based on system preferences (light/dark/auto modes)
- **Language-Aware API**: Browser language tracking in fingerprints and context
- **Improved Language Synchronization**: Better handling of language state updates and prop changes

### Changed
- Enhanced `useGrowthKit` hook with improved language refresh handling
- Optimized build process and package structure
- Better state management for language and theme preferences

### Fixed
- Language state synchronization issues
- Theme detection edge cases
- Various localization-related bugs

## [0.6.3 and Earlier]

See git history for changes in versions prior to 0.6.4.
