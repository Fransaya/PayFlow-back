import { EmailService } from '@src/messaging/services/email.service';

export class NotificationService {
  constructor(private readonly emailService: EmailService) {}

  async sendNotificationEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
  ) {
    return this.emailService.sendEmail(to, subject, html, text);
  }
}
