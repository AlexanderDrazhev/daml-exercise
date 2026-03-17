import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DamlModule } from './daml/daml.module';
import { ContractsController } from './contracts/contracts.controller';
import { DatabaseModule } from './database/database.module';
import { AppUsersModule } from './app-users/app-users.module';
import { BankModule } from './bank/bank.module';
import { AccountsModule } from './accounts/accounts.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    DamlModule,
    AppUsersModule,
    AccountsModule,
    BankModule,
    HealthModule,
  ],
  controllers: [AppController, ContractsController],
  providers: [AppService],
})
export class AppModule {}
