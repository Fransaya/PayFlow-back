import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';

import crypto from 'crypto';
import axios from 'axios';
import { URLSearchParams } from 'url';

import { USER_TYPE, PROVIDER } from '@src/constants/app.contants';

// DB_LIBS
import { DbService, authRepo, sessionRepo } from '@libs/db';

import { session_app } from '@prisma/client';

import authConfig from '@src/config/auth.config';

import {
  RegisterOwnerDto,
  RegisterBusinessDto,
  QueryParmsRegisterBusinessDto,
} from '@src/modules/auth/dto/auth.dto';
import { UpdateSessionAppDto, SessionAppInternalDto } from '../dto/session.dto';

// Tipos de session
import { SessionAppCreate } from '@src/types/sesssionApp';
import {
  GetUserByEmailResponse,
  AuthCallbackResponse,
  SyncAccountResponse,
  LoginAppResponse,
} from '@src/types/user';

import { IdTokenPayload } from '@src/types/idTokenPayload';
import { InviteToken } from '@src/types/inviteToken';

// Funciones de utilidad
import { validateInviteToken } from '../utility/validateInviteToken';
import { validateInviteTokenEmail } from '../utility/validateInviteTokenEmail';
import { validateOwnerRegistrationData } from '../utility/validateOwnerRegistrationData';

// Metodo de user.service
import { UserService } from '@src/modules/user/service/user.service';
import { TenantService } from '@src/modules/tenant/service/tenant.service';

