import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'app_users' })
export class AppUser {
  @Prop({ sparse: true, unique: true })
  userId?: string;

  @Prop({ required: true })
  partyId: string;

  @Prop({ default: '' })
  displayName: string;
}

export const AppUserSchema = SchemaFactory.createForClass(AppUser);
