# Changelog

All notable changes to the GrowthKit SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2025-10-11

### Added
- **🔐 Multi-Fingerprint System**: Enhanced user identification with 4-tier fingerprinting for shared accounts
  - Primary: FingerprintJS (most unique, uses canvas, WebGL, audio, fonts)
  - Secondary: Canvas fingerprint (custom canvas rendering hash)
  - Tertiary: Browser signature (screen + navigator + timezone + WebGL)
  - Fallback: Server-side fingerprint (IP + headers + screen resolution)
- **Priority-based Matching**: Tries fingerprints in order of uniqueness to avoid false positives
- **Cross-Domain Account Linking**: Reliably matches users across different app domains
- **Automatic Fingerprint Migration**: Updates fingerprints when methods drift over time
- **getAllFingerprints()**: New export for advanced use cases needing all fingerprint values

### Changed
- `useGrowthKit` now generates all fingerprint methods automatically
- Token requests include all fingerprint values for enhanced matching
- Fingerprint version bumped to v4 (auto-clears old incompatible formats)

### Fixed
- **Domain-Independent Matching**: Shared accounts now work reliably across different domains
- **Fingerprint Drift Handling**: System automatically updates fingerprints when client values change
- **False Positive Prevention**: Priority-based matching prevents linking different users in same household
- **localStorage Migration**: Version checking auto-clears incompatible old fingerprints

### Technical
- New `additionalFingerprints.ts` module for canvas and browser signature generation
- Enhanced server-side fingerprint includes screen resolution and viewport
- All fingerprint methods cached in-memory for session performance
- Backend uses cascading fallback queries for maximum reliability

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
