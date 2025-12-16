import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { MpOAuthResponse, MpConfigStore } from '@src/types/mp-config';
import Redis from 'ioredis';

import { MercadoPagoConfig, Payment } from 'mercadopago';

import { DbService, MpConfigRepo } from '@src/libs/db';

import { Prisma } from '@prisma/client';

const MOCK_KMS_KEY = Buffer.from(
  process.env.KMS_MOCK_KEY_32_BYTES || crypto.randomBytes(32).toString('hex'),
  'utf-8',
);

// Prefijo para las keys de OAuth state en Redis
const OAUTH_STATE_PREFIX = 'mp:oauth:state:';
// TTL para el state en segundos (10 minutos)
const OAUTH_STATE_TTL = 10 * 60;

interface OAuthStateData {
  tenantId: string;
  codeVerifier: string; // PKCE: se guarda para enviarlo al intercambiar tokens
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly CLIENT_ID: string | undefined;
  private readonly CLIENT_SECRET: string | undefined;
  private readonly REDIRECT_URI: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly dbService: DbService,
    @Inject('Redis') private readonly redis: Redis,
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
   * Implementa PKCE (Proof Key for Code Exchange) para mayor seguridad.
   * @param tenantId UUID del negocio que inicia la conexión.
   * @returns URL de redirección.
   */
  async getOAuthUrl(tenantId: string): Promise<string> {
    if (!this.CLIENT_ID || !this.REDIRECT_URI) {
      throw new InternalServerErrorException(
        'Credenciales de Mercado Pago no configuradas.',
      );
    }

    // El scope 'offline_access' es CLAVE para recibir el refresh_token
    const scopes = 'read write offline_access';
    const authUrl = 'https://auth.mercadopago.com/authorization';

    // El 'state' es crucial para seguridad (CSRF) y para identificar el tenant
    const stateHash = crypto.randomBytes(16).toString('hex');
    const state = `${tenantId}|${stateHash}`;

    // PKCE: Generar code_verifier (43-128 caracteres alfanuméricos)
    const codeVerifier = this.generateCodeVerifier();

    // PKCE: Generar code_challenge usando SHA256 + Base64URL
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    // Guardar el state y code_verifier en Redis con TTL de 10 minutos
    const stateData: OAuthStateData = { tenantId, codeVerifier };
    await this.redis.setex(
      `${OAUTH_STATE_PREFIX}${state}`,
      OAUTH_STATE_TTL,
      JSON.stringify(stateData),
    );

    this.logger.log(`OAuth con PKCE iniciado para tenant: ${tenantId}`);

    return (
      `${authUrl}?client_id=${this.CLIENT_ID}` +
      `&response_type=code` +
      `&platform_id=mp` +
      `&state=${encodeURIComponent(state)}` +
      `&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&code_challenge=${encodeURIComponent(codeChallenge)}` +
      `&code_challenge_method=S256`
    );
  }

