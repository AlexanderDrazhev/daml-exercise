import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppUser } from './schemas/app-user.schema';

@Injectable()
export class AppUsersService {
  constructor(
    @InjectModel(AppUser.name) private readonly appUserModel: Model<AppUser>,
  ) {}

  async register(
    partyId: string,
    displayName?: string,
    userId?: string,
  ): Promise<AppUser> {
    const display = displayName?.trim() ?? '';
    const rawUserId =
      userId != null && String(userId).trim() !== ''
        ? String(userId).trim()
        : undefined;
    const trimmedUserId = rawUserId?.toLowerCase();

    const updateFields = {
      partyId,
      displayName: display,
      updatedAt: new Date(),
      ...(trimmedUserId != null && { userId: trimmedUserId }),
    };

    if (trimmedUserId != null) {
      const existingByUserId = await this.appUserModel
        .findOne({ userId: trimmedUserId })
        .exec();
      if (existingByUserId) {
        const updated = await this.appUserModel
          .findOneAndUpdate(
            { userId: trimmedUserId },
            { $set: updateFields },
            { new: true },
          )
          .exec();
        return updated!;
      }
      const existingByPartyId = await this.appUserModel
        .findOne({ partyId })
        .exec();
      if (existingByPartyId) {
        const updated = await this.appUserModel
          .findOneAndUpdate({ partyId }, { $set: updateFields }, { new: true })
          .exec();
        return updated!;
      }
    } else {
      const existingByPartyId = await this.appUserModel
        .findOne({ partyId })
        .exec();
      if (existingByPartyId) {
        const updated = await this.appUserModel
          .findOneAndUpdate({ partyId }, { $set: updateFields }, { new: true })
          .exec();
        return updated!;
      }
    }

    const doc = await this.appUserModel
      .findOneAndUpdate(
        trimmedUserId != null ? { userId: trimmedUserId } : { partyId },
        { $set: updateFields },
        { new: true, upsert: true },
      )
      .exec();
    return doc;
  }

  async findAll(): Promise<{ partyId: string; displayName: string }[]> {
    const users = await this.appUserModel
      .find()
      .sort({ partyId: 1 })
      .lean()
      .exec();
    return users.map((user) => ({
      partyId: user.partyId,
      displayName: user.displayName || user.partyId,
    }));
  }
}
