import { prisma } from '@/lib/db';
import { storeChunk } from './upstash-vector';

/**
 * Split text into chunks
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

/**
 * Generate embeddings using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured for embeddings');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Process and store document
 */
export async function processDocument(
  documentId: string,
  appId: string,
  content: string,
  title: string
): Promise<number> {
  // Chunk the document
  const chunks = chunkText(content);
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunkContent = chunks[i];
    const embedding = await generateEmbedding(chunkContent);
    const chunkId = `${documentId}-chunk-${i}`;
    
    // Store in Upstash Vector
    await storeChunk(chunkId, chunkContent, embedding, {
      appId,
      documentId,
      title,
      chunkIndex: i
    });
    
    // Store chunk record in database
    await prisma.chatKnowledgeChunk.create({
      data: {
        documentId,
        content: chunkContent,
        chunkIndex: i,
        upstashId: chunkId,
        metadata: { title }
      }
    });
  }
  
  return chunks.length;
}

