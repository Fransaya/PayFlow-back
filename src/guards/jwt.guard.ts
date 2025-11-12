import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@src/modules/auth/service/auth.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Leer header Authorization
    const authHeader: string = request.headers['authorization'];
    if (!authHeader) {
      throw new BadRequestException('Authorization header is required');
    }

    // 2. Extraer token (Bearer <token>)
    const [scheme, token] = authHeader.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer') {
      throw new BadRequestException('JWT token is required');
    }

    try {
      // 3. Validar y decodificar token JWT
      const decoded = this.authService.validateJwtToken(token);

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
