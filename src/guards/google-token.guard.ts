// src/modules/auth/guard/google-token.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleTokenService } from '@src/modules/auth/services/google-token.service';
import { IdTokenPayload } from '@src/types/idTokenPayload';

//* Esta guardia unicamente se va a utilizar para el registro de user-owner ya que no envia access_token de la app porque todavia no tiene usuario
@Injectable()
export class GoogleTokenGuard implements CanActivate {
  constructor(private readonly googleTokenService: GoogleTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let googleToken: string | null = null;

    if (!googleToken && request.cookies) {
      googleToken = request.cookies['google_id_token'];
    }

    if (!googleToken) {
      throw new BadRequestException('ID token is required');
    }

    try {
      // 3. Verificar y decodificar token de Google
      const decoded: IdTokenPayload =
        await this.googleTokenService.decodeIdToken(googleToken);

      // 4. Adjuntar usuario al request
      request.googleUser = decoded;
      request.googleToken = googleToken;

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
