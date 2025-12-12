import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';

// Dto
import { SendEmailDto } from '../dto/sendEmail.dto';

@Controller('notifications/public')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  async sendEmail(@Body() body: SendEmailDto) {
    return this.notificationService.sendEmail(body);
  }
}
