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

export interface TeamInvitationData {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteLink: string;
  expiresAt: Date;
}

/**
 * Send a team invitation email (for admin dashboard)
 */
export async function sendTeamInvitationEmail(data: TeamInvitationData) {
  const { to, organizationName, inviterName, inviteLink, expiresAt } = data;
  
  console.log(`📨 Sending team invitation to ${to} for ${organizationName}`);
  
  const expiryDate = expiresAt.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.2;">
                You're Invited!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on GrowthKit.
              </p>
              
              <p style="margin: 0 0 30px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                GrowthKit helps teams manage leads, waitlists, and referral programs. Click the button below to accept this invitation and create your account.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                This invitation expires on <strong>${expiryDate}</strong>.
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Powered by <strong style="color: #10b981;">FenixBlack</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} GrowthKit. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  
  const text = `
You're invited to join ${organizationName} on GrowthKit!

${inviterName} has invited you to join their team.

Accept this invitation and create your account:
${inviteLink}

This invitation expires on ${expiryDate}.

If you weren't expecting this invitation, you can safely ignore this email.

---
Powered by FenixBlack
© ${new Date().getFullYear()} GrowthKit
  `.trim();
  
  const result = await sendEmailWithRetry({
    to,
    subject: `You're invited to join ${organizationName} on GrowthKit`,
    html,
    text,
    from: 'GrowthKit <noreply@waitlist.fenixblack.ai>',
  });
  
  if (result.success) {
    console.log(`✅ Team invitation sent successfully to ${to}`);
  } else {
    console.error(`❌ Failed to send team invitation to ${to}:`, result.error);
  }
  
  return result;
}
