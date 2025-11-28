import { Injectable, Logger } from '@nestjs/common';
import { ResendProvider } from '../providers/resend.provider';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface SendEmailOptions {
  to: string;
  subject: string;
  template?: string; // Nombre del template sin extensión
  context?: Record<string, any>; // Variables para el template
  html?: string; // HTML directo (si no usas template)
  text?: string; // Texto plano alternativo
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly templatesPath = path.join(
    __dirname,
    '..',
    '..',
    'messaging',
    'templates',
  );

  /**
   * Envía un email usando un template de Handlebars o HTML directo
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      let html = options.html;
      let text = options.text;

      // Si se proporciona un template, compilarlo
      if (options.template && options.context) {
        html = this.compileTemplate(options.template, options.context);
        // Generar texto plano básico del nombre del template si no se proporciona
        text = text || `Email enviado desde ${options.template}`;
      }

      if (!html) {
        throw new Error('Debe proporcionar HTML o un template');
      }
      //TODO: ver porque aca cuando invito luego de crear el usuario no envia el correo. (revisar)
      const resendClient = ResendProvider.useValue;
      const response: any = await resendClient.emails.send({
        from: process.env.EMAIL_FROM || 'pedilo@sayasoft.com.ar',
        to: options.to,
        subject: options.subject,
        html,
        text,
      });

      this.logger.log(
        `Email sent to ${options.to}: ${JSON.stringify(response)}`,
      );
    } catch (error) {
      console.log('error in email service', error);
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  /**
   * Compila un template de Handlebars con el contexto proporcionado
   */
  private compileTemplate(templateName: string, context: Record<string, any>) {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);

      // Verificar que el template existe
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      // Leer el archivo del template
      const templateSource = fs.readFileSync(templatePath, 'utf-8');

      // Compilar el template
      const template = handlebars.compile(templateSource);

      // Renderizar con el contexto
      return template(context);
    } catch (error) {
      this.logger.error(`Failed to compile template ${templateName}`, error);
      throw error;
    }
  }

  /**
   * Método legacy para compatibilidad con código existente
   * @deprecated Use sendEmail con options object
   */
  async sendEmailDirect(
    to: string,
    subject: string,
    html: string,
    text: string,
  ): Promise<void> {
    return this.sendEmail({ to, subject, html, text });
  }
}
