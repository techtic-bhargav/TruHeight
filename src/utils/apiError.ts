/**
 * Extract user-friendly error message from API error response.
 */
export const getApiErrorMessage = (error: any): string => {
  const data = error?.response?.data;
  if (!data) {
    return 'Network error. Please check your connection and try again.';
  }
  const msg = data?.message ?? data?.error ?? data?.data?.message;
  if (!msg) return 'Something went wrong. Please try again.';
  return Array.isArray(msg) ? msg.join(', ') : String(msg);
};
