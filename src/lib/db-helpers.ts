import { prisma } from './db';

/**
 * Execute a database operation with retry logic for connection pool timeouts
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 100
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a connection pool timeout error
      const isConnectionError = 
        error instanceof Error && 
        (error.message.includes('connection pool') || 
         error.message.includes('P2024') ||
         error.message.includes('Timed out fetching'));
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      console.warn(`Database connection attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Gracefully handle connection pool exhaustion
 */
export async function safeQuery<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await withRetry(operation);
  } catch (error) {
    const isConnectionError = 
      error instanceof Error && 
      (error.message.includes('connection pool') || 
       error.message.includes('P2024') ||
       error.message.includes('Timed out fetching'));
    
    if (isConnectionError) {
      console.error('Database connection exhausted, returning fallback value');
      return fallback || null;
    }
    
    throw error;
  }
}

/**
 * Batch database operations to reduce connection usage
 */
export async function batchOperations<T>(
  operations: Array<() => Promise<T>>
): Promise<T[]> {
  return await withRetry(async () => {
    return await Promise.all(operations.map(op => op()));
  });
}
