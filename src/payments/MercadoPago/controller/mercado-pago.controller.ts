import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  Delete,
  UnauthorizedException,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';
// Servicio internos de nest
import { ConfigService } from '@nestjs/config';

// Servicio de mercado pago
import { MercadoPagoService } from '../services/mercado-pago.service';

// Modulo / Middleware de autenticacion
import { JwtGuard } from '@src/guards/jwt.guard';

// Tipos del user obtenido del decorador
import { UserFromJWT } from '@src/types/userFromJWT';

// Tipos de express
import { Request, Response } from 'express';

@Controller('mercado-pago')
export class MercadoPagoController {
  private readonly logger = new Logger(MercadoPagoController.name);
  private readonly FRONTEND_BASE_URL: string;

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private configService: ConfigService,
  ) {
    this.FRONTEND_BASE_URL =
      this.configService.get<string>('FRONTEND_BASE_URL') || '';
  }

  /**
   * Endpoint de inicio: Redirige al negocio a Mercado Pago para la autorización.
   * Usa un Guard que verifique la autenticación y el rol de OWNER/ADMIN.
   *
   */
  @Get('oauth/start')
  @UseGuards(JwtGuard)
  async startOAuth(@CurrentUser() user: UserFromJWT) {
    const tenantId = user.tenant_id || null;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID no encontrado.');
    }

    const authUrl = await this.mercadoPagoService.getOAuthUrl(tenantId);
    return { url: authUrl };
  }

  /**
   * Endpoint para verificar el estado de la conexión con Mercado Pago.
   */
  @Get('status')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async getPaymentConfigStatus(@CurrentUser() user: UserFromJWT) {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID no encontrado.');
    }

    return this.mercadoPagoService.getPaymentConfigStatus(tenantId);
  }

  /**
   * Endpoint de callback: Recibe la respuesta de Mercado Pago.
   */
  @Get('oauth/callback')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async handleOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @CurrentUser() user: UserFromJWT,
  ) {
    if (error) {
      return {
        // Manejar el error si el usuario rechaza la autorización
        data: {
          url: `${this.FRONTEND_BASE_URL}/dashboard/configuracion/payments?error=mp_denied`,
        },
      };
    }

    if (!code || !state) {
      return {
        data: {
          url: `${this.FRONTEND_BASE_URL}/dashboard/configuracion/payments?error=mp_invalid_callback`,
        },
      };
    }

    // 1. Extraer el tenant_id del state (el primer segmento)
    const tenantId = state.split('|')[0];
    if (!tenantId) {
      return {
        data: {
          url: `${this.FRONTEND_BASE_URL}/dashboard/configuracion/payments?error=mp_invalid_state`,
        },
      };
    }

    try {
      const response: { status: string; message: string } =
        await this.mercadoPagoService.handleOAuthCallback(
          code,
          state,
          user.tenant_id,
        );

      // 3. Redirigir al panel de administración con éxito
      if (response.status == 'success') {
        return {
          data: {
            url: `${this.FRONTEND_BASE_URL}/dashboard/configuracion/payments?status=mp_success`,
          },
        };
      }
    } catch (e) {
      console.error('Error al procesar el callback de MP:', e);
      return {
        data: {
          url: `${this.FRONTEND_BASE_URL}/dashboard/configuracion/payments?error=mp_token_exchange_failed`,
        },
      };
    }
  }

  /**
   * Endpoint para verificar el estado del proceso OAuth.
   * @returns Estado del proceso OAuth y configuración si está completo
   */
  @Get('oauth/status')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async getOAuthStatus(@CurrentUser() user: UserFromJWT) {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID no encontrado.');
    }

    try {
      const status =
        await this.mercadoPagoService.getPaymentConfigStatus(tenantId);

      return {
        success: true,
        isConnected: status.isConnected,
        expirationDate: status.expirationDate,
        message: status.isConnected
          ? 'Mercado Pago conectado exitosamente'
          : 'Mercado Pago no está conectado',
      };
    } catch (error) {
      this.logger.error(
        `Error al verificar estado OAuth para tenant ${tenantId}:`,
        error,
      );
      return {
        success: false,
        isConnected: false,
        message: 'Error al verificar el estado de la conexión',
      };
    }
  }

  @Delete('disconnect')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async disconnectMercadoPago(@CurrentUser() user: UserFromJWT) {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID no encontrado.');
    }

    return this.mercadoPagoService.disconnectMercadoPago(tenantId);
  }

  @Get('config-internal')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async getInternalConfig(@CurrentUser() user: UserFromJWT) {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID no encontrado.');
    }

    return this.mercadoPagoService.getPaymentConfigSettings(tenantId);
  }

  @Put('config-internal')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async saveInternalConfig(
    @CurrentUser() user: UserFromJWT,
    @Body()
    configData: { maxInstallments: number; excludedPaymentsTypes: string[] },
  ) {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID no encontrado.');
    }
    return this.mercadoPagoService.updatePaymentConfigSettings(
      tenantId,
      configData.maxInstallments,
      configData.excludedPaymentsTypes,
    );
  }
}
