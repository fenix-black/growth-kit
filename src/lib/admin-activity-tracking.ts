import { prisma } from './db';

interface TrackActivityOptions {
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

export async function trackAdminActivity({
  action,
  targetType,
  targetId,
  metadata
}: TrackActivityOptions): Promise<void> {
  try {
    await prisma.adminActivity.create({
      data: {
        action,
        targetType,
        targetId,
        metadata
      }
    });
  } catch (error) {
    // Log error but don't throw - tracking shouldn't break operations
    console.error('Failed to track admin activity:', error);
  }
}
