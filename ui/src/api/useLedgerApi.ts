import { useMemo } from 'react';
import type { LedgerApi } from './ledgerApi';
import { createLedgerApi } from './ledgerApi';

export type { LedgerApi };

export function useLedgerApi(token: string | undefined): LedgerApi | null {
  return useMemo(() => (token ? createLedgerApi(token) : null), [token]);
}
