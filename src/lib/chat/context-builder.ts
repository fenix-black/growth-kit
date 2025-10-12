import { prisma } from '@/lib/db';
import { ChatMessage } from './types';
import { RAGService } from './rag-service';

export class ContextBuilder {
  /**
   * Build conversation context for LLM
   */
  static async buildContext(
    conversationId: string,
    userMessage: string,
    maxMessages: number = 10
  ): Promise<{
    messages: ChatMessage[];
    ragContext?: string[];
    useRAG: boolean;
  }> {
    // Get conversation with config and recent messages
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        config: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: maxMessages,
          select: {
            role: true,
            content: true,
            metadata: true
          }
        }
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Reverse messages to get chronological order
    const messages: ChatMessage[] = conversation.messages
      .reverse()
      .map(m => ({
        role: m.role as any,
        content: m.content,
        metadata: m.metadata as any
      }));

    // Check if RAG is enabled
    const useRAG = conversation.config.enableRAG;
    let ragContext: string[] | undefined;

    if (useRAG) {
      // Query knowledge base for relevant chunks
      ragContext = await RAGService.queryKnowledge(
        userMessage,
        conversation.appId,
        3
      );
    }

    return {
      messages,
      ragContext,
      useRAG
    };
  }

  /**
   * Build system prompt with context
   */
  static buildSystemPrompt(
    basePrompt: string,
    ragChunks?: string[],
    userMetadata?: Record<string, any>
  ): string {
    let prompt = basePrompt;

    // Add knowledge base context
    if (ragChunks && ragChunks.length > 0) {
      prompt += RAGService.buildKnowledgeContext(ragChunks);
    }

    // Add user context if available
    if (userMetadata) {
      prompt += `\n\nUser Context:\n${JSON.stringify(userMetadata, null, 2)}`;
    }

    return prompt;
  }

  /**
   * Get or create conversation
   */
  static async getOrCreateConversation(
    appId: string,
    fingerprintId: string,
    sessionId: string
  ): Promise<string> {
    // Try to find existing conversation
    let conversation = await prisma.chatConversation.findUnique({
      where: { sessionId },
      select: { id: true }
    });

    if (conversation) {
      return conversation.id;
    }

    // Get or create chat config
    let config = await prisma.chatConfiguration.findUnique({
      where: { appId },
      select: { id: true }
    });

    if (!config) {
      // Create default config
      config = await prisma.chatConfiguration.create({
        data: {
          appId,
          enabled: true
        },
        select: { id: true }
      });
    }

    // Create new conversation
    conversation = await prisma.chatConversation.create({
      data: {
        appId,
        configId: config.id,
        fingerprintId,
        sessionId,
        status: 'active'
      },
      select: { id: true }
    });

    return conversation.id;
  }
}

