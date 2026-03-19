import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { BankService } from './bank.service';

@Controller('bank')
export class BankController {
  constructor(private readonly bank: BankService) {}

  @Get('party')
  async getParty(): Promise<{ partyId: string }> {
    const partyId = await this.bank.getBankPartyId();
    return { partyId };
  }

  @Post('create-account')
  async createAccount(@Body() body: { partyId: string }) {
    const partyId = body?.partyId;
    if (!partyId || typeof partyId !== 'string') {
      throw new BadRequestException('partyId is required');
    }
    return this.bank.createAccount(partyId.trim());
  }

  @Post('execute-transfer')
  async executeTransfer(@Body() body: { transferRequestCid: string }) {
    const transferRequestCid = body?.transferRequestCid;
    if (!transferRequestCid || typeof transferRequestCid !== 'string') {
      throw new BadRequestException('transferRequestCid is required');
    }
    await this.bank.executeTransfer(transferRequestCid.trim());
    return { ok: true };
  }

  @Get('announcement')
  async getAnnouncement(): Promise<{ message: string }> {
    const message = await this.bank.getAnnouncementMessage();
    return { message };
  }

  @Post('announcement')
  async updateAnnouncement(@Body() body: { message?: string }) {
    const message = body?.message;
    if (message === undefined || typeof message !== 'string') {
      throw new BadRequestException('message is required');
    }
    if (message.length > 2000) {
      throw new BadRequestException('message must be at most 2000 characters');
    }
    await this.bank.updateAnnouncement(message);
    return { ok: true };
  }

  @Post('transfer')
  async bankTransfer(
    @Body() body: { fromPartyId: string; toPartyId: string; amount: string },
  ) {
    const { fromPartyId, toPartyId, amount } = body ?? {};
    if (!fromPartyId || typeof fromPartyId !== 'string') {
      throw new BadRequestException('fromPartyId is required');
    }
    if (!toPartyId || typeof toPartyId !== 'string') {
      throw new BadRequestException('toPartyId is required');
    }
    if (amount === undefined || amount === null || typeof amount !== 'string') {
      throw new BadRequestException('amount is required');
    }
    await this.bank.bankTransfer(fromPartyId, toPartyId, amount);
    return { ok: true };
  }
}
