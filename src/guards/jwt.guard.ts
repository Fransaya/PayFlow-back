/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@src/modules/auth/services/auth.service';
import { GoogleTokenService } from '@src/modules/auth/services/google-token.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly googleTokenService: GoogleTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Leer header Authorization o Cookie
    const authHeader: string = request.headers['authorization'];
    let token: string | undefined;

    // console.log('request', request);

    if (authHeader) {
      const [scheme, t] = authHeader.split(' ');
      if (scheme.toLowerCase() === 'bearer') {
        token = t;
      }
    }

    // console.log('cookies', request.cookies);

    if (!token && request.cookies) {
      token = request.cookies['access_token'];
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    // Google Token logic
    const authHeaderGoogle: string = request.headers[
      'x-google-token'
    ] as string;
    let googleToken: string | null = null;

    if (authHeaderGoogle) {
      const [googleScheme, googleTokenValue] = authHeaderGoogle.split(' ');
      if (googleTokenValue && googleScheme.toLowerCase() === 'bearer') {
        googleToken = googleTokenValue;
      }
    }

    if (!googleToken && request.cookies) {
      googleToken = request.cookies['google_id_token'];
    }

    try {
      // 3. Validar y decodificar token JWT
      const decoded = this.authService.validateJwtToken(token);

      let decodedGoogle: any = null;
      if (googleToken) {
        decodedGoogle =
          await this.googleTokenService.decodeIdToken(googleToken);
      }

      // 4. Adjuntar usuario al request
      request.user = decoded;
      if (googleToken) {
        request.googleUser = decodedGoogle;
        request.googleToken = googleToken;
      }

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
