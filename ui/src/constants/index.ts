export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : '');

export const ROUTES = {
  HOME: '/',
} as const;