// Utilidad para generacion de token
import { generateToken } from '../utility/generateToken';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private config = authConfig();

  constructor(
    private readonly dbService: DbService,
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Función auxiliar: Genera código aleatorio
   */
  generateRandomString(length: number) {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Función auxiliar: Genera code challenge para PKCE
   */
  generateCodeChallenge(verifier: string) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  // =================== METODO DE OBTENCION URL LOGIN ===================

  getLoginUrl() {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/sync';

      const scope = ['openid', 'profile', 'email'].join(' ');

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set(
        'state',
        Math.random().toString(36).substring(7),
      );

      return { loginUrl: authUrl.toString() };
    } catch (error) {
      this.logger.error(`Failed to get login URL: ${error}`);
      throw new InternalServerErrorException(
        'An error occurred while generating the login URL',
      );
    }
  }

  async handleAuthCallback(code: string): Promise<AuthCallbackResponse> {
    try {
      // 1. Intercambiar código por tokens con Google
      const tokenResponse: any = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: `${process.env.FRONTEND_URL}/sync`,
          grant_type: 'authorization_code',
        },
      );

      const { access_token, refresh_token, expires_in, id_token } =
        tokenResponse.data;

      // 2. Obtener información del usuario desde Google
      const userResponse: any = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const googleUser: IdTokenPayload = userResponse.data;
      console.log('googleUser:', googleUser);

      const responseSyncAccount = await this.synchAuthAccount(googleUser);
      console.log('responseSyncAccount:', responseSyncAccount);

      // Construir respuesta base con tokens de Google
      const response = {
        access_token,
        refresh_token,
        expires_in,
        id_token,
        user: {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
        },
        action: responseSyncAccount.data.action, // 'LOGIN' o 'REGISTER'
        user_exists: responseSyncAccount.data.existUser,
        message: responseSyncAccount.description,
      };

      // Si el usuario ya existe, hacer login automático
      if (
        responseSyncAccount.data.existUser &&
        responseSyncAccount.data.action === 'LOGIN'
      ) {
        const loginResult = await this.logingApp(googleUser);

        return {
          ...response,
          app_session: loginResult.data,
          redirect_to: '/dashboard',
        };
      }

      // Si el usuario no existe, retornar con indicación de registro
      return {
        ...response,
        redirect_to: '/register',
      };
    } catch (error: any) {
      this.logger.error(`Failed to handle auth callback: ${error}`);

      if (error.response && error.response.data) {
        this.logger.error(
          `Google error response: ${JSON.stringify(error.response.data)}`,
        );
      }

      throw new InternalServerErrorException(
        'An error occurred during authentication callback',
      );
    }
  }

  // =================== METODO DE SINCRONIZACION ===================
  async synchAuthAccount(
    user_decode: IdTokenPayload,
  ): Promise<SyncAccountResponse> {
    try {
      const existUser = await this.userService.validateUserNotExists(
        user_decode.email,
      );

      if (existUser) {
        return {
          description: 'Usuario sincronizado correctamente',
          data: {
            existUser: true,
            action: 'LOGIN',
          },
        };
      } else {
        return {
          description: 'Usuario no registrado',
          data: {
            existUser: false,
            action: 'REGISTER',
          },
        };
      }
    } catch (error) {
      this.logger.error(`Failed to sync data: ${error}`);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred during sync data',
      );
    }
  }

  // =================== METODOS DE SESSION ===================
  async logingApp(user_decode: IdTokenPayload): Promise<LoginAppResponse> {
    try {
      const userData: GetUserByEmailResponse =
        await this.userService.getUserByEmail(user_decode.email);

      console.log('userData', userData);

      if (!userData) {
        throw new UnauthorizedException('User not found');
      }

      // Validar que tenga user_details
      if (!('user_details' in userData) || !userData.user_details) {
        throw new UnauthorizedException('User details not found');
      }

      // Validar que tenga provider
      if (!userData.provider) {
        throw new UnauthorizedException('User provider not found');
      }

      const { user_details } = userData;

      // Genero token de access_token de aplicacion y refresh token internos para la aplicacion ( session )
      const access_token: string = generateToken(
        {
          user_id: userData.user_ref,
          tenant_id: user_details.tenants.tenant_id,
          provider: userData.provider,
        },
        userData,
        this.config.jwt.expiresIn,
      );

      const refresh_token: string = generateToken(
        {
          user_id: userData.user_ref,
          tenant_id: user_details.tenants.tenant_id,
          provider: userData.provider,
        },
        userData,
        this.config.jwt.refreshExpiresIn,
      );

      const sessionData: SessionAppCreate = {
        ...(userData.user_type === USER_TYPE.OWNER && {
          user_owner_id: userData.user_ref,
        }),
        ...(userData.user_type === USER_TYPE.BUSINESS && {
          user_id: userData.user_ref,
        }),
        tenant_id: user_details.tenants.tenant_id,
        provider: PROVIDER.GOOGLE,
        refresh_token_enc: refresh_token,
        refresh_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip_address: '', // TODO: obtener IP
        user_agent: '', // TODO: obtener user agent
      };

      const session = await this.upsertSession(sessionData);

      return {
        description: 'Login successful',
        data: {
          access_token,
          refresh_token,
          token_type: 'Bearer',
          expires_in: this.config.jwt.expiresIn,
          session,
        },
      };

      // Guardo y genero data para la session
    } catch (error) {
      this.logger.error(`Failed to login: ${error}`);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('An error occurred during login');
    }
  }

  async logoutApp(user_decode: IdTokenPayload): Promise<any> {
    try {
      const result = await this.deleteSessionForUser(user_decode.sub);

      if (!result) {
        throw new BadRequestException('No active session found to logout');
      }

      return {
        description: 'Logout successful',
        data: null,
      };
    } catch (error) {
      this.logger.error(`Failed to logout: ${error}`);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('An error occurred during logout');
    }
  }

  async getSession(session_id: string): Promise<SessionAppInternalDto | null> {
    try {
      return this.dbService.runInTransaction({}, async (tx) => {
        const repository = sessionRepo(tx);
        return await repository.getSession(session_id);
      });
    } catch (error) {
      this.logger.error(`Error getting session: ${error}`);
      throw new InternalServerErrorException('Error getting session');
    }
  }

  async deleteSessionForUser(user_id: string): Promise<boolean> {
    try {
      return this.dbService.runInTransaction({}, async (tx) => {
        const repository = sessionRepo(tx);
        return await repository.deleteSessionForUser(user_id);
      });
    } catch (error) {
      this.logger.error(`Error deleting session for user ${user_id}: ${error}`);
      throw new InternalServerErrorException('Error deleting session for user');
    }
  }

  async validateExistSession(session_id: string): Promise<boolean> {
    try {
      return this.dbService.runInTransaction({}, async (tx) => {
        const repository = sessionRepo(tx);
        return await repository.validateExistSession(session_id);
      });
    } catch (error) {
      this.logger.error(`Error validating session existence: ${error}`);
      throw new InternalServerErrorException('Error validating session');
    }
  }

  async saveSession(session_data: SessionAppCreate): Promise<session_app> {
    try {
      return this.dbService.runInTransaction({}, async (tx) => {
        const repository = sessionRepo(tx);
        return await repository.createAppSession(session_data);
      });
    } catch (error) {
      this.logger.error(`Error saving session: ${error}`);
      throw new InternalServerErrorException('Error saving session');
    }
  }

  async upsertSession(session_data: any): Promise<session_app> {
    try {
      return this.dbService.runInTransaction({}, async (tx) => {
        const repository = sessionRepo(tx);
        return await repository.upsertSession(session_data);
      });
    } catch (error) {
      this.logger.error(`Error upserting session: ${error}`);
      throw new InternalServerErrorException('Error upserting session');
    }
  }

  async updateSession(
    session_data: UpdateSessionAppDto,
    session_id: string,
  ): Promise<session_app> {
    try {
      return this.dbService.runInTransaction({}, async (tx) => {
        const repository = sessionRepo(tx);
        return await repository.updateSession(session_data, session_id);
      });
    } catch (error) {
      this.logger.error(`Error updating session: ${error}`);
      throw new InternalServerErrorException('Error updating session');
    }
  }

  async deleteSession(session_id: string): Promise<boolean> {
    try {
      return this.dbService.runInTransaction({}, async (tx) => {
        const repository = sessionRepo(tx);
        return await repository.deleteSession(session_id);
      });
    } catch (error) {
      this.logger.error(`Error deleting session: ${error}`);
      throw new InternalServerErrorException('Error deleting session');
    }
  }

  // ==================== METODOS DE CREACION =========================

  async registerOwner(body: RegisterOwnerDto, user_decode: IdTokenPayload) {
    const { tenant, user } = body;

    try {
      // 1. Validar datos de entrada adicionales
      validateOwnerRegistrationData(body);

      // 2. Validar que el tenant no exista
      await this.tenantService.validateTenantDoesNotExist(tenant.slug);

      // 3. Validar que el usuario no esté ya registrado
      const exist = await this.userService.validateUserNotExists(
        user_decode.email,
      );

      if (exist) {
        throw new ConflictException(
          `User with email "${user_decode.email}" already exists`,
        );
      }

      // 4. Crear tenant, user owner y auth account en transacción
      const result = await this.createOwnerRegistration({
        tenant,
        user,
        user_decode,
      });

      this.logger.log(
        `Owner registered successfully for tenant: ${tenant.slug}`,
      );

      return {
        success: true,
        data: result,
        message: 'Owner registered successfully',
      };
    } catch (error: any) {
      this.logger.error(`Failed to register owner: ${error}`);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred during owner registration',
      );
    }
  }

  async registerBusiness(
    body: RegisterBusinessDto,
    queryParams: QueryParmsRegisterBusinessDto,
    user_decode: IdTokenPayload,
  ) {
    const { invite_token } = queryParams;
    const { user } = body;

    try {
      // 1. Validar y decodificar invite token
      const decoded_invite_token: InviteToken =
        validateInviteToken(invite_token);

      // 2. Validar que el email del token coincide con el del usuario
      validateInviteTokenEmail(decoded_invite_token, user_decode.email);

      // 3. Validar que el tenant existe
      await this.tenantService.validateTenantExists(
        decoded_invite_token.tenant_id,
      );

      // 4. Validar que el usuario no esté ya registrado en este tenant
      await this.userService.validateUserNotInTenant(
        user_decode.email,
        decoded_invite_token.tenant_id,
      );

      // 5. Crear business user
      const result = await this.createBusinessRegistration({
        decoded_invite_token,
        user,
        user_decode,
      });

      this.logger.log(
        `Business user registered successfully for tenant: ${decoded_invite_token.tenant_id}`,
      );

      return {
        success: true,
        data: result,
        message: 'Business user registered successfully',
      };
    } catch (error: any) {
      this.logger.error(`Failed to register business: ${error}`);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred during business registration',
      );
    }
  }

  private async createOwnerRegistration({
    tenant,
    user,
    user_decode,
  }: {
    tenant: { name: string; slug: string };
    user: { display_name: string; phone: string };
    user_decode: IdTokenPayload;
  }) {
    return this.dbService.runInTransaction({}, async (tx) => {
      const repository = authRepo(tx);

      return await repository.createOwnerWithTransaction(
        { name: tenant.name, slug: tenant.slug },
        {
          name: user.display_name,
          email: user_decode.email,
          phone: user.phone,
        },
        {
          user_type: USER_TYPE.OWNER,
          provider: PROVIDER.GOOGLE,
          provider_sub: user_decode.sub,
        },
      );
    });
  }

  private async createBusinessRegistration({
    decoded_invite_token,
    user,
    user_decode,
  }: {
    decoded_invite_token: InviteToken;
    user: { name: string; email: string };
    user_decode: IdTokenPayload;
  }) {
    return this.dbService.runInTransaction({}, async (tx) => {
      const repository = authRepo(tx);

      return repository.createBusinessWithTransaction(
        {
          tenant_id: decoded_invite_token.tenant_id,
          name: user.name,
          email: user_decode.email,
          status: decoded_invite_token.status,
        },
        {
          user_type: USER_TYPE.BUSINESS,
          provider: PROVIDER.AUTH0,
          provider_sub: user_decode.sub,
          password_hash: '',
        },
      );
    });
  }
}
