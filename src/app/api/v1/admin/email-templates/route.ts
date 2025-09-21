import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { verifyServiceKey } from '@/lib/security/auth';
import { withCorsHeaders } from '@/lib/middleware/cors';
import { errors, successResponse } from '@/lib/utils/response';
import { getDefaultTemplates, validateTemplate } from '@/lib/email/template-engine';
import { EmailTemplateConfig, StoredEmailTemplate } from '@/lib/email/templates';

// GET /api/v1/admin/email-templates - Get email templates for an app
export async function GET(request: NextRequest) {
  try {
    // Service key authentication
    const isAuthorized = verifyServiceKey(request.headers);
    if (!isAuthorized) {
      return errors.unauthorized();
    }

    const url = new URL(request.url);
    const appId = url.searchParams.get('appId');
    
    if (!appId) {
      return errors.badRequest('App ID is required');
    }

    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: {
        id: true,
        name: true,
        emailTemplates: true,
      }
    });

    if (!app) {
      return errors.notFound();
    }

    // Get custom templates or return defaults
    const templates = (app.emailTemplates as EmailTemplateConfig) || getDefaultTemplates();

    return successResponse({
      appId: app.id,
      appName: app.name,
      templates,
      defaults: getDefaultTemplates(),
    });
  } catch (error: any) {
    console.error('Failed to get email templates:', error);
    return errors.serverError(error.message);
  }
}

// PUT /api/v1/admin/email-templates - Update email templates for an app
export async function PUT(request: NextRequest) {
  try {
    // Service key authentication
    const isAuthorized = verifyServiceKey(request.headers);
    if (!isAuthorized) {
      return errors.unauthorized();
    }

    const body = await request.json();
    const { appId, templates } = body;

    if (!appId) {
      return errors.badRequest('App ID is required');
    }

    if (!templates || typeof templates !== 'object') {
      return errors.badRequest('Templates configuration is required');
    }

    // Validate template structure
    const validTemplateTypes = ['verification', 'invitation', 'waitlist_confirmation'];
    for (const [type, template] of Object.entries(templates)) {
      if (!validTemplateTypes.includes(type)) {
        return errors.badRequest(`Invalid template type: ${type}`);
      }

      const tmpl = template as StoredEmailTemplate;
      if (tmpl) {
        if (!tmpl.subject || !tmpl.html) {
          return errors.badRequest(`Template ${type} must have subject and html`);
        }
      }
    }

    // Update app with new templates
    const app = await prisma.app.update({
      where: { id: appId },
      data: {
        emailTemplates: templates as any,
      },
      select: {
        id: true,
        name: true,
        emailTemplates: true,
      }
    });

    return successResponse({
      message: 'Email templates updated successfully',
      appId: app.id,
      templates: app.emailTemplates,
    });
  } catch (error: any) {
    console.error('Failed to update email templates:', error);
    return errors.serverError(error.message);
  }
}

// POST /api/v1/admin/email-templates/preview - Preview a template with sample data
export async function POST(request: NextRequest) {
  try {
    // Service key authentication
    const isAuthorized = verifyServiceKey(request.headers);
    if (!isAuthorized) {
      return errors.unauthorized();
    }

    const body = await request.json();
    const { template, sampleData } = body;

    if (!template || !template.subject || !template.html) {
      return errors.badRequest('Template with subject and html is required');
    }

    if (!sampleData || typeof sampleData !== 'object') {
      return errors.badRequest('Sample data is required for preview');
    }

    // Process the template with sample data
    const { processStoredTemplate } = await import('@/lib/email/template-engine');
    const processed = processStoredTemplate(template, sampleData);

    return successResponse({
      preview: processed,
      sampleData,
    });
  } catch (error: any) {
    console.error('Failed to preview template:', error);
    return errors.serverError(error.message);
  }
}

// DELETE /api/v1/admin/email-templates - Reset templates to defaults
export async function DELETE(request: NextRequest) {
  try {
    // Service key authentication
    const isAuthorized = verifyServiceKey(request.headers);
    if (!isAuthorized) {
      return errors.unauthorized();
    }

    const url = new URL(request.url);
    const appId = url.searchParams.get('appId');
    
    if (!appId) {
      return errors.badRequest('App ID is required');
    }

    // Reset templates to null (will use defaults)
    const app = await prisma.app.update({
      where: { id: appId },
      data: {
        emailTemplates: Prisma.JsonNull,
      },
      select: {
        id: true,
        name: true,
      }
    });

    return successResponse({
      message: 'Email templates reset to defaults',
      appId: app.id,
      appName: app.name,
    });
  } catch (error: any) {
    console.error('Failed to reset email templates:', error);
    return errors.serverError(error.message);
  }
}
