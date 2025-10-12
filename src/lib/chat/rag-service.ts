import { prisma } from '@/lib/db';
import { generateEmbedding } from './document-processor';
import { querySimilar } from './upstash-vector';

export class RAGService {
  /**
   * Query knowledge base for relevant context
   */
  static async queryKnowledge(
    query: string,
    appId: string,
    topK: number = 3
  ): Promise<string[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);
      
      // Search for similar chunks
      const results = await querySimilar(queryEmbedding, appId, topK);
      
      // Return the text chunks
      return results.map(r => r.text);
    } catch (error) {
      console.error('RAG query error:', error);
      return [];
    }
  }

  /**
   * Build context string from knowledge base results
   */
  static buildKnowledgeContext(chunks: string[]): string {
    if (chunks.length === 0) {
      return '';
    }

    return `
Here is relevant information from the knowledge base:

${chunks.map((chunk, i) => `[${i + 1}] ${chunk}`).join('\n\n')}

Use this information to answer the user's question accurately.`;
  }

  /**
   * Check if RAG is enabled for an app
   */
  static async isRAGEnabled(appId: string): Promise<boolean> {
    const config = await prisma.chatConfiguration.findUnique({
      where: { appId },
      select: { enableRAG: true }
    });
    
    return config?.enableRAG || false;
  }

  /**
   * Get document count for an app
   */
  static async getDocumentCount(appId: string): Promise<number> {
    const config = await prisma.chatConfiguration.findUnique({
      where: { appId },
      select: {
        knowledgeDocuments: {
          where: { status: 'ready' },
          select: { id: true }
        }
      }
    });

    return config?.knowledgeDocuments.length || 0;
  }
}

