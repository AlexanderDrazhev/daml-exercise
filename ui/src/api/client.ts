import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL } from '../constants';

function buildBaseURL(): string {
  const base = API_BASE_URL || '';
  return base.replace(/\/$/, '');
}

function getMessageFromError(err: AxiosError): string {
  const data = err.response?.data;
  if (data && typeof data === 'object' && typeof (data as { message?: unknown }).message === 'string') {
    return (data as { message: string }).message;
  }
  if (data && typeof data === 'object' && Array.isArray((data as { errors?: unknown }).errors)) {
    return (data as { errors: string[] }).errors?.join?.(' ') || err.message;
  }
  return err.response?.statusText || err.message || 'Request failed';
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: buildBaseURL(),
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });
  client.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      const message = getMessageFromError(err);
      return Promise.reject(new Error(message));
    },
  );
  return client;
}

export function createLedgerClient(token: string): AxiosInstance {
  const client = axios.create({
    baseURL: buildBaseURL(),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
  client.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      const message = getMessageFromError(err);
      return Promise.reject(new Error(message));
    },
  );
  return client;
}

const apiClient = createApiClient();
export { apiClient };
