import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountBalance } from './schemas/account-balance.schema';
import { TransactionRecord } from './schemas/transaction-record.schema';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(AccountBalance.name)
    private readonly balanceModel: Model<AccountBalance>,
    @InjectModel(TransactionRecord.name)
    private readonly txModel: Model<TransactionRecord>,
  ) {}

  async setBalance(partyId: string, balance: number): Promise<void> {
    await this.balanceModel
      .findOneAndUpdate(
        { partyId },
        { $set: { balance, updatedAt: new Date() } },
        { new: true, upsert: true },
      )
      .exec();
  }

  async recordTransaction(
    partyId: string,
    amount: number,
    transactionType: string,
    counterparty?: string,
  ): Promise<void> {
    await this.txModel.create({
      partyId,
      amount,
      transactionType,
      counterparty,
    });
    await this.balanceModel
      .findOneAndUpdate(
        { partyId },
        { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
        { new: true, upsert: true },
      )
      .exec();
  }

  async getBalance(partyId: string): Promise<number | null> {
    const doc = await this.balanceModel.findOne({ partyId }).lean().exec();
    return doc?.balance ?? null;
  }

  async getTransactions(
    partyId: string,
    limit = 100,
  ): Promise<
    {
      amount: number;
      transactionType: string;
      counterparty?: string;
      createdAt: Date;
    }[]
  > {
    const list = await this.txModel
      .find({ partyId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    return list.map((transaction) => ({
      amount: transaction.amount,
      transactionType: transaction.transactionType,
      counterparty: transaction.counterparty,
      createdAt: transaction.createdAt,
    }));
  }
}