  /**
   * PKCE: Genera un code_verifier aleatorio (43-128 caracteres)
   * Debe contener solo caracteres: [A-Z] [a-z] [0-9] - . _ ~
   */
  private generateCodeVerifier(): string {
    // Generar 64 bytes aleatorios y convertir a base64url (sin padding)
    const buffer = crypto.randomBytes(64);
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, 128); // Máximo 128 caracteres
  }

  /**
   * PKCE: Genera el code_challenge a partir del code_verifier usando S256
   * S256 = BASE64URL(SHA256(code_verifier))
   */
  private generateCodeChallenge(codeVerifier: string): string {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    return hash
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Valida el state recibido del callback usando Redis
   * @param state El state recibido de MP
   * @returns El tenantId y codeVerifier si es válido
   * @throws BadRequestException si el state es inválido o expirado
   */
  async validateState(
    state: string,
  ): Promise<{ tenantId: string; codeVerifier: string }> {
    const redisKey = `${OAUTH_STATE_PREFIX}${state}`;
    const cachedData = await this.redis.get(redisKey);

    if (!cachedData) {
      this.logger.warn(`State inválido o no encontrado: ${state}`);
      throw new BadRequestException(
        'State inválido o expirado. Por favor, inicie el proceso nuevamente.',
      );
    }

    // Eliminar el state usado (one-time use) - Redis lo hace atómico
    await this.redis.del(redisKey);

    const cached = JSON.parse(cachedData) as OAuthStateData;

    return {
      tenantId: cached.tenantId,
      codeVerifier: cached.codeVerifier,
    };
  }

  /**
   * Obtengo configuracion y datos de Mercado Pago asociado a un tenant por user_id de MP
   * @param userID ID de usuario de Mercado Pago
   * @returns Configuracion de Mercado Pago
   */
  async getTenantConfigByMpUserId(
    userID: string,
  ): Promise<MpConfigStore | null> {
    return this.dbService.runInTransaction({}, async (tx) => {
      const repo = MpConfigRepo(tx);
      return repo.getMpConfigStoreByMpUserId(userID);
    });
  }

  /**
   * 2. Intercambia el código de autorización por los tokens de acceso del negocio.
   * Incluye el code_verifier para PKCE.
   * @param code Código recibido de Mercado Pago.
   * @param codeVerifier El code_verifier generado al iniciar OAuth (PKCE).
   * @returns La respuesta de OAuth de MP.
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<MpOAuthResponse> {
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
      // PKCE: Enviar el code_verifier para que MP pueda validarlo
      body.append('code_verifier', codeVerifier);

      const response = await axios.post<MpOAuthResponse>(tokenUrl, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error: unknown) {
      this.logger.error('Error en exchangeCodeForTokens:', error);
      if (axios.isAxiosError(error) && error.response) {
        // Manejar errores como código inválido/expirado
        const responseData = error.response.data as { message?: string };
        const detail = responseData?.message || 'Error desconocido de MP';
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
   * Implementa PKCE enviando el code_verifier al intercambiar tokens.
   * @param code Código de autorización de MP.
   * @param state Token de seguridad para validación.
   */
  async handleOAuthCallback(
    code: string,
    state: string,
    user_tenantId: string,
  ): Promise<{ status: string; message: string }> {
    // 3.1. Validar el state y obtener el tenantId + codeVerifier (PKCE)
    const { tenantId, codeVerifier } = await this.validateState(state);

    if (tenantId !== user_tenantId) {
      throw new UnauthorizedException(
        'El tenant ID no coincide con el usuario autenticado.',
      );
    }

    this.logger.log(`Procesando callback de MP para tenant: ${tenantId}`);

    // 3.2. Intercambio de códigos por tokens (incluye code_verifier para PKCE)
    const tokens = await this.exchangeCodeForTokens(code, codeVerifier);

    this.logger.log(`Tokens obtenidos para MP user_id: ${tokens.user_id}`);

    // 3.3. Cifrado y cálculo de expiración
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

    const configToStore: MpConfigStore = {
      mpUserId: tokens.user_id,
      tenantId: tenantId,
      accessTokenEnc: this.encryptToken(tokens.access_token),
      refreshTokenEnc: this.encryptToken(tokens.refresh_token),
      tokenExpiry: expiryDate,
      maxIntallments: 1,
      excludedPaymentsTypes: null,
    };

    // 3.4. Almacenamiento seguro
    await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = MpConfigRepo(tx);
      await repo.saveConfig(configToStore, tenantId);
    });

    this.logger.log(`Configuración de MP guardada para tenant: ${tenantId}`);

    return {
      status: 'success',
      message: 'Configuración de MP guardada exitosamente.',
    };
  }

  /**
   * 4. Verifica el estado de la configuración de Mercado Pago para un tenant.
   * @param tenantId UUID del tenant.
   * @returns Estado de la conexión.
   */
  async getPaymentConfigStatus(tenantId: string): Promise<{
    isConnected: boolean;
    expirationDate?: Date;
    config?: MpConfigStore;
  }> {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = MpConfigRepo(tx);
      const config = await repo.getMpConfigStoreByTenantId(tenantId);

      if (!config) {
        return { isConnected: false };
      }

      return {
        isConnected: true,
        expirationDate: config.tokenExpiry,
        config,
      };
    });
  }

  /**
   * 5. Renueva el Access Token usando el Refresh Token.
   * Debe llamarse cuando el access_token está por expirar o ha expirado.
   * @param tenantId UUID del tenant.
   */
  async refreshAccessToken(tenantId: string): Promise<{
    status: string;
    message: string;
    data?: { access_token: string; user_id: string };
  }> {
    // 5.1. Obtener la configuración actual
    const currentConfig = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        const repo = MpConfigRepo(tx);
        return repo.getMpConfigStoreByTenantId(tenantId);
      },
    );

    if (!currentConfig || !currentConfig.refreshTokenEnc) {
      throw new BadRequestException(
        'No hay configuración de Mercado Pago para este tenant.',
      );
    }

    // 5.2. Descifrar el refresh_token
    const refreshToken = this.decryptToken(currentConfig.refreshTokenEnc);

    // 5.3. Llamar a MP para obtener nuevos tokens
    try {
      const tokenUrl = 'https://api.mercadopago.com/oauth/token';
      const body = new URLSearchParams();
      body.append('client_id', this.CLIENT_ID || '');
      body.append('client_secret', this.CLIENT_SECRET || '');
      body.append('grant_type', 'refresh_token');
      body.append('refresh_token', refreshToken);

      const response = await axios.post<MpOAuthResponse>(tokenUrl, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const tokens = response.data;

      this.logger.log(`Access token renovado para tenant: ${tenantId}`);

      // 5.4. Cifrar y guardar los nuevos tokens
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

      const configToStore: MpConfigStore = {
        mpUserId: tokens.user_id,
        tenantId: tenantId,
        accessTokenEnc: this.encryptToken(tokens.access_token),
        refreshTokenEnc: this.encryptToken(tokens.refresh_token),
        tokenExpiry: expiryDate,
        maxIntallments: currentConfig.maxIntallments,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        excludedPaymentsTypes: currentConfig.excludedPaymentsTypes,
      };

      await this.dbService.runInTransaction({ tenantId }, async (tx) => {
        const repo = MpConfigRepo(tx);
        await repo.saveConfig(configToStore, tenantId);
      });
      return {
        status: 'success',
        message: 'Access token renovado y guardado exitosamente.',
        data: {
          access_token: tokens.access_token,
          user_id: tokens.user_id,
        },
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(
          `Error renovando token de MP: ${JSON.stringify(error.response.data)}`,
        );
        throw new UnauthorizedException(
          'Error al renovar el token de Mercado Pago. Es posible que deba reconectar su cuenta.',
        );
      }
      throw new InternalServerErrorException(
        'Error de red al renovar el token de MP.',
      );
    }
  }

  /**
   * Función para descifrar un token.
   */
  private decryptToken(encryptedToken: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      MOCK_KMS_KEY,
      MOCK_KMS_KEY.subarray(0, 16),
    );
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * 6. Obtiene el Access Token descifrado para un tenant (para usar en llamadas a MP API).
   * Automáticamente renueva si está por expirar.
   * @param tenantId UUID del tenant.
   * @returns Access token descifrado.
   */
  async getAccessToken(
    tenantId: string,
    configData: MpConfigStore,
  ): Promise<string> {
    // Verificar si el token está por expirar (menos de 1 hora)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (configData.tokenExpiry && configData.tokenExpiry < oneHourFromNow) {
      this.logger.log(`Token por expirar, renovando para tenant: ${tenantId}`);
      const data: {
        status: string;
        message: string;
        data?: { access_token: string; user_id: string };
      } = await this.refreshAccessToken(tenantId);

      if (!data.data) {
        throw new InternalServerErrorException(
          'Error renovando el access token de Mercado Pago.',
        );
      }

      return data.data.access_token;
    }

    return this.decryptToken(configData.accessTokenEnc);
  }

  /**
   * 7. Elimina la configuración de Mercado Pago para un tenant (desconexión).
   */
  async disconnectMercadoPago(tenantId: string): Promise<void> {
    await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      try {
        await tx.mp_config.deleteMany({
          where: { tenant_id: tenantId },
        });
        this.logger.log(
          `Configuración de MP eliminada para tenant: ${tenantId}`,
        );
      } catch (error) {
        this.logger.error(
          `Error eliminando configuración de MP para tenant ${tenantId}: ${error}`,
        );
        throw new InternalServerErrorException(
          'Error al desconectar Mercado Pago.',
        );
      }
    });
  }

  /**
   * 8. Método para crear preferencia de pago en Mercado Pago - asociado a un tenant.
   * @param tenantId UUID del tenant.
   * @param preferenceData Datos para crear la preferencia.
   * @returns Respuesta de la creación de preferencia.
   */
  async createPreferencePayment(
    tenantId: string,
    preferenceData: any,
    accessToken: string,
  ): Promise<any> {
    try {
      const response = await axios.post(
        'https://api.mercadopago.com/checkout/preferences',
        preferenceData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error creando preferencia de pago para tenant ${tenantId}: ${error}`,
      );
      throw new InternalServerErrorException(
        'Error al crear la preferencia de pago en Mercado Pago.',
      );
    }
  }

  /**
   * 9. Método para obtener información de un pago en Mercado Pago - asociado a un tenant.
   * Utilizo el sdk interno para mayor compatibilidad.
   * @param paymentId ID del pago en Mercado Pago.
   * @param tenantId: UUID del tenant.
   * @returns Información del pago.
   */
  async getPaymentInfo(paymentId: string, tenantId: string): Promise<any> {
    try {
      const configData = await this.getPaymentConfigStatus(tenantId);

      if (!configData.isConnected || !configData.config) {
        this.logger.warn(
          `Mercado Pago no está configurado para el negocio ${tenantId} - No se puede obtener info de pago ${paymentId}`,
        );
        return { status: 'ignored', message: 'Mercado Pago no configurado' };
      }

      const accessTokenAsociated = await this.getAccessToken(
        tenantId,
        configData.config,
      );

      // Configuro SDK de Mercado Pago con el access token del tenant
      const clientConfig: MercadoPagoConfig = {
        accessToken: accessTokenAsociated,
        options: {
          timeout: 10000, // 10 segundos
        },
      };

      const paymentClient = new Payment(clientConfig);
      let payment: any | null = null;
      try {
        payment = await paymentClient.get({ id: paymentId });
        if (!payment) {
          this.logger.warn(
            `Payment not found: ${paymentId} for tenant ${tenantId}`,
          );
          return { status: 'ignored', message: 'Payment not found' };
        }
      } catch (error) {
        this.logger.error(
          `Error fetching payment ${paymentId} for tenant ${tenantId}: ${error}`,
        );
        return { status: 'ignored', message: 'Error fetching payment info' };
      }

      return payment;
    } catch (error) {
      this.logger.error(
        `Error obteniendo info de pago ${paymentId} para tenant ${tenantId}: ${error}`,
      );
      throw new InternalServerErrorException(
        'Error al obtener la información del pago en Mercado Pago.',
      );
    }
  }

  async getPaymentConfigSettings(tenantId: string) {
    try {
      return this.dbService.runInTransaction({ tenantId }, async (tx) => {
        const repo = MpConfigRepo(tx);
        return repo.getPaymentConfigSettings(tenantId);
      });
    } catch (error) {
      this.logger.error(
        `Error obteniendo configuracion para tenant ${tenantId}: ${error}`,
      );
      throw new InternalServerErrorException(
        'Error al obtener la configuracion del pago en Mercado Pago.',
      );
    }
  }

  async updatePaymentConfigSettings(
    tenantId: string,
    max_installments: number,
    excluded_payment_methods: string[],
  ): Promise<{
    max_installments: number;
    excluded_payment_types: Prisma.JsonValue;
  }> {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    const response = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        const repo = MpConfigRepo(tx);
        return await repo.updateMpConfigSettingsByTenantId(
          tenantId,
          max_installments,
          excluded_payment_methods,
        );
      },
    );

    return response;
  }
}
