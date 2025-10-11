# Share Images & Videos Feature

## Overview

Enhanced the GrowthKit SDK's `share()` method to support sharing locally generated images and videos (as Blobs or Files) along with the referral link. This enables powerful viral loops where users can share what they created with your app.

## Implementation Summary

### Files Modified

1. **`sdk/src/types.ts`**
   - Extended `ShareOptions` interface to support:
     - `files?: (File | Blob)[]` - Array of files/blobs to share
     - `filenames?: string[]` - Optional custom filenames

2. **`sdk/src/useGrowthKit.ts`**
   - Added helper functions:
     - `getExtensionFromMimeType()` - Maps MIME types to file extensions
     - `blobToFile()` - Converts Blobs to File objects with proper names
     - `downloadFile()` - Triggers file download as fallback
   - Enhanced `share()` method with:
     - File/Blob processing and conversion
     - Native share API with `navigator.canShare()` check
     - Smart fallback strategy (download + clipboard)
     - Enhanced error handling (AbortError, NotAllowedError, DataError)
     - **Referral link included by default**

3. **`sdk/README.md`**
   - Added comprehensive "Sharing with Images & Videos" section with:
     - Basic usage examples
     - Canvas image sharing
     - Video sharing with MediaRecorder
     - Multiple files support
     - ShareOptions reference
     - Best practices
     - Real-world examples (AI generator, meme maker, video editor)
     - Browser compatibility table
   - Updated Table of Contents

4. **`sdk/CHANGELOG.md`**
   - Added version 0.7.0 release notes with full feature description

## Key Features

✅ **Native Share API**: Uses device's native sharing (WhatsApp, Instagram, etc.)
✅ **Blob Support**: Share images/videos from Canvas, MediaRecorder, etc.
✅ **File Support**: Share File objects directly
✅ **Auto-filenames**: Generates filenames from MIME type + timestamp
✅ **Custom Names**: Optional custom filenames via `filenames` array
✅ **Smart Fallbacks**: Downloads files when native share unavailable
✅ **Referral Link**: Always included by default in shares
✅ **Multiple Files**: Share multiple images/videos at once
✅ **Error Handling**: Graceful handling of share cancellation and errors

## API Changes

### Before
```typescript
share({
  title?: string;
  text?: string;
  url?: string;
})
```

### After (Backward Compatible)
```typescript
share({
  title?: string;
  text?: string;
  url?: string;              // Now defaults to referral link
  files?: (File | Blob)[];   // NEW: Share images/videos
  filenames?: string[];      // NEW: Custom filenames (optional)
})
```

## Usage Examples

### Basic Text Share (Same as before)
```typescript
gk.share(); // Still works!
```

### Share Canvas Image
```typescript
canvas.toBlob((blob) => {
  gk.share({
    title: 'My Creation',
    text: 'Made with MyApp!',
    files: [blob],
    filenames: ['my-creation.png']
  });
}, 'image/png');
```

### Share Video
```typescript
const videoBlob = await recordVideo();
gk.share({
  title: 'My Video',
  files: [videoBlob],
  filenames: ['video.webm']
});
```

### Share Multiple Files
```typescript
gk.share({
  title: 'My Gallery',
  files: [image1, image2, image3]
  // Filenames auto-generated: share-1234567890-0.png, etc.
});
```

## How It Works

### On Mobile (Native Share)
1. Opens device's native share sheet
2. User can share to WhatsApp, Instagram, Messages, etc.
3. Includes both the media files and referral link

### On Desktop (Fallback)
1. Downloads the files to user's device
2. Copies message + referral link to clipboard
3. User can manually paste link after uploading

## Supported File Types

- **Images**: PNG, JPEG, GIF, WebP, SVG
- **Videos**: MP4, WebM, OGG, MOV
- **Other**: Any file type the Web Share API supports

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Text Share | ✅ | ✅ | ✅ | ✅ |
| File Share (Mobile) | ✅ | ✅ | ⚠️ | ✅ |
| File Share (Desktop) | ⚠️ | ❌ | ❌ | ⚠️ |

**Note**: Automatic fallback ensures functionality on all platforms.

## Technical Details

### Blob to File Conversion
- Converts Blob objects to File objects (required by Web Share API)
- Uses custom filename if provided, otherwise auto-generates
- Auto-generated format: `share-{timestamp}-{index}.{ext}`
- Detects extension from MIME type

### Filename Generation
```typescript
// With custom filename
blobToFile(blob, 'my-image.png') → File('my-image.png')

// Auto-generated
blobToFile(blob) → File('share-1728384000000-0.png')
```

### Error Handling
- **AbortError**: User cancelled (returns `false`)
- **NotAllowedError**: Permission denied (logs error)
- **DataError**: Invalid data or files too large (logs error)
- **Other errors**: Logs and falls back to Twitter intent (text only)

### Fallback Strategy
1. Try `navigator.share()` with files
2. If not available or fails → Download files + copy text to clipboard
3. For text-only shares → Copy to clipboard → Twitter intent (last resort)

## Real-World Use Cases

### 1. AI Image Generator
Users generate images and share them with referral link → drives signups

### 2. Meme Generator
Users create memes and share to social media → viral growth

### 3. Video Editor
Users edit clips and share results → product demonstration

### 4. Design Tools
Users create designs and share outputs → portfolio + referral

### 5. Avatar Creators
Users generate avatars and share across platforms → brand awareness

## Testing Checklist

- [ ] Basic text share works
- [ ] Canvas image share works (PNG)
- [ ] Canvas image share works (JPEG)
- [ ] Video blob share works
- [ ] Multiple files share works
- [ ] Custom filenames work
- [ ] Auto-generated filenames work
- [ ] Fallback downloads files on desktop
- [ ] Referral link is included
- [ ] User cancellation handled gracefully
- [ ] Error messages are helpful
- [ ] Mobile native share opens
- [ ] Debug mode logs appropriately

## Next Steps (Optional Enhancements)

1. **File Size Validation**: Warn if files exceed typical share limits
2. **Progress Indicators**: Show upload progress for large files
3. **Image Compression**: Auto-compress images before sharing
4. **Share Templates**: Pre-defined share messages per use case
5. **Analytics**: Track which share methods are most effective
6. **Social Platform Detection**: Optimize for specific platforms

## Documentation

Full documentation available in:
- `sdk/README.md` - "Sharing with Images & Videos" section
- `sdk/CHANGELOG.md` - Version 0.7.0

## Version

**Release**: v0.7.0  
**Date**: October 8, 2025
**Breaking Changes**: None (fully backward compatible)

