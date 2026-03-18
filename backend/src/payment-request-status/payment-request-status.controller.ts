import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { PaymentRequestStatusService } from './payment-request-status.service';
import { PaymentRequestStatusValue } from './schemas/payment-request-status.schema';

const VALID_STATUSES: PaymentRequestStatusValue[] = [
  'canceled',
  'declined',
  'paid',
];

@Controller('payment-requests')
export class PaymentRequestStatusController {
  constructor(private readonly status: PaymentRequestStatusService) {}

  @Post('status')
  @HttpCode(HttpStatus.OK)
  async recordStatus(
    @Body() body: { contractId?: string; status?: string },
  ): Promise<{ ok: true }> {
    if (!body.contractId?.trim()) {
      throw new BadRequestException('contractId is required');
    }
    if (
      !body.status ||
      !VALID_STATUSES.includes(body.status as PaymentRequestStatusValue)
    ) {
      throw new BadRequestException(
        `status must be one of: ${VALID_STATUSES.join(', ')}`,
      );
    }
    await this.status.recordStatus(
      body.contractId.trim(),
      body.status as PaymentRequestStatusValue,
    );
    return { ok: true };
  }

  @Get('status')
  async getStatus(
    @Query('contractIds') contractIds: string,
  ): Promise<Record<string, PaymentRequestStatusValue>> {
    const ids = contractIds
      ? contractIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    return this.status.getStatusMap(ids);
  }
}
