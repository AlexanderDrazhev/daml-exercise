import { apiClient } from './client';

export const bankApi = {
  getBankParty: () =>
    apiClient.get<{ partyId: string }>('/api/bank/party').then((response) => response.data.partyId),

  getAnnouncement: () =>
    apiClient
      .get<{ message: string }>('/api/bank/announcement')
      .then((response) => response.data),

  updateAnnouncement: (message: string) =>
    apiClient
      .post<{ ok: boolean }>('/api/bank/announcement', { message })
      .then(() => undefined),

  createAccount: (partyId: string) =>
    apiClient
      .post<{ contractId: string }>('/api/bank/create-account', { partyId })
      .then((response) => response.data),

  executeTransfer: (transferRequestCid: string) =>
    apiClient
      .post<{ ok: boolean }>('/api/bank/execute-transfer', {
        transferRequestCid,
      })
      .then(() => undefined),

  bankTransfer: (fromPartyId: string, toPartyId: string, amount: string) =>
    apiClient
      .post<{ ok: boolean }>('/api/bank/transfer', {
        fromPartyId,
        toPartyId,
        amount,
      })
      .then(() => undefined),
};
