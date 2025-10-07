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

    // Build where clause
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
                  where: { emailVerified: true },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        _count: {
          select: { referrals: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: Object.keys(orderBy).length > 0 ? orderBy : { createdAt: 'desc' },
    });

    // Process and enrich data
    const users = fingerprints.map(fp => {
      // Calculate credit balance
      const creditBalance = fp.credits.reduce((sum, credit) => sum + credit.amount, 0);

      // Get latest verified lead
      const verifiedLead = fp.leads.find(lead => lead.emailVerified);
      const latestLead = verifiedLead || fp.leads[0];

      // Count successful referrals
      const referralCount = fp.referrals.length;

      // Get referral source info
      const referralSource = fp.referredBy ? {
        referralId: fp.referredBy.id,
        referredAt: fp.referredBy.claimedAt,
        referrer: fp.referredBy.referrer ? {
          id: fp.referredBy.referrer.id,
          fingerprintId: fp.referredBy.referrer.fingerprint,
          name: fp.referredBy.referrer.leads[0]?.name || null,
          email: fp.referredBy.referrer.leads[0]?.email || null,
        } : null,
      } : null;

      return {
        id: fp.id,
        fingerprintId: fp.fingerprint,
        name: latestLead?.name || null,
        email: latestLead?.email || null,
        emailVerified: latestLead?.emailVerified || false,
        creditBalance,
        referralCount,
        referralSource,
        lastActiveAt: fp.lastActiveAt || fp.createdAt,
        createdAt: fp.createdAt,
        referralCode: fp.referralCode,
        browser: fp.browser,
        device: fp.device,
        location: fp.location,
        // Language information
        browserLanguage: fp.browserLanguage,
        preferredLanguage: fp.preferredLanguage,
        languageSource: fp.languageSource,
        languageUpdatedAt: fp.languageUpdatedAt,
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
