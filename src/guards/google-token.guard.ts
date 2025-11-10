// src/modules/auth/guard/google-token.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleTokenService } from '@src/modules/auth/service/google-token.service';
import { IdTokenPayload } from '@src/types/idTokenPayload';

@Injectable()
export class GoogleTokenGuard implements CanActivate {
  constructor(private readonly googleTokenService: GoogleTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log('headers', request.headers);

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
      // 3. Verificar y decodificar token de Google
      const decoded: IdTokenPayload =
        await this.googleTokenService.decodeIdToken(token);

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
