# Changelog

All notable changes to the GrowthKit SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
