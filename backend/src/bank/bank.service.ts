import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DamlService } from '../daml/daml.service';
import { TEMPLATE_IDS } from '../daml/daml.constants';
import { AccountsService } from '../accounts/accounts.service';
import * as jwt from 'jwt-simple';

const DEFAULT_LEDGER_ID = 'create-daml-app-sandbox';
const DEFAULT_JWT_SECRET = 'secret';
const BANK_USER_ID = 'bank';

const DEFAULT_BANK_NOTICE =
  'Welcome to the demo bank — deposits, transfers, and payment requests are on-ledger. Have fun exploring!';

function publishedAtToMicros(value: unknown): bigint {
  if (value == null) return 0n;
  if (typeof value === 'object' && value !== null && 'microseconds' in value) {
    const raw = (value as { microseconds: string | number }).microseconds;
    try {
      return BigInt(String(raw));
    } catch {
      return 0n;
    }
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    if (!Number.isNaN(ms)) return BigInt(ms) * 1000n;
  }
  return 0n;
}

@Injectable()
export class BankService {
  constructor(
    private readonly daml: DamlService,
    private readonly config: ConfigService,
    private readonly accounts: AccountsService,
  ) {}

  private getBankToken(): string {
    const secret =
      this.config.get<string>('DAML_JWT_SECRET') || DEFAULT_JWT_SECRET;
    const payload = {
      sub: BANK_USER_ID,
      scope: 'daml_ledger_api',
      ledgerId: this.config.get<string>('DAML_LEDGER_ID') || DEFAULT_LEDGER_ID,
    };
    return jwt.encode(payload, secret, 'HS256');
  }

  async getBankPartyId(): Promise<string> {
    const token = this.getBankToken();
    const factories = await this.daml.query(
      { templateIds: [TEMPLATE_IDS.Factory] },
      token,
    );
    const factory = factories[0];
    if (!factory?.payload) {
      throw new Error('Factory contract not found');
    }
    const bank = (factory.payload as { bank: string }).bank;
    if (!bank) {
      throw new Error('Factory payload missing bank');
    }
    return bank;
  }

  async createAccount(ownerPartyId: string): Promise<{ contractId: string }> {
    const token = this.getBankToken();
    const factories = await this.daml.query(
      { templateIds: [TEMPLATE_IDS.Factory] },
      token,
    );
    const factory = factories[0];
    if (!factory) {
      throw new Error('Factory contract not found');
    }
    const result = await this.daml.exercise(
      {
        templateId: TEMPLATE_IDS.Factory,
        contractId: factory.contractId,
        choice: 'CreateAccount',
        argument: { owner: ownerPartyId },
      },
      token,
    );
    await this.accounts.setBalance(ownerPartyId, 0);
    return {
      contractId: (result as { exerciseResult: string }).exerciseResult,
    };
  }

  async executeTransfer(transferRequestCid: string): Promise<void> {
    const token = this.getBankToken();
    const req = await this.daml.fetch(
      transferRequestCid,
      token,
      TEMPLATE_IDS.TransferRequest,
    );
    if (!req || !req.payload) {
      throw new Error('Transfer request not found');
    }
    const payload = req.payload as {
      sender: string;
      recipient: string;
      amount: string;
    };
    const sender = payload.sender;
    const recipient = payload.recipient;
    const amount = Number(payload.amount);
    await this.daml.exercise(
      {
        templateId: TEMPLATE_IDS.TransferRequest,
        contractId: transferRequestCid,
        choice: 'ExecuteTransfer',
        argument: {},
      },
      token,
    );
    await this.accounts.recordTransaction(
      sender,
      -amount,
      'Transfer',
      recipient,
    );
    await this.accounts.recordTransaction(
      recipient,
      amount,
      'Transfer',
      sender,
    );
  }

  async bankTransfer(
    fromPartyId: string,
    toPartyId: string,
    amount: string,
  ): Promise<void> {
    const token = this.getBankToken();
    const from = fromPartyId.trim();
    const to = toPartyId.trim();
    const amountNum = Number(amount);
    const factories = await this.daml.query(
      { templateIds: [TEMPLATE_IDS.Factory] },
      token,
    );
    const factory = factories[0];
    if (!factory) {
      throw new Error('Factory contract not found');
    }
    await this.daml.exercise(
      {
        templateId: TEMPLATE_IDS.Factory,
        contractId: factory.contractId,
        choice: 'BankTransfer',
        argument: { fromOwner: from, toOwner: to, amount },
      },
      token,
    );
    await this.accounts.recordTransaction(from, -amountNum, 'BankTransfer', to);
    await this.accounts.recordTransaction(to, amountNum, 'BankTransfer', from);
  }

  /**
   * Latest bank notice from on-ledger `BankNotice` contracts (Setup publishes the first;
   * bank updates via nonconsuming `Factory.PublishBankNotice`).
   */
  async getAnnouncementMessage(): Promise<string> {
    const token = this.getBankToken();
    const rows = await this.daml.query(
      { templateIds: [TEMPLATE_IDS.BankNotice] },
      token,
    );
    if (rows.length === 0) return DEFAULT_BANK_NOTICE;
    let best: { message: string; t: bigint } | null = null;
    for (const row of rows) {
      const payload = row.payload as {
        message?: unknown;
        publishedAt?: unknown;
      };
      const message =
        typeof payload.message === 'string' ? payload.message : '';
      const t = publishedAtToMicros(payload.publishedAt);
      if (!best || t > best.t) best = { message, t };
    }
    const msg = best?.message?.trim();
    if (msg) return msg;
    return DEFAULT_BANK_NOTICE;
  }

  async updateAnnouncement(newMessage: string): Promise<void> {
    const trimmed = newMessage.trim();
    const token = this.getBankToken();
    const factories = await this.daml.query(
      { templateIds: [TEMPLATE_IDS.Factory] },
      token,
    );
    const factory = factories[0];
    if (!factory) {
      throw new Error('Factory contract not found');
    }
    await this.daml.exercise(
      {
        templateId: TEMPLATE_IDS.Factory,
        contractId: factory.contractId,
        choice: 'PublishBankNotice',
        argument: { newMessage: trimmed },
      },
      token,
    );
  }
}
