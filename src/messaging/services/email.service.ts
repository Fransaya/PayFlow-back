import { Injectable, Logger } from '@nestjs/common';
import { ResendProvider } from '../providers/resend.provider';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(to: string, subject: string, html: string, text: string) {
    try {
      const resendClient = ResendProvider.useValue;
      const response: any = await resendClient.emails.send({
        from: process.env.EMAIL_FROM || 'pedilo@sayasoft.com.ar',
        to,
        subject,
        html,
        text,
      });
      this.logger.log(`Email sent to ${to}: ${response}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }
}
