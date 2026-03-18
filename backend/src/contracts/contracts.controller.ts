import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { DamlService } from '../daml/daml.service';
import { TEMPLATE_IDS } from '../daml/daml.constants';

const TEMPLATE_NAME_TO_ID: Record<string, string> = {
  User: TEMPLATE_IDS.User,
  Alias: TEMPLATE_IDS.Alias,
  HelloWorld: TEMPLATE_IDS.HelloWorld,
  Factory: TEMPLATE_IDS.Factory as string,
  Account: TEMPLATE_IDS.Account as string,
  Transaction: TEMPLATE_IDS.Transaction as string,
  TransferRequest: TEMPLATE_IDS.TransferRequest as string,
  PaymentRequest: TEMPLATE_IDS.PaymentRequest as string,
};

function getJwt(headers: Record<string, string | undefined>): string {
  const auth = headers.authorization || headers.Authorization;
  if (!auth?.startsWith('Bearer ')) {
    throw new UnauthorizedException(
      'Missing or invalid Authorization header (expected Bearer <token>)',
    );
  }
  return auth.slice(7);
}

@Controller('contracts')
export class ContractsController {
  constructor(private readonly daml: DamlService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  async query(
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      template: string;
      query?: Record<string, unknown>;
      readers?: string[];
    },
  ) {
    const jwt = getJwt(headers);
    const { template, query, readers } = body;
    const templateId = TEMPLATE_NAME_TO_ID[template];
    if (!templateId) {
      throw new BadRequestException(
        `Unknown template: ${template}. Use one of: User, Alias, HelloWorld, Factory, Account, Transaction, TransferRequest, PaymentRequest`,
      );
    }
    const readersFiltered =
      Array.isArray(readers) && readers.length > 0
        ? readers
            .map((reader) => (typeof reader === 'string' ? reader.trim() : ''))
            .filter(Boolean)
        : undefined;
    const result = await this.daml.query(
      { templateIds: [templateId], query, readers: readersFiltered },
      jwt,
    );
    return { result };
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  async create(
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { template: string; payload: Record<string, unknown> },
  ) {
    const jwt = getJwt(headers);
    const templateId = TEMPLATE_NAME_TO_ID[body.template];
    if (!templateId) {
      throw new BadRequestException(
        `Unknown template: ${body.template}. Use one of: User, Alias, HelloWorld, Factory, Account, Transaction, TransferRequest, PaymentRequest`,
      );
    }
    const result = await this.daml.create(templateId, body.payload, jwt);
    return result;
  }

  @Post('exercise')
  @HttpCode(HttpStatus.OK)
  async exercise(
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      template: string;
      contractId: string;
      choice: string;
      argument: Record<string, unknown>;
    },
  ) {
    const jwt = getJwt(headers);
    const templateId = TEMPLATE_NAME_TO_ID[body.template];
    if (!templateId) {
      throw new BadRequestException(
        `Unknown template: ${body.template}. Use one of: User, Alias, HelloWorld, Factory, Account, Transaction, TransferRequest, PaymentRequest`,
      );
    }
    const result = await this.daml.exercise(
      {
        templateId,
        contractId: body.contractId,
        choice: body.choice,
        argument: body.argument,
      },
      jwt,
    );
    return result;
  }

  @Post('exercise-by-key')
  @HttpCode(HttpStatus.OK)
  async exerciseByKey(
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      template: string;
      key: unknown;
      choice: string;
      argument: Record<string, unknown>;
    },
  ) {
    const jwt = getJwt(headers);
    const templateId = TEMPLATE_NAME_TO_ID[body.template];
    if (!templateId) {
      throw new BadRequestException(
        `Unknown template: ${body.template}. Use one of: User, Alias, HelloWorld, Factory, Account, Transaction, TransferRequest, PaymentRequest`,
      );
    }
    const result = await this.daml.exerciseByKey(
      templateId,
      body.key,
      body.choice,
      body.argument,
      jwt,
    );
    return result;
  }

  @Post('fetch-by-key')
  @HttpCode(HttpStatus.OK)
  async fetchByKey(
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { template: string; key: unknown },
  ) {
    const jwt = getJwt(headers);
    const templateId = TEMPLATE_NAME_TO_ID[body.template];
    if (!templateId) {
      throw new BadRequestException(
        `Unknown template: ${body.template}. Use one of: User, Alias, HelloWorld, Factory, Account, Transaction, TransferRequest, PaymentRequest`,
      );
    }
    const result = await this.daml.fetchByKey(
      { templateId, key: body.key },
      jwt,
    );
    return result ?? null;
  }
}
