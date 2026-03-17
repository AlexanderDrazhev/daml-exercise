import { createLedgerClient } from './client';

export type TemplateName =
  | 'User'
  | 'Alias'
  | 'HelloWorld'
  | 'Factory'
  | 'Account'
  | 'Transaction'
  | 'TransferRequest';

export interface ContractResult {
  contractId: string;
  payload: Record<string, unknown>;
  templateId?: string;
}

function createLedgerApi(token: string) {
  const client = createLedgerClient(token);
  const base = '/api/contracts';

  return {
    query: (
      template: TemplateName,
      query?: Record<string, unknown>,
      readers?: string[],
    ) =>
      client
        .post<{ result: ContractResult[] }>(`${base}/query`, {
          template,
          ...(query != null && { query }),
          ...(readers?.length && { readers }),
        })
        .then((response) => response.data?.result ?? []),

    create: (template: TemplateName, payload: Record<string, unknown>) =>
      client
        .post<ContractResult>(`${base}/create`, { template, payload })
        .then((response) => response.data),

    exercise: (
      template: TemplateName,
      contractId: string,
      choice: string,
      argument: Record<string, unknown>,
    ) =>
      client
        .post<{ exerciseResult: unknown }>(`${base}/exercise`, {
          template,
          contractId,
          choice,
          argument,
        })
        .then((response) => response.data),

    fetchByKey: (
      template: TemplateName,
      key: Record<string, unknown> | string,
    ) =>
      client
        .post<ContractResult | null>(`${base}/fetch-by-key`, { template, key })
        .then((response) => response.data ?? null),

    exerciseByKey: (
      template: TemplateName,
      key: unknown,
      choice: string,
      argument: Record<string, unknown>,
    ) =>
      client
        .post<{ exerciseResult: unknown }>(`${base}/exercise-by-key`, {
          template,
          key,
          choice,
          argument,
        })
        .then((response) => response.data),
  };
}

export { createLedgerApi };
export type LedgerApi = ReturnType<typeof createLedgerApi>;
