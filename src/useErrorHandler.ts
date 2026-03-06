import { useState, useCallback } from 'react';

/**
 * Hook for centralized error handling and logging.
 */
export function useErrorHandler(appendLog: (log: string) => void) {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((message: string, err?: Error) => {
    setError(message);
    appendLog(`${message}${err ? `: ${err.message}` : ''}`);
  }, [appendLog]);

  const clearError = useCallback(() => setError(null), []);

  return { error, handleError, clearError };
}
