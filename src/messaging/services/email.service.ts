import { Injectable, Logger } from '@nestjs/common';
import { ResendProvider } from '../providers/resend.provider';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { EMAIL_CONTRAINTS_ACCEPTED } from '@src/constants/app.contants';

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
  async sendEmail(options: SendEmailOptions, emailRef: string): Promise<void> {
    try {
      let html = options.html;
      let text = options.text;

      if (
        emailRef &&
        !Object.values(EMAIL_CONTRAINTS_ACCEPTED).includes(emailRef)
      ) {
        throw new Error(`Email reference ${emailRef} is not accepted.`);
      }

      const emailFrom =
        EMAIL_CONTRAINTS_ACCEPTED[
          emailRef as keyof typeof EMAIL_CONTRAINTS_ACCEPTED
        ];

      // Si se proporciona un template, compilarlo
      if (options.template && options.context) {
        html = this.compileTemplate(options.template, options.context);
        // Generar texto plano básico del nombre del template si no se proporciona
        text = text || `Email enviado desde ${options.template}`;
      }

      if (!html) {
        throw new Error('Debe proporcionar HTML o un template');
      }
      const resendClient = ResendProvider.useValue;
      const response: any = await resendClient.emails.send({
        from: emailFrom || 'soporte@pedilo.app',
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

  async sendEmailDirectFromPublic(
    userEmail: string, // El email del usuario que contacta
    subject: string,
    message: string,
    emailRef: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Processing contact form from: ${userEmail} with ref: ${emailRef}`,
    );

    const resendClient = ResendProvider.useValue;

    // 1. Determinar el remitente autorizado (tu dominio)
    const systemSenderEmail =
      EMAIL_CONTRAINTS_ACCEPTED[
        emailRef as keyof typeof EMAIL_CONTRAINTS_ACCEPTED
      ] || 'soporte@pedilo.app';

    // 2. Definir el buzón donde TÚ quieres recibir los mensajes
    const internalSupportEmail = 'soporte@pedilo.app'; // O un env var: process.env.SUPPORT_EMAIL

    try {
      // --- Preparar Email para el USUARIO (Confirmación) ---
      const userConfirmationHtml = `
        <div style="font-family: sans-serif;">
          <h2>Hemos recibido tu mensaje</h2>
          <p>Hola,</p>
          <p>Gracias por contactar a <strong>Pedilo</strong>. Hemos recibido tu consulta sobre: "<em>${subject}</em>".</p>
          <p>Nuestro equipo revisará tu mensaje y te responderá a la brevedad.</p>
          <br/>
          <p>Saludos,<br/>El equipo de Pedilo</p>
        </div>
      `;

      // --- Preparar Email para el EQUIPO INTERNO (Notificación) ---
      const internalNotificationHtml = `
        <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
          <h3>🔔 Nuevo Mensaje de Contacto</h3>
          <p><strong>De:</strong> ${userEmail}</p>
          <p><strong>Asunto:</strong> ${subject}</p>
          <hr/>
          <p><strong>Mensaje Original:</strong></p>
          <blockquote style="background: #f9f9f9; padding: 15px; border-left: 5px solid #0070f3;">
            ${message.replace(/\n/g, '<br>')}
          </blockquote>
          <hr/>
          <p style="color: #666; font-size: 12px;">
            Tip: Simplemente dale a "Responder" a este correo para escribirle directamente al usuario.
          </p>
        </div>
      `;

      // 3. Ejecutar envíos en Paralelo (Performance 🚀)
      // No queremos que el usuario espere a que se envíen dos correos secuenciales.
      const [userResponse, internalResponse] = await Promise.all([
        // Email al Usuario
        resendClient.emails.send({
          from: systemSenderEmail,
          to: userEmail,
          subject: 'Hemos recibido tu mensaje - Pedilo',
          html: userConfirmationHtml,
        }),
        // Email al Equipo Interno
        resendClient.emails.send({
          from: systemSenderEmail, // Debe salir de tu dominio verificado
          to: internalSupportEmail, // Te llega a ti
          replyTo: userEmail, // <--- LA MAGIA: Al responder, respondes al usuario
          subject: `[Contacto Web] ${subject}`, // Prefijo para filtrar fácil en tu inbox
          html: internalNotificationHtml,
        }),
      ]);

      // 4. Logging y Verificación
      if (userResponse.error || internalResponse.error) {
        this.logger.error('Error sending one of the emails', {
          userResponse,
          internalResponse,
        });
        // Aquí podrías decidir si lanzar error o devolver success false parcial
        // Para este caso, si falla el interno, deberías saberlo (alerting)
      }

      this.logger.log(`Contact process completed for ${userEmail}`);

      return {
        success: true,
        message: 'Hemos recibido tu mensaje y notificado al equipo.',
      };
    } catch (error) {
      this.logger.error('Critical error in sendEmailDirectFromPublic', error);
      // Nunca devuelvas el error crudo al frontend por seguridad
      throw new Error(
        'Hubo un problema procesando tu solicitud. Por favor intenta más tarde.',
      );
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
    emailRef: string,
  ): Promise<void> {
    return this.sendEmail({ to, subject, html, text }, emailRef);
  }
}
