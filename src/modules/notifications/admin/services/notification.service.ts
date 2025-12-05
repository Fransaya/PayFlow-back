import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '@src/messaging/services/email.service';

// Servicios de modulos externos
import { UserBusinessService } from '@src/modules/userBusiness/services/userBusiness.service';
import { TenantService } from '@src/modules/tenants/services/tenant.service';
import { UserOwnerService } from '@src/modules/userOwner/services/userOwner.service';

import { UserFromJWT } from '@src/types/userFromJWT';
import { createInviteToken } from '@src/modules/auth/utilities/createInviteToken';

// Modulo y dependencia de server websocket
import { WebSocketGatewayAdmin } from '@src/websocket/admin/WebSocketGateway';

// Tipos
import { PaymentNotificationPayload } from '@src/types/notifications';

interface InviteBusinessEmailData {
  employeeEmail: string;
  employeeName: string;
  storeName: string;
  ownerName: string;
  inviteUrl: string;
  roleName?: string;
  expiresIn?: string;
  primaryColor?: string;
  secondaryColor?: string;
  supportEmail?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly userBusinessService: UserBusinessService,
    private readonly tenantService: TenantService,
    private readonly userOwnerService: UserOwnerService,
    private readonly webSocketGatewayAdmin: WebSocketGatewayAdmin,
  ) {}

  //* --------------------------------- MODULO NOTIFICACIONES POR EMAIL ---------------------------
  /**
   * Envía email de invitación a un empleado para unirse a la tienda
   */
  async sendInviteBusinessEmail(
    data: { email: string; name: string; userId: string },
    userOwnerData: UserFromJWT,
  ): Promise<void> {
    try {
      //TODO: tipar la data
      const userInfoCompleteForTenant =
        await this.userBusinessService.getSpecificUserBusiness(
          userOwnerData.tenant_id,
          data.userId,
        );

      if (!userInfoCompleteForTenant) {
        throw new Error('User information not found for the tenant');
      }
      //TODO: tipar la data
      const tenantInfo = await this.tenantService.getTenantInfo(
        userOwnerData.tenant_id,
      );

      if (!tenantInfo) {
        throw new Error('Tenant information not found');
      }
      //TODO: tipar la data
      const userOwnerInfo = await this.userOwnerService.getUserOwnerInfo(
        userOwnerData.user_id,
        userOwnerData.tenant_id,
      );

      if (!userOwnerInfo) {
        throw new Error('User owner information not found');
      }

      // Genero token de invitacion
      const inviteToken = createInviteToken({
        tenant_id: userOwnerData.tenant_id,
        role_id: '0',
        expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        email_asociated: data.email,
        status: 'pending',
      });

      // Construir los datos del email
      const emailData: InviteBusinessEmailData = {
        employeeEmail: data.email,
        employeeName: data.name,
        storeName: tenantInfo.name,
        ownerName: userOwnerInfo.name,
        inviteUrl: `${process.env.FRONTEND_URL}/register-business?tenantId=${userOwnerData.tenant_id}&userId=${userInfoCompleteForTenant.user_id}&invite_token=${inviteToken}`,
        roleName: 'test',
        expiresIn: '48 horas',
        primaryColor: tenantInfo.primary_color || '#000000',
        secondaryColor: tenantInfo.secondary_color || '#000000',
        supportEmail: userOwnerInfo.email,
      };
      const subject = `Invitación a unirte a ${tenantInfo.name}`;

      await this.emailService.sendEmail({
        to: emailData.employeeEmail,
        subject,
        template: 'invite-business',
        context: emailData,
      });

      this.logger.log(
        `Invite email sent to ${emailData.employeeEmail} for ${emailData.storeName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send invite email to ${data.email}`, error);
      throw error;
    }
  }

  /**
   * Método legacy para compatibilidad
   * @deprecated Use sendInviteBusinessEmail instead
   */
  async sendNotificationEmail(body: {
    email: string;
    name: string;
  }): Promise<void> {
    const subject = 'Invitado a unirte a Pedilo';
    const html = `<h1>Hola ${body.name}</h1><p>Has sido invitado.</p>`;
    const text = `Hola ${body.name}, has sido invitado.`;

    return this.emailService.sendEmailDirect(body.email, subject, html, text);
  }

  //* ---------------------------------------------------------------------------------------------
  /**
   * Enviar de datos mediante websocket.
   */
  sendNewOrderNotification(tenantId: string, order: any): void {
    this.webSocketGatewayAdmin.sendNewOrderNotification(tenantId, order);
  }

  /**
   * Enviar notificación de actualización de estado de orden mediante websocket. ( este al cliente ) - despues se va comunicar con messages
   * @param tenantId
   * @param order
   */
  updateOrderStatusNotification(tenantId: string, order: any): void {
    this.webSocketGatewayAdmin.sendOrderStatusUpdate(tenantId, order);
  }

  /**
   * Enviar notificacion de pago recibido / procesado a cliente admin
   */
  sendNewPaymentStatus(
    tenantId: string,
    payment: PaymentNotificationPayload,
  ): void {
    this.webSocketGatewayAdmin.sendNewPaymentStatus(tenantId, payment);
  }
}
