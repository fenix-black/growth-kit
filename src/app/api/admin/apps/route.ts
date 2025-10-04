import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';
import { verifyAdminSession } from '@/lib/auth/admin';
import { cookies } from 'next/headers';
import { generateApiKey, hashApiKey } from '@/lib/security/apiKeys';
import { trackAdminActivity } from '@/lib/admin-activity-tracking';

export async function GET(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie) {
      return errors.unauthorized();
    }

    // Verify admin session
    const session = verifyAdminSession(sessionCookie.value);
    if (!session) {
      return errors.unauthorized();
    }

    let apps;

    // Check if this is a database user (has email and userId) or env user (has username)
    if (session.email && session.userId) {
      // Database-based authentication - filter by user's organizations
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
          organizations: {
            include: {
              apps: {
                include: {
                  _count: {
                    select: {
                      apiKeys: true,
                      fingerprints: true,
                      referrals: true,
                      leads: true,
                      waitlist: true,
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
              }
            }
          }
        }
      });

      if (!user) {
        return errors.unauthorized();
      }

      // Flatten apps from all organizations the user belongs to
      apps = user.organizations.flatMap(org => org.apps);
    } else {
      // Environment-based authentication - show all apps (backward compatibility)
      apps = await prisma.app.findMany({
        include: {
          _count: {
            select: {
              apiKeys: true,
              fingerprints: true,
              referrals: true,
              leads: true,
              waitlist: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return successResponse({ 
      apps,
      user: session.email ? {
        email: session.email,
        type: 'database'
      } : {
        username: session.username,
        type: 'env'
      }
    });
  } catch (error) {
    console.error('Error in admin apps GET:', error);
    return errors.serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie) {
      return errors.unauthorized();
    }

    // Verify admin session
    const session = verifyAdminSession(sessionCookie.value);
    if (!session) {
      return errors.unauthorized();
    }

    const body = await request.json();
    const { 
      name, 
      domain, 
      description,
      logoUrl,
      primaryColor,
      waitlistLayout = 'centered',
      corsOrigins = [], 
      redirectUrl, 
      policyJson,
      isActive = true 
    } = body;

    if (!name || !domain || !redirectUrl || !policyJson) {
      return errors.badRequest('Missing required fields: name, domain, redirectUrl, policyJson');
    }

    let organizationId = null;

    // If this is a database user, get their organization ID
    if (session.email && session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
          organizations: {
            take: 1 // Get first organization (users typically belong to one org)
          }
        }
      });

      if (user && user.organizations.length > 0) {
        organizationId = user.organizations[0].id;
      }
    }

    // Create new app
    const app = await prisma.app.create({
      data: {
        name,
        domain,
        description,
        logoUrl,
        primaryColor,
        waitlistLayout,
        corsOrigins,
        redirectUrl,
        policyJson,
        isActive,
        organizationId, // Assign to user's organization if available
      },
      include: {
        _count: {
          select: {
            apiKeys: true,
            fingerprints: true,
            referrals: true,
            leads: true,
            waitlist: true,
          },
        },
      },
    });

    // Generate initial API key for new app
    const { key, hint } = generateApiKey();
    const hashedKey = await hashApiKey(key);

    await prisma.apiKey.create({
      data: {
        appId: app.id,
        keyHint: hint,
        hashedKey,
        scope: 'full',
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: app.id,
        event: 'app.created',
        entityType: 'app',
        entityId: app.id,
        metadata: { name, domain },
      },
    });

    // Track admin activity
    await trackAdminActivity({
      action: 'app_created',
      targetType: 'app',
      targetId: app.id,
      metadata: { name, domain }
    });

    return successResponse({
      app,
      initialApiKey: key,
      message: 'App created successfully. Save the API key as it won\'t be shown again.',
    }, 201);
  } catch (error) {
    console.error('Error creating app:', error);
    return errors.serverError();
  }
}
