import {
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  UseFilters,
  Controller,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

import { HttpExceptionFilter } from '../../../../common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';

import { ApiTags } from '@nestjs/swagger';

import { UserFromJWT } from '@src/types/userFromJWT';

import { NotificationService } from '../services/notification.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseFilters(HttpExceptionFilter)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('invite')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseFilters(HttpExceptionFilter)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async sendInvitationNotification(
    @CurrentUser() user: UserFromJWT,
    @Body() body: { email: string; name: string; userId: string },
  ): Promise<{ message: string }> {
    await this.notificationService.sendInviteBusinessEmail(body, user);

    return { message: 'Invitation notification sent successfully' };
  }
}
