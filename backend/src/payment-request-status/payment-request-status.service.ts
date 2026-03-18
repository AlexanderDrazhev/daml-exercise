import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PaymentRequestStatus,
  PaymentRequestStatusValue,
} from './schemas/payment-request-status.schema';

@Injectable()
export class PaymentRequestStatusService {
  constructor(
    @InjectModel(PaymentRequestStatus.name)
    private readonly statusModel: Model<PaymentRequestStatus>,
  ) {}

  async recordStatus(
    contractId: string,
    status: PaymentRequestStatusValue,
  ): Promise<void> {
    await this.statusModel
      .findOneAndUpdate(
        { contractId },
        { $set: { status } },
        { new: true, upsert: true },
      )
      .exec();
  }

  async getStatusMap(
    contractIds: string[],
  ): Promise<Record<string, PaymentRequestStatusValue>> {
    if (contractIds.length === 0) return {};
    const docs = await this.statusModel
      .find({ contractId: { $in: contractIds } })
      .lean()
      .exec();
    return (docs as { contractId: string; status: PaymentRequestStatusValue }[]).reduce(
      (acc, doc) => {
        acc[doc.contractId] = doc.status;
        return acc;
      },
      {} as Record<string, PaymentRequestStatusValue>,
    );
  }
}
