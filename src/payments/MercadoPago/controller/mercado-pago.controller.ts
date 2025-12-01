import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';
// Servicio internos de nest
import { ConfigService } from '@nestjs/config';

// Servicio de mercado pago
import { MercadoPagoService } from '../services/mercado-pago.service';

// Modulo / Middleware de autenticacion
import { JwtGuard } from '@src/guards/jwt.guard';

// Tipos de express
import { Request, Response } from 'express';

@Controller('mercado-pago')
export class MercadoPagoController {
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
  startOAuth(@CurrentUser() user: any) {
    const tenantId = user.tenant_id || null;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID no encontrado.');
    }

    const authUrl = this.mercadoPagoService.getOAuthUrl(tenantId);
    return { url: authUrl };
  }

  /**
   * Endpoint para verificar el estado de la conexión con Mercado Pago.
   */
  @Get('status')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async getPaymentConfigStatus(@CurrentUser() user: any) {
    const tenantId = user.tenant_id;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID no encontrado.');
    }

    return this.mercadoPagoService.getPaymentConfigStatus(tenantId);
  }

  /**
   * Endpoint de callback: Recibe la respuesta de Mercado Pago.
   * NOTA: Este endpoint no lleva Guard porque la petición viene directamente de MP,
   * PERO debe validar el 'state' para obtener el tenant_id y prevenir ataques.
   */
  @Get('oauth/callback')
  async handleOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error) {
      // Manejar el error si el usuario rechaza la autorización
      return res.redirect(
        `${this.FRONTEND_BASE_URL}/configuracion/payments?error=mp_denied`,
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${this.FRONTEND_BASE_URL}/configuracion/payments?error=mp_invalid_callback`,
      );
    }

    // 1. Extraer el tenant_id del state (el primer segmento)
    const tenantId = state.split('|')[0];
    if (!tenantId) {
      return res.redirect(
        `${this.FRONTEND_BASE_URL}/configuracion/payments?error=mp_state_security_failure`,
      );
    }

    try {
      // 2. Aquí debes establecer el contexto de tenant manualmente para que el saveConfig funcione
      // Esto es CRÍTICO si el callback no pasa por el Guard de Multi-Tenancy.
      // Ejemplo: (Llama a tu servicio de Contexto/Guard para simular la sesión)
      // await this.multiTenantService.setContext(tenantId);

      await this.mercadoPagoService.handleOAuthCallback(code, state);

      // 3. Redirigir al panel de administración con éxito
      return res.redirect(
        `${this.FRONTEND_BASE_URL}/configuracion/payments?status=mp_success`,
      );
    } catch (e) {
      console.error('Error al procesar el callback de MP:', e);
      return res.redirect(
        `${this.FRONTEND_BASE_URL}/configuracion/payments?error=mp_token_exchange_failed`,
      );
    }
  }
}
