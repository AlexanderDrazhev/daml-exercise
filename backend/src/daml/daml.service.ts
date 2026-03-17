import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { TEMPLATE_IDS } from './daml.constants';

const DEFAULT_JSON_API_URL = 'http://127.0.0.1:7575';

export interface QueryRequest {
  templateIds: string[];
  query?: Record<string, unknown>;
  readers?: string[];
}

export interface CreateRequest {
  templateId: string;
  payload: Record<string, unknown>;
}

export interface ExerciseRequest {
  templateId: string;
  contractId: string;
  choice: string;
  argument: Record<string, unknown>;
  choiceInterfaceId?: string;
}

export interface FetchByKeyRequest {
  templateId: string;
  key: unknown;
}

@Injectable()
export class DamlService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl =
      this.config.get<string>('DAML_JSON_API_URL') || DEFAULT_JSON_API_URL;
  }

  private async request<T>(
    method: string,
    path: string,
    jwt: string,
    body?: object,
  ): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/v1${path}`;
    const { data } = await firstValueFrom(
      this.httpService.request<T>({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        data: body,
        validateStatus: () => true,
      }),
    );
    const response = data as { status?: number; result?: T; errors?: string[] };
    if (response.status && response.status >= 400) {
      throw new Error(
        response.errors?.join('; ') || `DAML API error: ${response.status}`,
      );
    }
    return (response.result ?? response) as T;
  }

  async query(
    req: QueryRequest,
    jwt: string,
  ): Promise<
    Array<{
      contractId: string;
      payload: Record<string, unknown>;
      templateId: string;
    }>
  > {
    const body: Record<string, unknown> = {
      templateIds: req.templateIds,
      ...(req.query != null && { query: req.query }),
      ...(req.readers != null &&
        req.readers.length > 0 && { readers: req.readers }),
    };
    const result = await this.request<
      Array<{
        contractId: string;
        payload: Record<string, unknown>;
        templateId: string;
      }>
    >('POST', '/query', jwt, body);
    return Array.isArray(result) ? result : [];
  }

  async create(
    templateId: string,
    payload: Record<string, unknown>,
    jwt: string,
  ): Promise<{ contractId: string; payload: Record<string, unknown> }> {
    const result = await this.request<{
      contractId: string;
      payload: Record<string, unknown>;
    }>('POST', '/create', jwt, { templateId, payload });
    return result;
  }

  async exercise(
    req: ExerciseRequest,
    jwt: string,
  ): Promise<{ exerciseResult: unknown; events?: unknown[] }> {
    return this.request('POST', '/exercise', jwt, req);
  }

  async exerciseByKey(
    templateId: string,
    key: unknown,
    choice: string,
    argument: Record<string, unknown>,
    jwt: string,
  ): Promise<{ exerciseResult: unknown; events?: unknown[] }> {
    return this.request('POST', '/exercise', jwt, {
      templateId,
      key,
      choice,
      argument,
    });
  }

  async fetch(
    contractId: string,
    jwt: string,
    templateId?: string,
  ): Promise<{ contractId: string; payload: Record<string, unknown> } | null> {
    const body: { contractId: string; templateId?: string } = { contractId };
    if (templateId) body.templateId = templateId;
    const result = await this.request<{
      contractId: string;
      payload: Record<string, unknown>;
    } | null>('POST', '/fetch', jwt, body);
    return result;
  }

  async fetchByKey(
    req: FetchByKeyRequest,
    jwt: string,
  ): Promise<{ contractId: string; payload: Record<string, unknown> } | null> {
    const result = await this.request<{
      contractId: string;
      payload: Record<string, unknown>;
    } | null>('POST', '/fetch', jwt, {
      templateId: req.templateId,
      key: req.key,
    });
    return result;
  }

  getTemplateIds() {
    return TEMPLATE_IDS;
  }
}
