import {
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  UseFilters,
  Controller,
  Post,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';

import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';

import { ApiTags } from '@nestjs/swagger';

import { UserFromJWT } from '@src/types/userFromJWT';

import { NotificationService } from '../service/notification.service';

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
    @Body() body: { email: string; name: string },
  ): Promise<{ message: string }> {
    // Aquí iría la lógica para enviar la notificación de invitación
    // Por ejemplo, usando un servicio de notificaciones
    //TODO: logica para validar la intitaciones - pensar e implementar

    return { message: `Invitation sent to ${email}` };
  }
}
