import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'account_balances' })
export class AccountBalance {
  @Prop({ required: true, unique: true })
  partyId: string;

  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AccountBalanceSchema =
  SchemaFactory.createForClass(AccountBalance);
