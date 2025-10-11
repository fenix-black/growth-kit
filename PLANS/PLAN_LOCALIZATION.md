# GrowthKit Localization Implementation Plan

## Overview

This document outlines the comprehensive localization strategy for GrowthKit, implementing user-centric language detection and multilingual support across the widget, landing page, and admin panel. The approach prioritizes personalized user experiences over app-level language settings.

## Core Principles

- **User-centric language detection**: Capture and store individual user language preferences
- **API-driven localization**: Backend serves localized content via API responses
- **Graceful fallbacks**: English as default when translations are missing
- **Browser language detection**: Automatic language detection on first visit
- **Persistent preferences**: Store user language choices across sessions
- **KISS principles**: Keep implementation simple, clean, and readable throughout
- **Backwards compatibility**: Ensure existing functionality continues working during implementation

---

## Section 1: SDK Widget Localization

### Browser Language Detection

#### Client-Side Language Capture (IMPLEMENTED)
```typescript
// IMPLEMENTED: Detect browser language on widget initialization
function detectBrowserLanguage(): string {
  // Priority: navigator.language -> navigator.languages[0] -> 'en'
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  
  // Normalize to our supported languages (en/es for now)
  if (browserLang.toLowerCase().startsWith('es')) {
    return 'es';
  }
  
  // Default to English for all other languages
  return 'en';
}
```

#### Integration with Existing Fingerprinting (IMPLEMENTED)
- ✅ **DONE** Extended `getBrowserContext()` to include language information
- ✅ **DONE** Language data sent alongside existing fingerprint data (device type, screen resolution, etc.)
- ✅ **DONE** Both detected and preferred language included in API calls via context object

#### User Language Preference
```typescript
// Widget language switching capability
const useLanguagePreference = () => {
  const [userLanguage, setUserLanguage] = useState<'en' | 'es'>('en');
  
  const updateLanguage = (lang: 'en' | 'es') => {
    setUserLanguage(lang);
    // Send preference to backend API
    updateUserLanguagePreference(lang);
  };
  
  return { userLanguage, updateLanguage };
};
```

### API Integration Changes (IMPLEMENTED)

#### Approach: Reuse Existing Infrastructure ✅
- ✅ **DONE** Language data integrated into existing `/v1/me` endpoint
- ✅ **DONE** No new API endpoints required (KISS principle)
- ✅ **DONE** Backwards compatible with existing SDK versions

#### Language Data Integration (IMPLEMENTED)
```typescript
// Language data is sent via existing /v1/me endpoint with context
// No separate endpoint needed - reuses existing infrastructure
POST /v1/me
{
  fingerprint: string;
  context: {
    // ... existing context fields
    browserLanguage: string;  // NEW: Detected from navigator.language
    widgetLanguage: string;   // NEW: Set programmatically by parent
  }
}
```

#### Enhanced Fingerprint Data (IMPLEMENTED)
```typescript
// IMPLEMENTED: Extended TrackContext interface
export interface TrackContext {
  browser: string;
  os: string;
  device: 'desktop' | 'mobile' | 'tablet';
  screenResolution: string;
  viewport: string;
  url: string;
  referrer: string;
  userAgent: string;
  browserLanguage: string;  // NEW: Detected from navigator.language
  widgetLanguage: string;   // NEW: Set programmatically by parent website
}
```

### Widget Programmatic Language Setting

#### Localized Content Reception
- All waitlist screens receive text content from API responses
- Dynamic content updates when language preference changes
- Fallback content handling for missing translations
- Real-time language switching without widget reload

---

## Section 2: Landing Page Localization (IMPLEMENTED)

### Implementation Approach: React Context + JSON Translations

**Philosophy**: Use React Context for shared language state with cookie persistence. All translations in JSON files following KISS principles.

### ✅ IMPLEMENTED: Language Context

```typescript
// contexts/LanguageContext.tsx - Shared language state across all components
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getLanguageFromCookie, setLanguageCookie } from '@/lib/language';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = getLanguageFromCookie();
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      const browserLang = navigator.language.toLowerCase().includes('es') ? 'es' : 'en';
      setLanguage(browserLang);
      setLanguageCookie(browserLang);
    }
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang);
    setLanguageCookie(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within LanguageProvider');
  }
  return context;
}
```

