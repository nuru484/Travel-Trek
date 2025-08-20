export const extractApiErrorMessage = (error: unknown): string | null => {
  if (!error) return null;

  // Handle string errors
  if (typeof error === 'string') return error;

  // Handle RTK Query or API errors
  if (typeof error === 'object' && error !== null) {
    // RTK Query error with status and data
    if ('status' in error && 'data' in error) {
      const { data } = error;
      if (typeof data === 'string') return data;
      if (data && typeof data === 'object') {
        if ('message' in data && typeof data.message === 'string')
          return data.message;
        if ('error' in data && typeof data.error === 'string')
          return data.error;
        if ('errors' in data && Array.isArray(data.errors)) {
          return data.errors.map((e: { message?: string }) => e.message || String(e)).join(', ');
        }
      }
    }

    // JavaScript Error or objects with message
    if ('message' in error && typeof error.message === 'string')
      return error.message;
  }

  // Fallback
  return 'An unknown error occurred';
};
