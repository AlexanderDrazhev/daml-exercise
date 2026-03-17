export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  if (
    error &&
    typeof error === 'object' &&
    'errors' in error &&
    Array.isArray((error as { errors: unknown }).errors)
  ) {
    return (error as { errors: string[] }).errors.join('; ');
  }
  try {
    const stringified = JSON.stringify(error);
    if (stringified !== "{}" && stringified !== "undefined") return stringified;
  } catch (stringifyError: unknown) {
    // JSON.stringify can throw for circular references; fall back to String()
  }
  return String(error);
}
