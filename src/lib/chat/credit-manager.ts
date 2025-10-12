import { prisma } from '@/lib/db';

export class ChatCreditManager {
  /**
   * Check if organization has enough credits
   */
  static async hasCredits(organizationId: string, amount: number): Promise<boolean> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { creditBalance: true }
    });
    
    return org ? org.creditBalance >= amount : false;
  }

  /**
   * Consume credits from organization balance
   */
  static async consumeCredits(
    organizationId: string,
    amount: number,
    type: string,
    description?: string
  ): Promise<boolean> {
    try {
      // Check balance first
      const hasEnough = await this.hasCredits(organizationId, amount);
      if (!hasEnough) {
        return false;
      }

      // Deduct credits and create transaction
      await prisma.$transaction([
        prisma.organization.update({
          where: { id: organizationId },
          data: { creditBalance: { decrement: amount } }
        }),
        prisma.organizationCreditTransaction.create({
          data: {
            organizationId,
            amount: -amount,
            type,
            description
          }
        })
      ]);

      return true;
    } catch (error) {
      console.error('Error consuming credits:', error);
      return false;
    }
  }

  /**
   * Calculate credits for a chat message
   */
  static calculateMessageCredits(useRAG: boolean): number {
    return useRAG ? 2 : 1;
  }

  /**
   * Get organization credit balance
   */
  static async getBalance(organizationId: string): Promise<number> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { creditBalance: true }
    });
    
    return org?.creditBalance || 0;
  }
}

