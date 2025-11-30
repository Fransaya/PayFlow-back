import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { MpOAuthResponse, MpConfigStore } from '@src/types/mp-config';

import { DbService, MpConfigRepo } from '@src/libs/db';

// NOTE: En un entorno de producción, usa AWS KMS/Vault para el cifrado real.
// Este es un placeholder SÓLO para demostrar la lógica.
const MOCK_KMS_KEY = Buffer.from(
  process.env.KMS_MOCK_KEY_32_BYTES || 'a_secret_key_for_mock_encryption_32',
  'utf-8',
);

// TODO: continuar desarrollando modulo de mercado pago
@Injectable()
export class MercadoPagoService {
  private readonly CLIENT_ID: string | undefined;
  private readonly CLIENT_SECRET: string | undefined;
  private readonly REDIRECT_URI: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly dbService: DbService,
  ) {
    this.CLIENT_ID =
      this.configService.get<string>('MERCADOPAGO_CLIENT_ID') || '';
    this.CLIENT_SECRET =
      this.configService.get<string>('MERCADOPAGO_CLIENT_SECRET') || '';
    this.REDIRECT_URI = this.configService.get<string>(
      'MERCADOPAGO_REDIRECT_URI',
    );
  }

  /**
   * 💡 Función mock para cifrar un token.
   * Reemplazar con la implementación real de AWS KMS o Vault.
   */
  private encryptToken(token: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      MOCK_KMS_KEY,
      MOCK_KMS_KEY.subarray(0, 16),
    );
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * 1. Genera la URL de redirección a Mercado Pago para iniciar el flujo OAuth.
   * @param tenantId UUID del negocio que inicia la conexión.
   * @returns URL de redirección.
   */
  getOAuthUrl(tenantId: string): string {
    if (!this.CLIENT_ID || !this.REDIRECT_URI) {
      throw new InternalServerErrorException(
        'Credenciales de Mercado Pago no configuradas.',
      );
    }

    // El scope 'offline_access' es CLAVE para recibir el refresh_token
    const scopes = 'read_payments write_preferences offline_access';
    const authUrl = 'https://auth.mercadopago.com/authorization';

    // El 'state' es crucial para seguridad (CSRF) y para identificar el tenant
    const state = `${tenantId}|${crypto.randomBytes(16).toString('hex')}`;

    return (
      `${authUrl}?client_id=${this.CLIENT_ID}` +
      `&response_type=code` +
      `&platform_id=mp` +
      `&state=${state}` +
      `&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(scopes)}`
    );
  }

  /**
   * 2. Intercambia el código de autorización por los tokens de acceso del negocio.
   * @param code Código recibido de Mercado Pago.
   * @returns La respuesta de OAuth de MP.
   */
  private async exchangeCodeForTokens(code: string): Promise<MpOAuthResponse> {
    try {
      if (!this.CLIENT_ID || !this.CLIENT_SECRET || !this.REDIRECT_URI) {
        throw new InternalServerErrorException(
          'Credenciales de Mercado Pago no configuradas.',
        );
      }

      const tokenUrl = 'https://api.mercadopago.com/oauth/token';
      const body = new URLSearchParams();
      body.append('client_id', this.CLIENT_ID);
      body.append('client_secret', this.CLIENT_SECRET);
      body.append('code', code);
      body.append('redirect_uri', this.REDIRECT_URI);
      body.append('grant_type', 'authorization_code');

      const response = await axios.post<MpOAuthResponse>(tokenUrl, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        // Manejar errores como código inválido/expirado
        const detail = error.response.data.message || 'Error desconocido de MP';
        throw new UnauthorizedException(
          `Error de OAuth con Mercado Pago: ${detail}`,
        );
      }
      throw new InternalServerErrorException(
        'Error de red al intentar obtener los tokens de MP.',
      );
    }
  }

  /**
   * 3. Procesa el callback: intercambia el código, cifra y almacena los tokens.
   * @param code Código de autorización de MP.
   * @param state Token de seguridad para validación.
   */
  async handleOAuthCallback(code: string, state: string): Promise<void> {
    // 3.1. Validar el estado (Aquí solo se extrae el tenantId, pero en prod, se valida el hash CSRF)
    const tenantIdFromState = state.split('|')[0];
    if (!tenantIdFromState) {
      // NOTA: La validación del tenantId se hace de forma automática si tu Guard de Multi-Tenancy
      // lo establece en la sesión ANTES de que se ejecute el saveConfig.
      console.warn(
        'Advertencia de seguridad: Mismatch de tenantId en el state o falta de validación de CSRF.',
      );
    }

    // 3.2. Intercambio de códigos por tokens
    const tokens = await this.exchangeCodeForTokens(code);

    // 3.3. Cifrado y cálculo de expiración
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

    const configToStore: MpConfigStore = {
      mpUserId: tokens.user_id,
      accessTokenEnc: this.encryptToken(tokens.access_token),
      refreshTokenEnc: this.encryptToken(tokens.refresh_token),
      tokenExpiry: expiryDate,
    };

    // 3.4. Almacenamiento seguro (El RLS/TenantGuard asegura que solo se guarde para el tenant correcto)
    await this.dbService.runInTransaction(
      { tenantId: tenantIdFromState },
      async (tx) => {
        const repo = MpConfigRepo(tx);
        await repo.saveConfig(configToStore, tenantIdFromState);
      },
    );
  }

  /**
   * 4. Verifica el estado de la configuración de Mercado Pago para un tenant.
   * @param tenantId UUID del tenant.
   * @returns Estado de la conexión.
   */
  async getPaymentConfigStatus(
    tenantId: string,
  ): Promise<{ isConnected: boolean; expirationDate?: Date }> {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = MpConfigRepo(tx);
      const config = await repo.getMpConfigStoreByTenantId(tenantId);

      if (!config) {
        return { isConnected: false };
      }

      return {
        isConnected: true,
        expirationDate: config.tokenExpiry,
      };
    });
  }
}
