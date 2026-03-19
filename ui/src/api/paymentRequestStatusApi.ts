import { apiClient } from './client';

export type PaymentRequestStatusType = 'canceled' | 'declined' | 'paid';

export const paymentRequestStatusApi = {
  getStatusMap(
    contractIds: string[],
  ): Promise<Record<string, PaymentRequestStatusType>> {
    if (contractIds.length === 0) return Promise.resolve({});
    return apiClient
      .get<Record<string, PaymentRequestStatusType>>('/api/payment-requests/status', {
        params: { contractIds: contractIds.join(',') },
      })
      .then((r) => r.data);
  },

  recordStatus(
    contractId: string,
    status: PaymentRequestStatusType,
  ): Promise<void> {
    return apiClient
      .post<{ ok: true }>('/api/payment-requests/status', {
        contractId,
        status,
      })
      .then(() => undefined);
  },
};
