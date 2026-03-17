import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Post('record')
  async record(
    @Body()
    body: {
      partyId: string;
      amount: number;
      transactionType: string;
      counterparty?: string;
    },
  ): Promise<{ ok: boolean }> {
    const partyId = body?.partyId != null ? String(body.partyId).trim() : '';
    const amount = Number(body?.amount);
    const transactionType =
      body?.transactionType != null ? String(body.transactionType).trim() : '';
    if (!partyId || Number.isNaN(amount) || !transactionType) {
      throw new BadRequestException(
        'partyId, amount and transactionType are required',
      );
    }
    await this.accounts.recordTransaction(
      partyId,
      amount,
      transactionType,
      body?.counterparty,
    );
    return { ok: true };
  }

  @Get('balance')
  async getBalance(
    @Query('partyId') partyId: string,
  ): Promise<{ balance: number | null }> {
    if (!partyId || typeof partyId !== 'string') {
      return { balance: null };
    }
    const balance = await this.accounts.getBalance(partyId.trim());
    return { balance: balance ?? null };
  }

  @Get('transactions')
  async getTransactions(
    @Query('partyId') partyId: string,
    @Query('limit') limit?: string,
  ): Promise<{
    transactions: Array<{
      amount: number;
      transactionType: string;
      counterparty?: string;
      createdAt: string;
    }>;
  }> {
    if (!partyId || typeof partyId !== 'string') {
      return { transactions: [] };
    }
    const limitNum =
      limit != null
        ? Math.min(Math.max(0, parseInt(limit, 10) || 100), 500)
        : 100;
    const list = await this.accounts.getTransactions(partyId.trim(), limitNum);
    return {
      transactions: list.map((transaction) => ({
        amount: transaction.amount,
        transactionType: transaction.transactionType,
        counterparty: transaction.counterparty,
        createdAt: transaction.createdAt.toISOString(),
      })),
    };
  }
}
