import { App } from '@prisma/client';
import { EmailTemplate } from './index';
import { 
  EmailTemplateConfig, 
  StoredEmailTemplate, 
  TemplateType,
  VerificationTemplateData,
  InvitationTemplateData,
  WaitlistConfirmationData 
} from './templates';
import {
  getVerificationEmailTemplate,
  getInvitationEmailTemplate,
  getWaitlistConfirmationTemplate
} from './templates';

/**
 * Replace variables in a template string
 * Supports {{variable}} syntax
 */
export function replaceTemplateVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    const keys = trimmedKey.split('.');
    let value: any = data;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Process a stored email template with data
 */
export function processStoredTemplate(
  template: StoredEmailTemplate, 
  data: Record<string, any>
): EmailTemplate {
  return {
    subject: replaceTemplateVariables(template.subject, data),
    html: replaceTemplateVariables(template.html, data),
    text: template.text ? replaceTemplateVariables(template.text, data) : undefined,
  };
}

/**
 * Get email template for an app with fallback to default templates
 */
export function getEmailTemplate(
  app: App,
  templateType: TemplateType,
  data: VerificationTemplateData | InvitationTemplateData | WaitlistConfirmationData
): EmailTemplate {
  // Try to get custom template from app configuration
  const customTemplates = app.emailTemplates as EmailTemplateConfig | null;
  
  if (customTemplates && customTemplates[templateType]) {
    const customTemplate = customTemplates[templateType];
    if (customTemplate) {
      return processStoredTemplate(customTemplate, data);
    }
  }
  
  // Fallback to default templates
  switch (templateType) {
    case 'verification':
      return getVerificationEmailTemplate(data as VerificationTemplateData);
    case 'invitation':
      return getInvitationEmailTemplate(data as InvitationTemplateData);
    case 'waitlist_confirmation':
      return getWaitlistConfirmationTemplate(data as WaitlistConfirmationData);
    default:
      throw new Error(`Unknown template type: ${templateType}`);
  }
}

/**
 * Get default email templates with placeholders for admin UI
 */
export function getDefaultTemplates(): EmailTemplateConfig {
  return {
    verification: {
      subject: 'Verify your email for {{appName}}',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .code-box { background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #000; }
    .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Verify Your Email</h1>
    <p>Hi {{name}},</p>
    <p>Thanks for signing up for <strong>{{appName}}</strong>! Please verify your email address.</p>
    {{#if code}}
    <div class="code-box">
      <p>Your verification code is:</p>
      <div class="code">{{code}}</div>
    </div>
    {{/if}}
    {{#if link}}
    <p style="text-align: center;">
      <a href="{{link}}" class="button">Verify Email</a>
    </p>
    {{/if}}
    <p>This code expires in 24 hours.</p>
  </div>
</body>
</html>`,
      text: `Hi {{name}},

Thanks for signing up for {{appName}}! Please verify your email address.

{{#if code}}Your verification code is: {{code}}{{/if}}
{{#if link}}Click here to verify: {{link}}{{/if}}

This code expires in 24 hours.`,
      variables: ['appName', 'name', 'code', 'link']
    },
    
    invitation: {
      subject: '🎉 You\'re invited to {{appName}}!',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .celebration { text-align: center; font-size: 48px; margin: 20px 0; }
    .highlight-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 30px; text-align: center; }
    .button { display: inline-block; padding: 14px 32px; background: white; color: #667eea; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="celebration">🎉</div>
    <h1>You're Invited to {{appName}}!</h1>
    <p>Great news! You've been selected to join <strong>{{appName}}</strong>.</p>
    <div class="highlight-box">
      <h2>Welcome! You get {{credits}} free credits to start</h2>
      <a href="{{invitationLink}}" class="button">Accept Invitation</a>
      <p style="margin-top: 15px; opacity: 0.9;">Your code: <strong>{{masterCode}}</strong></p>
    </div>
    {{#if referralLink}}
    <p>Share with friends: {{referralLink}}</p>
    {{/if}}
  </div>
</body>
</html>`,
      text: `🎉 You're Invited to {{appName}}!

You've been selected to join {{appName}}.
You get {{credits}} free credits to start!

Accept here: {{invitationLink}}
Your code: {{masterCode}}

{{#if referralLink}}Share with friends: {{referralLink}}{{/if}}`,
      variables: ['appName', 'invitationLink', 'masterCode', 'credits', 'referralLink']
    },
    
    waitlist_confirmation: {
      subject: 'You\'re #{{position}} on the {{appName}} waitlist',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .position-box { background: #f0f7ff; border: 2px solid #0066cc; border-radius: 12px; padding: 30px; text-align: center; }
    .position-number { font-size: 48px; font-weight: bold; color: #0066cc; }
  </style>
</head>
<body>
  <div class="container">
    <h1>You're on the Waitlist!</h1>
    <p>Thanks for your interest in <strong>{{appName}}</strong>!</p>
    <div class="position-box">
      <p>Your position:</p>
      <div class="position-number">#{{position}}</div>
      {{#if estimatedWait}}<p>Estimated wait: {{estimatedWait}}</p>{{/if}}
    </div>
    <p>We're inviting new users daily. You'll receive an email when it's your turn!</p>
  </div>
</body>
</html>`,
      text: `You're on the Waitlist!

Thanks for your interest in {{appName}}!

Your position: #{{position}}
{{#if estimatedWait}}Estimated wait: {{estimatedWait}}{{/if}}

We're inviting new users daily. You'll receive an email when it's your turn!`,
      variables: ['appName', 'position', 'estimatedWait']
    }
  };
}

/**
 * Validate that a template has all required variables
 */
export function validateTemplate(template: StoredEmailTemplate, requiredVariables: string[]): boolean {
  const templateContent = template.subject + template.html + (template.text || '');
  
  for (const variable of requiredVariables) {
    const pattern = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'i');
    if (!pattern.test(templateContent)) {
      console.warn(`Template missing required variable: ${variable}`);
      return false;
    }
  }
  
  return true;
}
