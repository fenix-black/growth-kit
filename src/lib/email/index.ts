import { Resend } from 'resend';
import { emailConfig } from './config';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Log email configuration on startup
if (process.env.NODE_ENV !== 'production') {
  const advice = emailConfig.getConfigAdvice();
  if (advice.length > 0) {
    console.log('\n📧 Email Configuration:');
    advice.forEach(line => console.log(line));
    console.log('');
  }
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 * @param options Email sending options
 * @returns Promise with send result
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; data?: any }> {
  if (!resend) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const fromAddress = options.from || process.env.EMAIL_FROM || 'GrowthKit <noreply@waitlist.fenixblack.ai>';
  
  console.log('📧 Attempting to send email:', {
    from: fromAddress,
    to: options.to,
    subject: options.subject,
    hasHtml: !!options.html,
    hasText: !!options.text,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error('❌ Resend API returned error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent successfully:', {
      id: data?.id,
      from: fromAddress,
      to: options.to,
    });
    
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Exception sending email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send email with retry logic
 * @param options Email sending options
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Delay between retries in milliseconds
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<{ success: boolean; error?: string; data?: any }> {
  let lastError: string | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(options);
    
    if (result.success) {
      return result;
    }
    
    lastError = result.error;
    
    if (attempt < maxRetries) {
      console.log(`Email send attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  
  return { success: false, error: lastError || 'Failed after all retry attempts' };
}
