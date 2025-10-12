import { Index } from '@upstash/vector';

let vectorIndex: Index | null = null;

/**
 * Get or create Upstash Vector client
 */
export function getVectorClient(): Index {
  if (!vectorIndex) {
    if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
      throw new Error('Upstash Vector credentials not configured');
    }

    vectorIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN
    });
  }

  return vectorIndex;
}

/**
 * Store document chunk in vector database
 */
export async function storeChunk(
  id: string,
  text: string,
  embedding: number[],
  metadata: Record<string, any>
): Promise<void> {
  const client = getVectorClient();
  
  await client.upsert({
    id,
    vector: embedding,
    metadata: {
      text,
      ...metadata
    }
  });
}

/**
 * Query similar chunks
 */
export async function querySimilar(
  embedding: number[],
  appId: string,
  topK: number = 3
): Promise<Array<{ text: string; score: number; metadata: Record<string, any> }>> {
  const client = getVectorClient();
  
  const results = await client.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: `appId = '${appId}'`
  });

  return results.map(r => ({
    text: r.metadata?.text as string || '',
    score: r.score,
    metadata: r.metadata || {}
  }));
}

/**
 * Delete chunk from vector database
 */
export async function deleteChunk(id: string): Promise<void> {
  const client = getVectorClient();
  await client.delete(id);
}

/**
 * Delete all chunks for a document
 */
export async function deleteDocumentChunks(chunkIds: string[]): Promise<void> {
  const client = getVectorClient();
  
  for (const id of chunkIds) {
    await client.delete(id);
  }
}

