import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mintClaim } from '@/lib/security/hmac';
import { isValidReferralCode } from '@/lib/utils/validation';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const params = await context.params;
    const code = params.code?.toUpperCase();

    if (!code || !isValidReferralCode(code)) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    // Find fingerprint with this referral code
    const fingerprint = await prisma.fingerprint.findUnique({
      where: { referralCode: code },
      include: { app: true },
    });

    if (!fingerprint || !fingerprint.app.isActive) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    // Create or update referral record for tracking (find first unclaimed referral)
    let referral = await prisma.referral.findFirst({
      where: {
        appId: fingerprint.appId,
        referrerId: fingerprint.id,
        referredId: null,
      },
    });

    if (referral) {
      referral = await prisma.referral.update({
        where: { id: referral.id },
        data: {
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
        },
      });
    } else {
      referral = await prisma.referral.create({
        data: {
          appId: fingerprint.appId,
          referrerId: fingerprint.id,
          visitCount: 1,
          lastVisitAt: new Date(),
        },
      });
    }

    // Mint a claim token
    const claimToken = mintClaim(code, undefined, 30); // 30 minute TTL

    // Log event
    await prisma.eventLog.create({
      data: {
        appId: fingerprint.appId,
        event: 'referral.visited',
        entityType: 'referral',
        entityId: referral.id,
        metadata: { 
          referralCode: code,
          referrerId: fingerprint.id,
          visitCount: referral.visitCount,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Build redirect URL with claim token
    const redirectUrl = new URL(fingerprint.app.redirectUrl);
    redirectUrl.searchParams.set('ref', claimToken);

    // Set cookie with claim token (HttpOnly for security)
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('ref_claim', claimToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60, // 30 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error in /r/[code]:', error);
    return NextResponse.redirect(new URL('/404', request.url));
  }
}
