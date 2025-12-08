/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@src/modules/auth/services/auth.service';

/**
 * Guard simplificado que SOLO valida el JWT de la aplicación
 *
 * IMPORTANTE: Este guard NO valida tokens de Google como fallback.
 * Una vez que el usuario hace login (Google o local), el sistema emite sus propios JWT.
 *
 * Flujo de validación:
 * 1. Extrae el access_token de las cookies
 * 2. Valida el token JWT de la aplicación
 * 3. Si el token es válido, adjunta el usuario al request
 * 4. Si el token es inválido o expiró, lanza 401 para que el frontend ejecute refresh
 *
 * NO intenta validar google_id_token como respaldo.
 */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 1. Extraer access_token de las cookies
    const accessToken: string | undefined = request.cookies?.['access_token'];

    if (!accessToken) {
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      // 2. Validar y decodificar el JWT de la aplicación
      const decoded = this.authService.validateJwtToken(accessToken);

      // 3. Adjuntar usuario decodificado al request
      request.user = decoded;

      return true;
    } catch (err: any) {
      // 4. Si el token es inválido o expiró, lanzar 401
      // El frontend interceptará este error y ejecutará el refresh
      if (
        err.name === 'JsonWebTokenError' ||
        err.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Invalid or expired token');
      }
      throw err;
    }
  }
}
