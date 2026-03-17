import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { AppUsersService } from './app-users.service';

@Controller('users')
export class AppUsersController {
  private readonly logger = new Logger(AppUsersController.name);

  constructor(private readonly appUsersService: AppUsersService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const user = await this.appUsersService.register(
      dto.partyId,
      dto.displayName,
      dto.userId,
    );
    this.logger.log(
      `User registered in DB: userId=${user.userId ?? '-'} partyId=${user.partyId} displayName=${user.displayName}`,
    );
    return user;
  }

  @Get()
  async list() {
    return this.appUsersService.findAll();
  }
}
