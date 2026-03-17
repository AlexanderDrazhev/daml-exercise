import { apiClient } from './client';

export const accountsApi = {
  getBalance: (partyId: string) =>
    apiClient
      .get<{ balance: number | null }>('/api/accounts/balance', { params: { partyId } })
      .then((response) => response.data.balance),

  getTransactions: (partyId: string, limit?: number) =>
    apiClient
      .get<{ transactions: Array<{ amount: number; transactionType: string; counterparty?: string; createdAt: string }> }>(
        '/api/accounts/transactions',
        { params: { partyId, limit } },
      )
      .then((response) => response.data.transactions),

  record: (partyId: string, amount: number, transactionType: string, counterparty?: string) =>
    apiClient
      .post<{ ok: boolean }>('/api/accounts/record', {
        partyId,
        amount,
        transactionType,
        ...(counterparty != null && counterparty !== '' && { counterparty }),
      })
      .then(() => undefined),
};
