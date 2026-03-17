import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DamlService } from './daml.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 0,
    }),
  ],
  providers: [DamlService],
  exports: [DamlService],
})
export class DamlModule {}
