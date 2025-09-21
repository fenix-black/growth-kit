import { EmailTemplate } from './index';
import { App } from '@prisma/client';

export interface BaseTemplateData {
  appName: string;
  appUrl?: string;
  [key: string]: any; // Allow additional custom variables
}

export interface VerificationTemplateData extends BaseTemplateData {
  code?: string;
  link?: string;
  name?: string;
}

export interface InvitationTemplateData extends BaseTemplateData {
  invitationLink: string;
  masterCode: string;
  credits: number;
  referralLink?: string;
}

export interface WaitlistConfirmationData extends BaseTemplateData {
  position: number;
  estimatedWait?: string;
}

export type TemplateType = 'verification' | 'invitation' | 'waitlist_confirmation';

export interface StoredEmailTemplate {
  subject: string;
  html: string;
  text?: string;
  variables?: string[]; // List of required variables for this template
}

export interface EmailTemplateConfig {
  verification?: StoredEmailTemplate;
  invitation?: StoredEmailTemplate;
  waitlist_confirmation?: StoredEmailTemplate;
}

/**
 * Email verification template
 */
export function getVerificationEmailTemplate(data: VerificationTemplateData): EmailTemplate {
  const { appName, appUrl, code, link, name } = data;
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .code-box { background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #000; }
          .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          
          <p>${greeting}</p>
          
          <p>Thanks for signing up for <strong>${appName}</strong>! Please verify your email address to continue.</p>
          
          ${code ? `
            <div class="code-box">
              <p style="margin-bottom: 10px;">Your verification code is:</p>
              <div class="code">${code}</div>
            </div>
          ` : ''}
          
          ${link ? `
            <p style="text-align: center;">
              <a href="${link}" class="button">Verify Email</a>
            </p>
            <p style="text-align: center; color: #666; font-size: 14px;">
              Or copy this link: ${link}
            </p>
          ` : ''}
          
          <p>This verification code will expire in 24 hours.</p>
          
          <div class="footer">
            <p>If you didn't request this email, please ignore it.</p>
            ${appUrl ? `<p><a href="${appUrl}" style="color: #666;">${appName}</a></p>` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
${greeting}

Thanks for signing up for ${appName}! Please verify your email address to continue.

${code ? `Your verification code is: ${code}` : ''}
${link ? `Click here to verify: ${link}` : ''}

This verification code will expire in 24 hours.

If you didn't request this email, please ignore it.

${appName}
${appUrl || ''}
  `.trim();
  
  return {
    subject: `Verify your email for ${appName}`,
    html,
    text
  };
}

/**
 * Waitlist invitation email template
 */
export function getInvitationEmailTemplate(data: InvitationTemplateData): EmailTemplate {
  const { appName, appUrl, invitationLink, masterCode, credits, referralLink } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .celebration { text-align: center; font-size: 48px; margin: 20px 0; }
          .highlight-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; }
          .button { display: inline-block; padding: 14px 32px; background: white; color: #667eea; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .credits-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; margin-top: 10px; }
          .share-section { background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 30px 0; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="celebration">🎉</div>
            <h1>You're Invited to ${appName}!</h1>
          </div>
          
          <p>Great news! You've been selected from our waitlist to join <strong>${appName}</strong>.</p>
          
          <div class="highlight-box">
            <h2 style="margin-top: 0;">Welcome to the community!</h2>
            <p>You're getting <span class="credits-badge">${credits} free credits</span> to start</p>
            <a href="${invitationLink}" class="button">Accept Invitation</a>
            <p style="margin-top: 15px; font-size: 14px; opacity: 0.9;">
              Your invitation code: <strong>${masterCode}</strong>
            </p>
          </div>
          
          ${referralLink ? `
            <div class="share-section">
              <h3>Share the love! 💜</h3>
              <p>Invite your friends and earn more credits when they join:</p>
              <p style="background: white; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 14px; word-break: break-all;">
                ${referralLink}
              </p>
            </div>
          ` : ''}
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Click the invitation link above</li>
            <li>Complete your profile</li>
            <li>Start using your free credits</li>
            <li>Invite friends to earn more!</li>
          </ul>
          
          <p>This invitation expires in 7 days, so don't wait!</p>
          
          <div class="footer">
            <p>Questions? Reply to this email and we'll help you out.</p>
            ${appUrl ? `<p><a href="${appUrl}" style="color: #666;">${appName}</a></p>` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
🎉 You're Invited to ${appName}!

Great news! You've been selected from our waitlist to join ${appName}.

You're getting ${credits} free credits to start!

Accept your invitation here: ${invitationLink}

Your invitation code: ${masterCode}

${referralLink ? `
Share the love!
Invite your friends and earn more credits when they join:
${referralLink}
` : ''}

What happens next?
- Click the invitation link above
- Complete your profile  
- Start using your free credits
- Invite friends to earn more!

This invitation expires in 7 days, so don't wait!

Questions? Reply to this email and we'll help you out.

${appName}
${appUrl || ''}
  `.trim();
  
  return {
    subject: `🎉 You're invited to ${appName}!`,
    html,
    text
  };
}

/**
 * Waitlist confirmation email template
 */
export function getWaitlistConfirmationTemplate(data: WaitlistConfirmationData): EmailTemplate {
  const { appName, appUrl, position, estimatedWait } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're on the list!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .position-box { background: #f0f7ff; border: 2px solid #0066cc; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; }
          .position-number { font-size: 48px; font-weight: bold; color: #0066cc; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're on the Waitlist!</h1>
          </div>
          
          <p>Thanks for your interest in <strong>${appName}</strong>! We've added you to our exclusive waitlist.</p>
          
          <div class="position-box">
            <p style="margin-bottom: 10px;">Your position:</p>
            <div class="position-number">#${position}</div>
            ${estimatedWait ? `<p style="margin-top: 10px; color: #666;">Estimated wait: ${estimatedWait}</p>` : ''}
          </div>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>We're inviting new users daily</li>
            <li>You'll receive an email when it's your turn</li>
            <li>Keep an eye on your inbox!</li>
          </ul>
          
          <p>In the meantime, follow us for updates and sneak peeks!</p>
          
          <div class="footer">
            <p>Can't wait? Reply to this email if you have any questions.</p>
            ${appUrl ? `<p><a href="${appUrl}" style="color: #666;">${appName}</a></p>` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
You're on the Waitlist!

Thanks for your interest in ${appName}! We've added you to our exclusive waitlist.

Your position: #${position}
${estimatedWait ? `Estimated wait: ${estimatedWait}` : ''}

What happens next?
- We're inviting new users daily
- You'll receive an email when it's your turn
- Keep an eye on your inbox!

In the meantime, follow us for updates and sneak peeks!

Can't wait? Reply to this email if you have any questions.

${appName}
${appUrl || ''}
  `.trim();
  
  return {
    subject: `You're #${position} on the ${appName} waitlist`,
    html,
    text
  };
}
