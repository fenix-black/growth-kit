import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPublicToken } from '@/lib/security/auth';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { corsErrors } from '@/lib/utils/corsResponse';
import { successResponse } from '@/lib/utils/response';
import { withCorsHeaders, isOriginAllowed } from '@/lib/middleware/cors';
import { sendEmailWithRetry } from '@/lib/email';
import bcrypt from 'bcrypt';

// Generate a 6-digit numeric code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mask email for display
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local.slice(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify public token authentication
    const authContext = await verifyPublicToken(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }
    
    const { app, fingerprint } = authContext;

    // Verify origin is allowed for this app
    if (origin && !isOriginAllowed(origin, app.corsOrigins)) {
      return corsErrors.forbidden(origin);
    }

    const body = await request.json();
    const { newName } = body;

    // Validate new name
    if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
      return corsErrors.badRequest('Valid name is required', origin);
    }

    const trimmedName = newName.trim();
    if (trimmedName.length > 100) {
      return corsErrors.badRequest('Name is too long (max 100 characters)', origin);
    }

    // Get lead data to check email verification status
    const lead = await prisma.lead.findFirst({
      where: {
        appId: app.id,
        fingerprintId: fingerprint.id,
      },
      select: {
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    // Check if email is verified
    if (!lead?.emailVerified || !lead?.email) {
      return corsErrors.badRequest('Email must be verified to change name', origin);
    }

    // Check if name is actually different
    if (lead.name === trimmedName) {
      return corsErrors.badRequest('New name must be different from current name', origin);
    }

    // Check for existing pending request (rate limit)
    const existingRequest = await prisma.profileChangeRequest.findUnique({
      where: {
        fingerprintId_appId_type: {
          fingerprintId: fingerprint.id,
          appId: app.id,
          type: 'name',
        },
      },
    });

    if (existingRequest && existingRequest.expiresAt > new Date() && !existingRequest.usedAt) {
      const remainingSeconds = Math.ceil((existingRequest.expiresAt.getTime() - Date.now()) / 1000);
      return withCorsHeaders(
        successResponse({
          success: false,
          error: 'rate_limited',
          message: `Please wait ${Math.ceil(remainingSeconds / 60)} minutes before requesting a new code`,
          retryAfter: remainingSeconds,
        }),
        origin,
        app.corsOrigins
      );
    }

    // Generate new code
    const code = generateCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert the request (replaces any existing request for this fingerprint/app/type)
    await prisma.profileChangeRequest.upsert({
      where: {
        fingerprintId_appId_type: {
          fingerprintId: fingerprint.id,
          appId: app.id,
          type: 'name',
        },
      },
      update: {
        newValue: trimmedName,
        code: hashedCode,
        expiresAt,
        usedAt: null,
        failedAttempts: 0,
      },
      create: {
        fingerprintId: fingerprint.id,
        appId: app.id,
        type: 'name',
        newValue: trimmedName,
        code: hashedCode,
        expiresAt,
      },
    });

    // Send email with code
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Name Change</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .code-box { background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #000; }
    .new-name { background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Confirm Your Name Change</h1>
    </div>
    
    <p>Hi there,</p>
    
    <p>You requested to change your name on <strong>${app.name}</strong>.</p>
    
    <div class="new-name">
      <p style="margin: 0; font-size: 14px; color: #666;">New name:</p>
      <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold;">${trimmedName}</p>
    </div>
    
    <div class="code-box">
      <p style="margin-bottom: 10px;">Your verification code is:</p>
      <div class="code">${code}</div>
    </div>
    
    <p>This code expires in <strong>10 minutes</strong>.</p>
    
    <div class="footer">
      <p>If you didn't request this change, you can safely ignore this email.</p>
      <p style="color: #666;">${app.name}</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const emailText = `
Confirm Your Name Change

Hi there,

You requested to change your name on ${app.name}.

New name: ${trimmedName}

Your verification code is: ${code}

This code expires in 10 minutes.

If you didn't request this change, you can safely ignore this email.

${app.name}
    `.trim();

    await sendEmailWithRetry({
      to: lead.email,
      subject: `Confirm your name change on ${app.name}`,
      html: emailHtml,
      text: emailText,
      from: `${app.name} <noreply@waitlist.fenixblack.ai>`,
    });

    // Log the event
    await prisma.eventLog.create({
      data: {
        appId: app.id,
        event: 'profile.name_change_requested',
        entityType: 'fingerprint',
        entityId: fingerprint.id,
        metadata: { newName: trimmedName },
      },
    });

    return withCorsHeaders(
      successResponse({
        success: true,
        message: 'Verification code sent',
        email: maskEmail(lead.email),
        expiresAt: expiresAt.toISOString(),
      }),
      origin,
      app.corsOrigins
    );

  } catch (error) {
    console.error('Request name change error:', error);
    return corsErrors.serverError('An unexpected error occurred', origin);
  }
}

