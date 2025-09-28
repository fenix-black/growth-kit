import { createContext, useContext } from 'react';

// Supported languages
export type Language = 'en' | 'es';

// Translation keys interface
export interface Translations {
  // WaitlistForm translations
  waitlist: {
    youreOnTheList: string;
    yourPosition: string;
    notifyEmail: string;
    earlyAccess: string;
    joinWaitlistMessage: string;
    enterYourEmail: string;
    emailRequired: string;
    invalidEmail: string;
    joinFailed: string;
    errorOccurred: string;
    joining: string;
    joinWaitlist: string;
    noSpam: string;
  };
  
  // GrowthKitAccountWidget translations
  widget: {
    loading: string;
    waitlistActive: string;
    credits: string;
    creditsPausedTooltip: string;
    earnCredits: string;
    account: string;
    name: string;
    email: string;
    creditsLabel: string;
    notSet: string;
    earnMoreCredits: string;
    emailVerifiedSuccess: string;
    noVerificationToken: string;
    verificationFailed: string;
  };
  
  // CreditExhaustionModal translations
  modal: {
    earnCredits: string;
    creditsPausedMessage: string;
    completeTasks: string;
    nameTab: string;
    emailTab: string;
    verifyTab: string;
    shareTab: string;
    enterYourName: string;
    earnCreditsName: string;
    tellUsName: string;
    yourName: string;
    claiming: string;
    claimCredits: string;
    enterYourEmail: string;
    earnCreditsEmail: string;
    provideEmail: string;
    yourEmail: string;
    verifyYourEmail: string;
    checkInbox: string;
    clickVerificationLink: string;
    earnVerificationCredits: string;
    shareAndEarn: string;
    earnCreditsEachFriend: string;
    copy: string;
    copied: string;
    shareNow: string;
    earnCreditsPerReferral: string;
    referralUnavailable: string;
    newCreditsPaused: string;
    currentCredits: string;
    done: string;
  };
}

// English translations
const enTranslations: Translations = {
  waitlist: {
    youreOnTheList: "You're on the list!",
    yourPosition: "Your position:",
    notifyEmail: "We'll notify you at {{email}} when it's your turn!",
    earlyAccess: "Early Access",
    joinWaitlistMessage: "Join our exclusive waitlist for early access",
    enterYourEmail: "Enter your email",
    emailRequired: "Email is required",
    invalidEmail: "Please enter a valid email address",
    joinFailed: "Failed to join waitlist. Please try again.",
    errorOccurred: "An error occurred. Please try again.",
    joining: "Joining...",
    joinWaitlist: "Join Waitlist",
    noSpam: "No spam. We'll only email you when it's your turn.",
  },
  widget: {
    loading: "Loading...",
    waitlistActive: "Waitlist Active",
    credits: "credits",
    creditsPausedTooltip: "Credit earning is temporarily paused",
    earnCredits: "Earn Credits",
    account: "Account",
    name: "Name:",
    email: "Email:",
    creditsLabel: "Credits:",
    notSet: "Not set",
    earnMoreCredits: "Earn More Credits",
    emailVerifiedSuccess: "Email verified successfully! +5 credits earned",
    noVerificationToken: "No verification token provided",
    verificationFailed: "Verification failed. The token may be invalid or expired.",
  },
  modal: {
    earnCredits: "Earn Credits",
    creditsPausedMessage: "Credit earning is temporarily paused for this app",
    completeTasks: "Complete tasks below to earn more credits:",
    nameTab: "Name",
    emailTab: "Email",
    verifyTab: "Verify",
    shareTab: "Share",
    enterYourName: "Enter Your Name",
    earnCreditsName: "Earn {{credits}} credits by telling us your name",
    tellUsName: "Tell us your name",
    yourName: "Your name",
    claiming: "Claiming...",
    claimCredits: "Claim {{credits}} Credits",
    enterYourEmail: "Enter Your Email",
    earnCreditsEmail: "Earn {{credits}} credits + unlock email verification bonus",
    provideEmail: "Provide your email address",
    yourEmail: "your@email.com",
    verifyYourEmail: "Verify Your Email",
    checkInbox: "Check your inbox for a verification email",
    clickVerificationLink: "Click the verification link to activate your account",
    earnVerificationCredits: "Click the verification link in the email to earn {{credits}} additional credits",
    shareAndEarn: "Share & Earn",
    earnCreditsEachFriend: "Earn credits for each friend who joins!",
    copy: "Copy",
    copied: "Copied!",
    shareNow: "Share Now",
    earnCreditsPerReferral: "You'll earn {{credits}} credits per referral",
    referralUnavailable: "Referral sharing is temporarily unavailable",
    newCreditsPaused: "New credits are paused",
    currentCredits: "Current credits:",
    done: "Done",
  },
};

