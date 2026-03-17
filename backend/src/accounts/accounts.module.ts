import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AccountBalance,
  AccountBalanceSchema,
} from './schemas/account-balance.schema';
import {
  TransactionRecord,
  TransactionRecordSchema,
} from './schemas/transaction-record.schema';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccountBalance.name, schema: AccountBalanceSchema },
      { name: TransactionRecord.name, schema: TransactionRecordSchema },
    ]),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
