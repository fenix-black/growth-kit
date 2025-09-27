import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyServiceKey } from '@/lib/security/auth';
import { successResponse, errors } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const appId = searchParams.get('appId');
    const steps = searchParams.get('steps')?.split(',').filter(Boolean);
    const days = parseInt(searchParams.get('days') || '30');

    if (!appId) {
      return errors.badRequest('appId is required');
    }

    if (!steps || steps.length < 2) {
      return errors.badRequest('At least 2 funnel steps are required');
    }

    // Verify app exists
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return errors.notFound();
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all users who completed the first step
    const firstStepUsers = await prisma.activity.findMany({
      where: {
        appId,
        eventName: steps[0],
        timestamp: { gte: startDate },
      },
      select: {
        fingerprintId: true,
        timestamp: true,
      },
      distinct: ['fingerprintId'],
      orderBy: {
        timestamp: 'asc',
      },
    });

    const funnelData = [];
    let previousUsers = new Set(firstStepUsers.map(u => u.fingerprintId));
    
    // Add first step data
    funnelData.push({
      step: steps[0],
      users: previousUsers.size,
      conversionRate: 100,
    });

    // For each subsequent step, find users who completed it after completing the previous step
    for (let i = 1; i < steps.length; i++) {
      const currentStep = steps[i];
      const currentStepUsers = new Set<string>();

      // For each user who completed previous steps
      for (const userId of previousUsers) {
        // Find the timestamp of when they completed the previous step
        const previousStepTime = firstStepUsers.find(u => u.fingerprintId === userId)?.timestamp;
        
        if (previousStepTime) {
          // Check if they completed the current step after the previous step
          const completed = await prisma.activity.findFirst({
            where: {
              appId,
              fingerprintId: userId,
              eventName: currentStep,
              timestamp: { 
                gte: previousStepTime,
              },
            },
          });

          if (completed) {
            currentStepUsers.add(userId);
          }
        }
      }

      const conversionRate = previousUsers.size > 0 
        ? (currentStepUsers.size / previousUsers.size) * 100 
        : 0;

      funnelData.push({
        step: currentStep,
        users: currentStepUsers.size,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
      });

      previousUsers = currentStepUsers;
    }

    // Calculate overall conversion rate
    const overallConversion = funnelData[0].users > 0
      ? (funnelData[funnelData.length - 1].users / funnelData[0].users) * 100
      : 0;

    return successResponse({
      funnel: funnelData,
      overallConversion: parseFloat(overallConversion.toFixed(2)),
      period: {
        start: startDate,
        end: new Date(),
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching funnel data:', error);
    return errors.serverError();
  }
}
