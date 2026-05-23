export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: string }).message === 'string'
  ) {
    const message = (error as { message: string }).message.toLowerCase();
    if (message.includes('network error')) {
      return 'Network error. Ensure API server is running and reachable.';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }

  return fallback;
}
