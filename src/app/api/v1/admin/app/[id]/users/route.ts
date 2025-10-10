import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'lastActiveAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const minCredits = parseInt(searchParams.get('minCredits') || '-999999');
    const maxCredits = parseInt(searchParams.get('maxCredits') || '999999');
    const minReferrals = parseInt(searchParams.get('minReferrals') || '0');

    const { id: appId } = await params;

    // Verify app exists
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return errors.notFound();
    }

    // Build where clause - only show users who actually used this specific app
    const whereClause: any = {
      appId,
    };

    // Search filter
    if (search) {
      whereClause.OR = [
        { fingerprint: { contains: search, mode: 'insensitive' } },
        { leads: { some: { email: { contains: search, mode: 'insensitive' } } } },
        { leads: { some: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Get total count
    const total = await prisma.fingerprint.count({ where: whereClause });

    // Build order by
    const orderBy: any = {};
    if (sortBy === 'credits') {
      // We'll sort by credits in memory after aggregation
    } else if (sortBy === 'referrals') {
      // We'll sort by referral count in memory after aggregation
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Fetch fingerprints with related data
    const fingerprints = await prisma.fingerprint.findMany({
      where: whereClause,
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
        },
        credits: true,
        referrals: {
          where: { claimedAt: { not: null } },
        },
        referredBy: {
          include: {
            referrer: {
              include: {
                leads: {
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
        orgUserAccount: true,
        _count: {
          select: { referrals: true },
        },
      } as any,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: Object.keys(orderBy).length > 0 ? orderBy : { createdAt: 'desc' },
    });

    // Process and enrich data
    const users = fingerprints.map(fp => {
      // Calculate credit balance
      const creditBalance = (fp as any).credits.reduce((sum: number, credit: any) => sum + credit.amount, 0);

      // Get latest verified lead
      const verifiedLead = (fp as any).leads.find((lead: any) => lead.emailVerified);
      const latestLead = verifiedLead || (fp as any).leads[0];

      // Count successful referrals
      const referralCount = (fp as any).referrals.length;

      // Get referral source info
      const referralSource = (fp as any).referredBy ? {
        referralId: (fp as any).referredBy.id,
        referredAt: (fp as any).referredBy.claimedAt,
        referrer: (fp as any).referredBy.referrer ? {
          id: (fp as any).referredBy.referrer.id,
          fingerprintId: (fp as any).referredBy.referrer.fingerprint,
          // Prefer verified leads with names, then any lead with a name, then any verified lead, then any lead
          name: (() => {
            const leads = (fp as any).referredBy.referrer.leads;
            const verifiedWithName = leads.find((l: any) => l.emailVerified && l.name);
            const anyWithName = leads.find((l: any) => l.name);
            const verified = leads.find((l: any) => l.emailVerified);
            const any = leads[0];
            return (verifiedWithName || anyWithName || verified || any)?.name || null;
          })(),
          email: (() => {
            const leads = (fp as any).referredBy.referrer.leads;
            const verifiedWithName = leads.find((l: any) => l.emailVerified && l.name);
            const anyWithName = leads.find((l: any) => l.name);
            const verified = leads.find((l: any) => l.emailVerified);
            const any = leads[0];
            return (verifiedWithName || anyWithName || verified || any)?.email || null;
          })(),
        } : null,
      } : null;

      // For shared apps, use OrgUserAccount data; for isolated apps, use Lead data
      const isSharedApp = !(app as any).isolatedAccounts;
      const orgAccount = (fp as any).orgUserAccount;
      
      return {
        id: (fp as any).id,
        fingerprintId: (fp as any).fingerprint,
        name: (isSharedApp && orgAccount?.name) || latestLead?.name || null,
        email: (isSharedApp && orgAccount?.email) || latestLead?.email || null,
        emailVerified: (isSharedApp && orgAccount?.emailVerified) || latestLead?.emailVerified || false,
        creditBalance,
        referralCount,
        referralSource,
        lastActiveAt: (fp as any).lastActiveAt || (fp as any).createdAt,
        createdAt: (fp as any).createdAt,
        referralCode: (fp as any).referralCode,
        browser: (fp as any).browser,
        device: (fp as any).device,
        location: (fp as any).location,
        // Language information
        browserLanguage: (fp as any).browserLanguage,
        preferredLanguage: (fp as any).preferredLanguage,
        languageSource: (fp as any).languageSource,
        languageUpdatedAt: (fp as any).languageUpdatedAt,
      };
    });

    // Apply post-processing filters
    let filteredUsers = users;

    // Filter by verified status
    if (verifiedOnly) {
      filteredUsers = filteredUsers.filter(u => u.emailVerified);
    }

    // Filter by credit balance
    filteredUsers = filteredUsers.filter(u => 
      u.creditBalance >= minCredits && u.creditBalance <= maxCredits
    );

    // Filter by referral count
    filteredUsers = filteredUsers.filter(u => u.referralCount >= minReferrals);

    // Sort by credits or referrals if needed
    if (sortBy === 'credits') {
      filteredUsers.sort((a, b) => {
        const diff = sortOrder === 'desc' ? b.creditBalance - a.creditBalance : a.creditBalance - b.creditBalance;
        return diff;
      });
    } else if (sortBy === 'referrals') {
      filteredUsers.sort((a, b) => {
        const diff = sortOrder === 'desc' ? b.referralCount - a.referralCount : a.referralCount - b.referralCount;
        return diff;
      });
    }

    return successResponse({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in /v1/admin/app/[id]/users GET:', error);
    return errors.serverError();
  }
}
