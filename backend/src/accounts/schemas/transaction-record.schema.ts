import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'transaction_records' })
export class TransactionRecord {
  @Prop({ required: true, index: true })
  partyId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  transactionType: string;

  @Prop()
  counterparty?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const TransactionRecordSchema =
  SchemaFactory.createForClass(TransactionRecord);
