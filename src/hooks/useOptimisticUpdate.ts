import { useState, useCallback } from 'react';

interface OptimisticUpdateOptions<T> {
  onUpdate: (data: T) => Promise<T>;
  onError?: (error: Error, previousData: T) => void;
  onSuccess?: (data: T) => void;
}

export function useOptimisticUpdate<T>(initialData: T, options: OptimisticUpdateOptions<T>) {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optimisticUpdate = useCallback(async (updateFn: (prev: T) => T) => {
    const previousData = data;
    const optimisticData = updateFn(previousData);
    
    // Immediately update UI with optimistic data
    setData(optimisticData);
    setIsUpdating(true);
    setError(null);

    try {
      // Perform actual update
      const result = await options.onUpdate(optimisticData);
      
      // Update with server response
      setData(result);
      options.onSuccess?.(result);
      
      return result;
    } catch (err) {
      // Revert to previous data on error
      setData(previousData);
      const error = err as Error;
      setError(error);
      options.onError?.(error, previousData);
      
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [data, options]);

  const reset = useCallback((newData: T) => {
    setData(newData);
    setError(null);
    setIsUpdating(false);
  }, []);

  return {
    data,
    isUpdating,
    error,
    optimisticUpdate,
    reset,
  };
}
