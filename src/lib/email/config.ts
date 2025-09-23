/**
 * Email configuration with fallback options
 */

export const emailConfig = {
  // Default from address - can be overridden by environment variable
  getFromAddress(appName?: string): string {
    // Priority 1: Environment variable EMAIL_FROM
    if (process.env.EMAIL_FROM) {
      return process.env.EMAIL_FROM;
    }
    
    // Priority 2: Use verified domain if set
    if (process.env.VERIFIED_EMAIL_DOMAIN) {
      const name = appName || 'GrowthKit';
      return `${name} <noreply@${process.env.VERIFIED_EMAIL_DOMAIN}>`;
    }
    
    // Priority 3: Use Resend's test domain (works in development)
    if (process.env.NODE_ENV === 'development') {
      return 'onboarding@resend.dev';
    }
    
    // Priority 4: Default fallback
    return 'GrowthKit <noreply@growthkit.app>';
  },
  
  // Check if in test mode (can only send to specific emails)
  isTestMode(): boolean {
    return !process.env.VERIFIED_EMAIL_DOMAIN && !process.env.EMAIL_FROM?.includes('@resend.dev');
  },
  
  // Get allowed test recipients
  getTestRecipients(): string[] {
    const recipients = process.env.TEST_EMAIL_RECIPIENTS?.split(',').map(e => e.trim()) || [];
    // Always include the Resend account owner email if known
    if (process.env.RESEND_ACCOUNT_EMAIL) {
      recipients.push(process.env.RESEND_ACCOUNT_EMAIL);
    }
    recipients.push('pablo@fenixblack.ai'); // Based on test output
    return [...new Set(recipients)]; // Remove duplicates
  },
  
  // Check if email can be sent to recipient
  canSendTo(email: string): boolean {
    if (!this.isTestMode()) {
      return true; // Can send to anyone if domain is verified
    }
    
    // In test mode, can only send to allowed recipients
    const testRecipients = this.getTestRecipients();
    return testRecipients.some(allowed => 
      email.toLowerCase() === allowed.toLowerCase()
    );
  },
  
  // Get email configuration advice
  getConfigAdvice(): string[] {
    const advice = [];
    
    if (!process.env.RESEND_API_KEY) {
      advice.push('⚠️ RESEND_API_KEY is not set');
    }
    
    if (!process.env.EMAIL_FROM && !process.env.VERIFIED_EMAIL_DOMAIN) {
      advice.push('⚠️ Neither EMAIL_FROM nor VERIFIED_EMAIL_DOMAIN is set');
      advice.push('   Set EMAIL_FROM to a verified sender address');
      advice.push('   OR set VERIFIED_EMAIL_DOMAIN to your verified domain');
    }
    
    if (this.isTestMode()) {
      advice.push('📧 Email is in TEST MODE - can only send to:');
      this.getTestRecipients().forEach(email => {
        advice.push(`   • ${email}`);
      });
      advice.push('   To send to any address, verify a domain at resend.com/domains');
    }
    
    return advice;
  }
};