// Spanish translations
const esTranslations: Translations = {
  waitlist: {
    youreOnTheList: "¡Estás en la lista!",
    yourPosition: "Tu posición:",
    notifyEmail: "Te notificaremos a {{email}} cuando sea tu turno!",
    earlyAccess: "Acceso Anticipado",
    joinWaitlistMessage: "Únete a nuestra lista de espera exclusiva para acceso anticipado",
    enterYourEmail: "Ingresa tu correo electrónico",
    emailRequired: "El correo electrónico es requerido",
    invalidEmail: "Por favor ingresa una dirección de correo válida",
    joinFailed: "Error al unirse a la lista de espera. Por favor intenta de nuevo.",
    errorOccurred: "Ocurrió un error. Por favor intenta de nuevo.",
    joining: "Uniéndose...",
    joinWaitlist: "Unirse a la Lista de Espera",
    noSpam: "Sin spam. Solo te enviaremos correos cuando sea tu turno.",
  },
  widget: {
    loading: "Cargando...",
    waitlistActive: "Lista de Espera Activa",
    credits: "créditos",
    creditsPausedTooltip: "La obtención de créditos está temporalmente pausada",
    earnCredits: "Ganar Créditos",
    account: "Cuenta",
    name: "Nombre:",
    email: "Correo:",
    creditsLabel: "Créditos:",
    notSet: "Sin configurar",
    earnMoreCredits: "Ganar Más Créditos",
    emailVerifiedSuccess: "¡Correo verificado con éxito! +5 créditos ganados",
    noVerificationToken: "No se proporcionó token de verificación",
    verificationFailed: "Error en la verificación. El token puede ser inválido o haber expirado.",
  },
  modal: {
    earnCredits: "Ganar Créditos",
    creditsPausedMessage: "La obtención de créditos está temporalmente pausada para esta aplicación",
    completeTasks: "Completa las tareas siguientes para ganar más créditos:",
    nameTab: "Nombre",
    emailTab: "Correo",
    verifyTab: "Verificar",
    shareTab: "Compartir",
    enterYourName: "Ingresa Tu Nombre",
    earnCreditsName: "Gana {{credits}} créditos diciéndonos tu nombre",
    tellUsName: "Dinos tu nombre",
    yourName: "Tu nombre",
    claiming: "Reclamando...",
    claimCredits: "Reclamar {{credits}} Créditos",
    enterYourEmail: "Ingresa Tu Correo",
    earnCreditsEmail: "Gana {{credits}} créditos + desbloquea el bono de verificación de correo",
    provideEmail: "Proporciona tu dirección de correo electrónico",
    yourEmail: "tu@correo.com",
    verifyYourEmail: "Verifica Tu Correo",
    checkInbox: "Revisa tu bandeja de entrada para el correo de verificación",
    clickVerificationLink: "Haz clic en el enlace de verificación para activar tu cuenta",
    earnVerificationCredits: "Haz clic en el enlace de verificación del correo para ganar {{credits}} créditos adicionales",
    shareAndEarn: "Compartir y Ganar",
    earnCreditsEachFriend: "¡Gana créditos por cada amigo que se una!",
    copy: "Copiar",
    copied: "¡Copiado!",
    shareNow: "Compartir Ahora",
    earnCreditsPerReferral: "Ganarás {{credits}} créditos por referido",
    referralUnavailable: "Compartir referencias temporalmente no disponible",
    newCreditsPaused: "Nuevos créditos pausados",
    currentCredits: "Créditos actuales:",
    done: "Listo",
  },
};

// All translations
const translations: Record<Language, Translations> = {
  en: enTranslations,
  es: esTranslations,
};

// Localization context
export interface LocalizationContextValue {
  language: Language;
  t: Translations;
  setLanguage?: (language: Language) => void;
}

export const LocalizationContext = createContext<LocalizationContextValue>({
  language: 'en',
  t: enTranslations,
});

// Hook to use localization
export function useLocalization(): LocalizationContextValue {
  return useContext(LocalizationContext);
}

// Helper function to get translations for a language
export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en;
}

// Helper function to replace placeholders in translation strings
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key]?.toString() || match;
  });
}

// Hook to get a translation function with interpolation
export function useTranslation() {
  const { t, language } = useLocalization();
  
  const translate = (key: string, values?: Record<string, string | number>): string => {
    // Navigate through nested object using dot notation
    const keys = key.split('.');
    let value: any = t;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key '${key}' not found for language '${language}'`);
      return key; // Return the key if translation not found
    }
    
    return values ? interpolate(value, values) : value;
  };
  
  return { t: translate, language };
}
