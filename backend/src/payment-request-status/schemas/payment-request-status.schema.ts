import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type PaymentRequestStatusValue = 'canceled' | 'declined' | 'paid';

@Schema({ timestamps: true, collection: 'payment_request_status' })
export class PaymentRequestStatus {
  @Prop({ required: true, unique: true })
  contractId: string;

  @Prop({ required: true })
  status: PaymentRequestStatusValue;
}

export const PaymentRequestStatusSchema =
  SchemaFactory.createForClass(PaymentRequestStatus);