### ✅ IMPLEMENTED: Language Detection Utility

```typescript
// lib/language.ts - IMPLEMENTED
export type Language = 'en' | 'es';

export function detectBrowserLanguage(acceptLanguage: string | null): Language {
  if (!acceptLanguage) return 'en';
  const lang = acceptLanguage.toLowerCase();
  return lang.includes('es') ? 'es' : 'en';
}

export function getLanguageFromCookie(): Language | null {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('NEXT_LOCALE='));
  return cookie ? (cookie.split('=')[1] as Language) : null;
}

export function setLanguageCookie(language: Language): void {
  document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=31536000`;
}
```

### ✅ IMPLEMENTED: Translation Files Structure

**All translations in 2 JSON files:**
```
src/locales/
├── en.json  // All English: UI text, feature data, app examples
└── es.json  // All Spanish: UI text, feature data, app examples
```

**Content includes:**
- Navigation, Hero, Features, Examples, Integration, CTA, Footer sections
- Feature details (titles, descriptions, benefits, code examples)
- Mini app examples (names, descriptions, categories, tags, testimonials, timeframes)
- All UI labels, buttons, and dynamic content

### ✅ IMPLEMENTED: Translation Hook (Context-Based)

```typescript
// hooks/useTranslation.ts - IMPLEMENTED with Context
'use client';

import { useLanguageContext } from '@/contexts/LanguageContext';
import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';

const translations = {
  en: enTranslations,
  es: esTranslations,
};

export function useTranslation() {
  const { language, changeLanguage } = useLanguageContext();

  const t = (key: string): any => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return { language, changeLanguage, t };
}
```

### ✅ IMPLEMENTED: Modern Language Switcher

```typescript
// components/LanguageSwitcher.tsx - IMPLEMENTED with flags and animations
'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';

