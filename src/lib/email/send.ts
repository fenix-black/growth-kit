import { App } from '@prisma/client';
import { sendEmailWithRetry } from './index';
import { getEmailTemplate } from './template-engine';
import { 
  TemplateType,
  VerificationTemplateData,
  InvitationTemplateData,
  WaitlistConfirmationData 
} from './templates';

export interface SendAppEmailOptions {
  app: App;
  to: string | string[];
  templateType: TemplateType;
  data: VerificationTemplateData | InvitationTemplateData | WaitlistConfirmationData;
  from?: string;
  replyTo?: string;
}

/**
 * Send an email using app-specific templates
 */
export async function sendAppEmail(options: SendAppEmailOptions) {
  const { app, to, templateType, data, from, replyTo } = options;
  
  console.log(`📨 Preparing to send ${templateType} email for app ${app.name} to ${to}`);
  
  // Ensure app name and URL are in the data
  const templateData = {
    ...data,
    appName: app.name,
    appUrl: app.domain,
  };
  
  // Get the template (custom or default)
  const template = getEmailTemplate(app, templateType, templateData);
  
  const fromAddress = from || `${app.name} <noreply@waitlist.fenixblack.ai>`;
  
  console.log('📮 Email details:', {
    templateType,
    from: fromAddress,
    to,
    subject: template.subject,
    appName: app.name,
  });
  
  // Send the email with retry
  const result = await sendEmailWithRetry({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    from: fromAddress,
    replyTo,
  });
  
  if (result.success) {
    console.log(`✅ ${templateType} email sent successfully to ${to}`);
  } else {
    console.error(`❌ Failed to send ${templateType} email to ${to}:`, result.error);
  }
  
  return result;
}

/**
 * Send a verification email for an app
 */
export async function sendVerificationEmail(
  app: App,
  to: string,
  data: Omit<VerificationTemplateData, 'appName' | 'appUrl'>
) {
  return sendAppEmail({
    app,
    to,
    templateType: 'verification',
    data: data as VerificationTemplateData,
  });
}

/**
 * Send an invitation email for an app
 */
export async function sendInvitationEmail(
  app: App,
  to: string,
  data: Omit<InvitationTemplateData, 'appName' | 'appUrl'>
) {
  return sendAppEmail({
    app,
    to,
    templateType: 'invitation',
    data: data as InvitationTemplateData,
  });
}

/**
 * Send a waitlist confirmation email for an app
 */
export async function sendWaitlistConfirmationEmail(
  app: App,
  to: string,
  data: Omit<WaitlistConfirmationData, 'appName' | 'appUrl'>
) {
  console.log('📬 sendWaitlistConfirmationEmail called:', {
    appId: app.id,
    appName: app.name,
    appDomain: app.domain,
    to,
    position: data.position,
  });
  
  const result = await sendAppEmail({
    app,
    to,
    templateType: 'waitlist_confirmation',
    data: data as WaitlistConfirmationData,
  });
  
  console.log('📬 sendWaitlistConfirmationEmail result:', result);
  
  return result;
}
