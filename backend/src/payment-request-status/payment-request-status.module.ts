import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PaymentRequestStatus,
  PaymentRequestStatusSchema,
} from './schemas/payment-request-status.schema';
import { PaymentRequestStatusService } from './payment-request-status.service';
import { PaymentRequestStatusController } from './payment-request-status.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentRequestStatus.name, schema: PaymentRequestStatusSchema },
    ]),
  ],
  controllers: [PaymentRequestStatusController],
  providers: [PaymentRequestStatusService],
  exports: [PaymentRequestStatusService],
})
export class PaymentRequestStatusModule {}