export function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="relative inline-flex bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full p-1 shadow-sm">
      <button onClick={() => changeLanguage('en')} className={...}>
        {language === 'en' && (
          <motion.div layoutId="activeLanguage" className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(to right, #10b981, #14b8a6)' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
        )}
        <span className="relative z-10">🇺🇸</span>
        <span className="relative z-10">EN</span>
      </button>
      <button onClick={() => changeLanguage('es')} className={...}>
        {language === 'es' && (
          <motion.div layoutId="activeLanguage" ... />
        )}
        <span className="relative z-10">🇪🇸</span>
        <span className="relative z-10">ES</span>
      </button>
    </div>
  );
}
```

**Features:**
- Flag emojis (🇺🇸 🇪🇸) for visual clarity
- Smooth animated background transition
- Glassmorphism design matching landing page aesthetic
- Rounded pill shape with shadow

### ✅ IMPLEMENTED: Layout Integration

```typescript
// app/(landing)/layout.tsx - IMPLEMENTED
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>  {/* ← Wraps entire landing page */}
      <LandingPageProvider>
        <div className="min-h-screen bg-white">
          <LandingNav />  {/* ← Contains LanguageSwitcher */}
          <main className="pt-16">{children}</main>
          <LandingFooter />
        </div>
      </LandingPageProvider>
    </LanguageProvider>
  );
}
```

### ✅ IMPLEMENTED: Component Usage

**All sections translated:**
- `HeroSection.tsx` - Hero content with animated words
- `FeaturesDemo.tsx` - Features with data from JSON
- `RealExamplesShowcase.tsx` - App examples with data from JSON
- `IntegrationShowcase.tsx` - Integration steps and features
- `CTASection.tsx` - Call-to-action content
- `LandingNav.tsx` - Navigation with language switcher
- `LandingFooter.tsx` - Footer content

**Example usage:**
```typescript
export default function HeroSection() {
  const { t } = useTranslation();
  return (
    <section>
      <h1>{t('hero.title1')} {t('hero.title2')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button>{t('hero.ctaPrimary')}</button>
    </section>
  );
}
```

**Data arrays usage:**
```typescript
export default function FeaturesDemo() {
  const { t } = useTranslation();
  const featureDetails = t('featureDetails') as any[];
  // Map through translated feature data
}
```

### ✅ IMPLEMENTED: Server-Side Language Detection

```typescript
// middleware.ts - IMPLEMENTED
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hasLanguageCookie = request.cookies.has('NEXT_LOCALE');
  
  if (!hasLanguageCookie) {
    const acceptLanguage = request.headers.get('accept-language');
    const language = acceptLanguage?.toLowerCase().includes('es') ? 'es' : 'en';
    
    const response = NextResponse.next();
    response.cookies.set('NEXT_LOCALE', language, {
      path: '/',
      maxAge: 31536000,
    });
    
    return response;
  }
  
  return NextResponse.next();
}
```

### ✅ IMPLEMENTED: Multilingual Sitemap

```typescript
// app/sitemap.ts - IMPLEMENTED
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://growth.fenixblack.ai';
  const languages = ['en', 'es'];
  const pages = [''];
  
  const sitemap: MetadataRoute.Sitemap = [];
  
  pages.forEach(page => {
    languages.forEach(lang => {
      sitemap.push({
        url: lang === 'en' ? `${baseUrl}${page}` : `${baseUrl}${page}?lang=${lang}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '' ? 1 : 0.8,
        alternates: {
          languages: {
            en: `${baseUrl}${page}`,
            es: `${baseUrl}${page}?lang=es`,
          },
        },
      });
    });
  });
  
  return sitemap;
}
```

### Key Implementation Decisions

**✅ React Context Pattern:**
- Single shared language state across all components
- No isolated state per component
- Instant re-renders when language changes
- Standard React pattern for global state

**✅ JSON-Only Data:**
- All translations in 2 files (en.json, es.json)
- Feature details and app examples included in JSON
- No separate TypeScript data files
- Simpler maintenance and updates

**✅ Spanish Length Optimization:**
- Translations optimized to match English text lengths
- Prevents layout issues in buttons, cards, navigation
- Maintains marketing tone with neutral Spanish
- Uses tech abbreviations where appropriate (JS, setup, deploy)

### Benefits of This Implementation

✅ **Simple**: React Context + 2 JSON files, ~150 lines of code total
✅ **Fast**: Instant language switching, no page reload
✅ **Maintainable**: All translations in one place per language
✅ **Reactive**: Context ensures all components update together
✅ **Type-Safe**: Full TypeScript support
✅ **SSR-Compatible**: Server-side language detection via middleware
✅ **SEO-Ready**: Multilingual sitemap generated
✅ **Modern UX**: Animated flag-based language switcher
✅ **No State Loss**: Smooth transitions without unmounting components

---

## Section 3: Backend User Data Localization

### Database Schema Changes

#### Fingerprint Language Tracking (IMPLEMENTED)
```prisma
model Fingerprint {
  id                String    @id @default(cuid())
  fingerprint       String    @unique
  
  // ... existing fields
  
  // IMPLEMENTED: Language tracking fields
  browserLanguage   String?   // Detected from navigator.language (SDK context)
  preferredLanguage String?   // User-selected language preference ('en', 'es')
  languageSource    String?   // 'browser_detected', 'user_selected', 'default'
  languageUpdatedAt DateTime? // When language preference was last updated
  
  // ... existing relationships
  
  @@index([preferredLanguage])
  @@index([browserLanguage])
}
```

#### Multi-Language Email Templates
```prisma
model EmailTemplate {
  id          String   @id @default(cuid())
  appId       String
  type        String   // 'verification', 'invitation', 'waitlist_confirmation', 'reminder'
  language    String   // 'en', 'es'
  subject     String
  htmlContent String
  textContent String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  app         App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  
  @@unique([appId, type, language])
  @@index([appId, type])
  @@index([language])
  @@map("email_templates")
}

#### Multi-Language Waitlist Content
```prisma
model WaitlistContent {
  id            String   @id @default(cuid())
  appId         String
  language      String   // 'en', 'es'
  
  // Waitlist form content
  title         String   // "Join our waitlist"
  description   String   // "Be the first to know when we launch"
  emailPlaceholder String // "Enter your email address"
  submitButton  String   // "Join Waitlist"
  
  // Status messages
  waitingMessage    String // "You're on the waitlist!"
  positionMessage   String // "You're #{{position}} in line"
  invitedMessage    String // "You're invited! Check your email"
  acceptedMessage   String // "Welcome! You now have access"
  
  // Additional content
  privacyNotice     String? // Optional privacy notice
  successMessage    String? // After joining confirmation
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  app           App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  
  @@unique([appId, language])
  @@index([appId])
  @@index([language])
  @@map("waitlist_content")
}

model App {
  // ... existing fields
  emailTemplates  EmailTemplate[]
  waitlistContent WaitlistContent[]
}
```


### API Endpoint Localization

#### Language Detection Middleware
```typescript
// lib/middleware/languageDetection.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const detectUserLanguage = async (
  request: NextRequest,
  fingerprintId: string
): Promise<string> => {
  // Get fingerprint record
  const fingerprint = await prisma.fingerprint.findUnique({
    where: { id: fingerprintId },
    select: { preferredLanguage: true, browserLanguage: true }
  });
  
  if (fingerprint?.preferredLanguage) {
    return fingerprint.preferredLanguage;
  }
  
  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  const detectedLang = parseAcceptLanguage(acceptLanguage);
  
  // Update fingerprint with detected language if not set
  if (detectedLang && !fingerprint?.browserLanguage) {
    await prisma.fingerprint.update({
      where: { id: fingerprintId },
      data: { 
        browserLanguage: detectedLang,
        languageSource: 'browser_detected'
      }
    });
  }
  
  return detectedLang || 'en';
};
```

#### Localized API Response Utilities
```typescript
// lib/utils/localization.ts
interface LocalizedContent {
  en: Record<string, any>;
  es: Record<string, any>;
}

export const getLocalizedContent = (
  contentMap: LocalizedContent,
  language: string
): Record<string, any> => {
  return contentMap[language as keyof LocalizedContent] || contentMap.en;
};

// Waitlist content localization from database
export const getWaitlistContent = async (appId: string, language: string) => {
  // Try to get content in user's preferred language
  let content = await prisma.waitlistContent.findUnique({
    where: {
      appId_language: {
        appId,
        language
      }
    }
  });
  
  // Fallback to English if translation doesn't exist
  if (!content && language !== 'en') {
    content = await prisma.waitlistContent.findUnique({
      where: {
        appId_language: {
          appId,
          language: 'en'
        }
      }
    });
  }
  
  // Return default content if no database content exists
  if (!content) {
    return getDefaultWaitlistContent(language);
  }
  
  return content;
};

// Fallback default content for when database content doesn't exist
const getDefaultWaitlistContent = (language: string) => {
  const defaults: LocalizedContent = {
    en: {
      title: "Join our waitlist",
      description: "Be the first to know when we launch",
      emailPlaceholder: "Enter your email address",
      submitButton: "Join Waitlist",
      waitingMessage: "You're on the waitlist!",
      positionMessage: "You're #{{position}} in line",
      invitedMessage: "You're invited! Check your email for next steps",
      acceptedMessage: "Welcome! You now have access"
    },
    es: {
      title: "Únete a nuestra lista de espera",
      description: "Sé el primero en saber cuando lancemos",
      emailPlaceholder: "Ingresa tu dirección de email",
      submitButton: "Unirse a la Lista",
      waitingMessage: "¡Estás en la lista de espera!",
      positionMessage: "Eres el #{{position}} en la fila",
      invitedMessage: "¡Estás invitado! Revisa tu email para los próximos pasos",
      acceptedMessage: "¡Bienvenido! Ahora tienes acceso"
    }
  };
  
  return getLocalizedContent(defaults, language);
};
```

#### Enhanced API Endpoints

##### User Profile Endpoint (`/v1/me`)
```typescript
// Enhanced to return localized content
export async function GET(request: NextRequest) {
  const fingerprintId = getFingerprintId(request);
  const language = await detectUserLanguage(request, fingerprintId);
  
  const userData = await getUserData(fingerprintId);
  const appId = getAppId(request); // Get app ID from API key
  const waitlistContent = await getWaitlistContent(appId, language);
  
  return NextResponse.json({
    ...userData,
    language,
    waitlistContent,
    // ... other localized content
  });
}
```


### Email Template System

#### Template Management Utilities
```typescript
// lib/email/templateManager.ts
export const getEmailTemplate = async (
  appId: string,
  templateType: string,
  userLanguage: string
): Promise<EmailTemplate | null> => {
  // Try user's preferred language first
  let template = await prisma.emailTemplate.findUnique({
    where: {
      appId_type_language: {
        appId,
        type: templateType,
        language: userLanguage
      }
    }
  });
  
  // Fallback to English if translation doesn't exist
  if (!template && userLanguage !== 'en') {
    template = await prisma.emailTemplate.findUnique({
      where: {
        appId_type_language: {
          appId,
          type: templateType,
          language: 'en'
        }
      }
    });
  }
  
  return template;
};

export const createDefaultTemplates = async (appId: string) => {
  const templates = [
    {
      type: 'verification',
      language: 'en',
      subject: 'Verify your email address',
      htmlContent: '<p>Click <a href="{{verificationLink}}">here</a> to verify your email.</p>'
    },
    {
      type: 'verification',
      language: 'es',
      subject: 'Verifica tu dirección de email',
      htmlContent: '<p>Haz clic <a href="{{verificationLink}}">aquí</a> para verificar tu email.</p>'
    }
    // ... more template types and languages
  ];
  
  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: {
        appId_type_language: {
          appId,
          type: template.type,
          language: template.language
        }
      },
      update: template,
      create: { appId, ...template }
    });
  }
};

export const createDefaultWaitlistContent = async (appId: string) => {
  const waitlistContent = [
    {
      language: 'en',
      title: "Join our waitlist",
      description: "Be the first to know when we launch",
      emailPlaceholder: "Enter your email address",
      submitButton: "Join Waitlist",
      waitingMessage: "You're on the waitlist!",
      positionMessage: "You're #{{position}} in line",
      invitedMessage: "You're invited! Check your email for next steps",
      acceptedMessage: "Welcome! You now have access",
      privacyNotice: "We respect your privacy and will never spam you",
      successMessage: "Thanks for joining! We'll be in touch soon"
    },
    {
      language: 'es',
      title: "Únete a nuestra lista de espera",
      description: "Sé el primero en saber cuando lancemos",
      emailPlaceholder: "Ingresa tu dirección de email",
      submitButton: "Unirse a la Lista",
      waitingMessage: "¡Estás en la lista de espera!",
      positionMessage: "Eres el #{{position}} en la fila",
      invitedMessage: "¡Estás invitado! Revisa tu email para los próximos pasos",
      acceptedMessage: "¡Bienvenido! Ahora tienes acceso",
      privacyNotice: "Respetamos tu privacidad y nunca te enviaremos spam",
      successMessage: "¡Gracias por unirte! Nos pondremos en contacto pronto"
    }
  ];
  
  for (const content of waitlistContent) {
    await prisma.waitlistContent.upsert({
      where: {
        appId_language: {
          appId,
          language: content.language
        }
      },
      update: content,
      create: { appId, ...content }
    });
  }
};
```

#### Enhanced Email Sending
```typescript
// lib/email/sender.ts
export const sendLocalizedEmail = async (
  appId: string,
  userEmail: string,
  templateType: string,
  fingerprintId: string,
  templateVariables: Record<string, string> = {}
) => {
  // Get user's language preference
  const fingerprint = await prisma.fingerprint.findUnique({
    where: { id: fingerprintId },
    select: { preferredLanguage: true, browserLanguage: true }
  });
  
  const userLanguage = fingerprint?.preferredLanguage || 
                      fingerprint?.browserLanguage || 'en';
  
  // Get appropriate template
  const template = await getEmailTemplate(appId, templateType, userLanguage);
  
  if (!template) {
    throw new Error(`Template not found: ${templateType} for language ${userLanguage}`);
  }
  
  // Process template variables
  const processedSubject = processTemplate(template.subject, templateVariables);
  const processedContent = processTemplate(template.htmlContent, templateVariables);
  
  // Send email via Resend
  await sendEmail({
    to: userEmail,
    subject: processedSubject,
    html: processedContent
  });
  
  // Log email sent event
  await prisma.eventLog.create({
    data: {
      appId,
      event: 'email.sent',
      entityType: 'email',
      entityId: userEmail,
      metadata: {
        templateType,
        language: userLanguage,
        fingerprintId
      }
    }
  });
};
```

---

## Section 4: Admin Panel UI Localization

### Database Schema for Admin Users
```prisma
model User {
  // ... existing fields
  preferredLanguage String @default("en") // Admin user's interface language
  timezone          String @default("UTC")
}
```

### Next.js Internationalization Setup
```typescript
// next.config.js (Admin routes)
const nextConfig = {
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    domains: [
      {
        domain: 'admin.growthkit.dev',
        defaultLocale: 'en'
      }
    ]
  }
};
```

#### Admin Translation Structure
```
src/locales/admin/
├── en/
│   ├── common.json          # Shared UI elements
│   ├── auth.json           # Login/signup forms
│   ├── sidebar.json        # Navigation menu
│   ├── dashboard.json      # Dashboard pages
│   ├── apps.json           # App management
│   ├── users.json          # User management
│   ├── analytics.json      # Analytics pages
│   ├── emails.json         # Email template management
│   └── settings.json       # Settings pages
└── es/
    ├── common.json
    ├── auth.json
    ├── sidebar.json
    ├── dashboard.json
    ├── apps.json
    ├── users.json
    ├── analytics.json
    ├── emails.json
    └── settings.json
```

#### Authentication Localization
```json
// locales/admin/en/auth.json
{
  "login": {
    "title": "Sign in to GrowthKit",
    "subtitle": "Manage your apps and analytics",
    "emailLabel": "Email address",
    "passwordLabel": "Password",
    "submitButton": "Sign in",
    "forgotPassword": "Forgot your password?",
    "signUpLink": "Don't have an account? Sign up"
  },
  "signup": {
    "title": "Create your account",
    "subtitle": "Start building growth into your apps",
    "nameLabel": "Full name",
    "emailLabel": "Email address",
    "passwordLabel": "Password",
    "confirmPasswordLabel": "Confirm password",
    "submitButton": "Create account",
    "signInLink": "Already have an account? Sign in"
  }
}
```

#### Sidebar Navigation Localization
```json
// locales/admin/en/sidebar.json
{
  "navigation": {
    "dashboard": "Dashboard",
    "apps": "Apps",
    "analytics": "Analytics",
    "users": "Users & Leads",
    "emails": "Email Templates",
    "settings": "Settings",
    "billing": "Billing",
    "support": "Support"
  },
  "sections": {
    "overview": "Overview",
    "management": "Management",
    "tools": "Tools",
    "account": "Account"
  }
}
```

#### Content Management Editor Localization
```typescript
// components/ContentManagementEditor.tsx
import { useTranslation } from 'next-i18next';

const ContentManagementEditor = () => {
  const { t } = useTranslation('content');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>('en');
  const [activeTab, setActiveTab] = useState<'emails' | 'waitlist'>('emails');
  const [emailTemplates, setEmailTemplates] = useState<Record<string, EmailTemplate>>({});
  const [waitlistContent, setWaitlistContent] = useState<Record<string, WaitlistContent>>({});
  
  return (
    <div className="content-management-editor">
      {/* Language Selection */}
      <div className="language-tabs">
        <button 
          className={selectedLanguage === 'en' ? 'active' : ''}
          onClick={() => setSelectedLanguage('en')}
        >
          {t('languages.english')}
        </button>
        <button 
          className={selectedLanguage === 'es' ? 'active' : ''}
          onClick={() => setSelectedLanguage('es')}
        >
          {t('languages.spanish')}
        </button>
      </div>
      
      {/* Content Type Tabs */}
      <div className="content-type-tabs">
        <button 
          className={activeTab === 'emails' ? 'active' : ''}
          onClick={() => setActiveTab('emails')}
        >
          {t('tabs.emailTemplates')}
        </button>
        <button 
          className={activeTab === 'waitlist' ? 'active' : ''}
          onClick={() => setActiveTab('waitlist')}
        >
          {t('tabs.waitlistContent')}
        </button>
      </div>
      
      {/* Email Templates Editor */}
      {activeTab === 'emails' && (
        <form className="email-templates-form">
          <div className="field">
            <label>{t('email.subject')}</label>
            <input 
              value={emailTemplates[selectedLanguage]?.subject || ''} 
              onChange={(e) => updateEmailTemplate('subject', e.target.value)}
              placeholder={t('email.placeholders.subject')}
            />
          </div>
          
          <div className="field">
            <label>{t('email.content')}</label>
            <textarea 
              value={emailTemplates[selectedLanguage]?.htmlContent || ''} 
              onChange={(e) => updateEmailTemplate('htmlContent', e.target.value)}
              placeholder={t('email.placeholders.content')}
            />
          </div>
        </form>
      )}
      
      {/* Waitlist Content Editor */}
      {activeTab === 'waitlist' && (
        <form className="waitlist-content-form">
          <div className="field">
            <label>{t('waitlist.title')}</label>
            <input 
              value={waitlistContent[selectedLanguage]?.title || ''} 
              onChange={(e) => updateWaitlistContent('title', e.target.value)}
              placeholder={t('waitlist.placeholders.title')}
            />
          </div>
          
          <div className="field">
            <label>{t('waitlist.description')}</label>
            <textarea 
              value={waitlistContent[selectedLanguage]?.description || ''} 
              onChange={(e) => updateWaitlistContent('description', e.target.value)}
              placeholder={t('waitlist.placeholders.description')}
            />
          </div>
          
          <div className="field">
            <label>{t('waitlist.submitButton')}</label>
            <input 
              value={waitlistContent[selectedLanguage]?.submitButton || ''} 
              onChange={(e) => updateWaitlistContent('submitButton', e.target.value)}
              placeholder={t('waitlist.placeholders.submitButton')}
            />
          </div>
          
          <div className="field">
            <label>{t('waitlist.waitingMessage')}</label>
            <input 
              value={waitlistContent[selectedLanguage]?.waitingMessage || ''} 
              onChange={(e) => updateWaitlistContent('waitingMessage', e.target.value)}
              placeholder={t('waitlist.placeholders.waitingMessage')}
            />
          </div>
        </form>
      )}
    </div>
  );
};
```

#### Admin API Localization
```typescript
// API endpoints for admin panel with localization support
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredLanguage: true }
  });
  
  const language = user?.preferredLanguage || 'en';
  const localizedData = getLocalizedAdminContent(language);
  
  return NextResponse.json({
    data: requestedData,
    localization: localizedData,
    language
  });
}
```

### Data Migration Strategy

#### Default Content Creation
```typescript
// scripts/createDefaultContent.ts
const createDefaultContentForAllApps = async () => {
  const apps = await prisma.app.findMany({
    select: { id: true, name: true }
  });
  
  for (const app of apps) {
    console.log(`Creating content for app: ${app.name}`);
    
    // Create email templates
    await createDefaultTemplates(app.id);
    
    // Create waitlist content
    await createDefaultWaitlistContent(app.id);
  }
  
  console.log('Default email templates and waitlist content created for all apps');
};
```

#### Language Detection for Existing Users
```typescript
// scripts/detectLanguagesForExistingFingerprints.ts
const detectLanguagesForExistingFingerprints = async () => {
  const fingerprints = await prisma.fingerprint.findMany({
    where: {
      preferredLanguage: null
    }
  });
  
  // Set default language for existing fingerprints
  await prisma.fingerprint.updateMany({
    where: {
      preferredLanguage: null
    },
    data: {
      preferredLanguage: 'en',
      languageSource: 'default'
    }
  });
  
  console.log(`Updated ${fingerprints.length} fingerprints with default language`);
};
```

---

## Implementation Checklist

### Phase 1: Backend User Data Localization
- [x] **DONE** Update Fingerprint model with language fields (browserLanguage, preferredLanguage, languageSource, languageUpdatedAt)
- [ ] Create EmailTemplate model with multi-language support
- [ ] Create WaitlistContent model with multi-language support
- [ ] Implement language detection middleware
- [x] **DONE** Update existing API endpoints to receive and store language data (enhanced /v1/me endpoint)
- [ ] Implement email template management utilities
- [ ] Implement waitlist content management utilities
- [ ] Create default email templates and waitlist content for existing apps
- [ ] Update email sending logic to use user language preferences

### Phase 2: Widget Enhancement
- [x] **DONE** Add browser language detection to SDK (detectBrowserLanguage function in context.ts)
- [x] **DONE** Update TrackContext interface to include language fields
- [x] **DONE** Update fingerprint data to include language information (sent via existing /v1/me endpoint)
- [ ] Ensure all widget text comes from API responses

### Phase 3: Landing Page Localization
- [x] **DONE** Create simple language detection utility (no external packages)
- [x] **DONE** Create consolidated translation files (en.json, es.json) with all content and data
- [x] **DONE** Implement React Context for shared language state (LanguageContext)
- [x] **DONE** Implement useTranslation hook with Context and cookie persistence
- [x] **DONE** Implement modern language switcher with flags and animations
- [x] **DONE** Add server-side language detection in middleware
- [x] **DONE** Generate multilingual sitemap with language alternates
- [x] **DONE** Translate all landing page sections (Hero, Features, Examples, Integration, CTA, Nav, Footer)
- [x] **DONE** Move feature details and app examples data to JSON for translation

### Phase 4: Admin Panel UI Localization
- [ ] Add preferredLanguage field to User model
- [ ] Set up admin panel internationalization
- [ ] Create comprehensive translation files for all admin sections
- [ ] Implement language switcher in admin layout
- [ ] Create unified content management editor (email templates + waitlist content)
- [ ] Implement language tabs for both email and waitlist content editing
- [ ] Update admin API endpoints to support localized responses
- [ ] Add user language preference to admin settings

### Phase 5: Polish & Optimization
- [ ] Performance optimization for translation loading
- [ ] Ensure consistent language experience across platform

---

This plan provides a comprehensive roadmap for implementing user-centric localization across the entire GrowthKit platform, structured in four distinct sections:

1. **SDK Widget Localization** - Programmatic language control via parent websites
2. **Landing Page Localization** - Standalone website with language switching and SEO
3. **Backend User Data Localization** - API responses, emails, and user-facing content 
4. **Admin Panel UI Localization** - Administrative interface for managing content

The approach emphasizes seamless user experience and maintainable code architecture while keeping concerns properly separated. All implementation follows KISS principles with clean, readable code and backwards compatibility.

## ✅ Implementation Progress

**Section 1: SDK Widget Localization - COMPLETE ✅**
- ✅ Database schema updated with language fields (Fingerprint model)
- ✅ SDK browser language detection implemented (detectBrowserLanguage function)
- ✅ API integration via existing `/v1/me` endpoint (no new endpoints needed)
- ✅ Backwards compatible with existing SDK versions
- ✅ Clean, KISS-principle implementation
- ✅ SDK version bumped to 0.6.3 with documentation

**Section 2: Landing Page Localization - COMPLETE ✅**
- ✅ React Context implemented for shared language state
- ✅ Translation files created (en.json, es.json) with all content
- ✅ All landing page sections translated (7 components)
- ✅ Feature details and app examples data in JSON
- ✅ Modern language switcher with flags and animations
- ✅ Server-side language detection via middleware
- ✅ Multilingual sitemap generated
- ✅ Spanish translations optimized for layout consistency
- ✅ Instant language switching without state loss

**Next Steps:** Continue with Section 3 (Backend User Data Localization) - email templates, waitlist content, and API response localization.
