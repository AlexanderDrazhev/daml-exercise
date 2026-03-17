import { Module } from '@nestjs/common';
import { DamlModule } from '../daml/daml.module';
import { AccountsModule } from '../accounts/accounts.module';
import { BankController } from './bank.controller';
import { BankService } from './bank.service';

@Module({
  imports: [DamlModule, AccountsModule],
  controllers: [BankController],
  providers: [BankService],
})
export class BankModule {}
