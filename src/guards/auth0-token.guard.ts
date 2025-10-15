// src/modules/auth/guard/auth0-token.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth0TokenService } from '@src/modules/auth/service/auth0-token.service';
import { IdTokenPayload } from '@src/types/idTokenPayload';

@Injectable()
export class Auth0TokenGuard implements CanActivate {
  constructor(private readonly auth0TokenService: Auth0TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Leer header personalizado
    const authHeader: string = request.headers['x-oauth-token'] as string;
    if (!authHeader) {
      throw new BadRequestException('Authorization header is required');
    }

    // 2. Extraer token (Bearer <token>)
    const [scheme, token] = authHeader.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer') {
      throw new BadRequestException('ID token is required');
    }

    try {
      // 3. Verificar y decodificar
      const decoded: IdTokenPayload =
        await this.auth0TokenService.decodeIdToken(token);

      // 4. Adjuntar usuario al request
      request.user = decoded;

      return true; // permite continuar
    } catch (err: any) {
      if (
        err.name === 'JsonWebTokenError' ||
        err.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Invalid or expired token');
      }
      throw err; // BadRequest u otros
    }
  }
}
