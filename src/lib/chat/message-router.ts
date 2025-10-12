import { prisma } from '@/lib/db';

export class MessageRouter {
  /**
   * Determine if conversation is currently taken over by human
   */
  static async isHumanHandoff(conversationId: string): Promise<boolean> {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: { status: true }
    });
    
    return conversation?.status === 'taken_over';
  }

  /**
   * Take over a conversation (human handoff)
   */
  static async takeOver(conversationId: string, userId: string): Promise<void> {
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: 'taken_over',
        humanTakeoverAt: new Date(),
        humanTakeoverBy: userId
      }
    });
  }

  /**
   * Release conversation back to AI
   */
  static async releaseToAI(conversationId: string): Promise<void> {
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: 'active',
        humanTakeoverAt: null,
        humanTakeoverBy: null
      }
    });
  }

  /**
   * End a conversation
   */
  static async endConversation(conversationId: string): Promise<void> {
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: 'ended',
        endedAt: new Date()
      }
    });
  }

  /**
   * Get conversation status
   */
  static async getConversationStatus(conversationId: string): Promise<{
    status: string;
    isHumanHandoff: boolean;
    humanTakeoverBy?: string;
  }> {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: {
        status: true,
        humanTakeoverBy: true
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return {
      status: conversation.status,
      isHumanHandoff: conversation.status === 'taken_over',
      humanTakeoverBy: conversation.humanTakeoverBy || undefined
    };
  }
}

