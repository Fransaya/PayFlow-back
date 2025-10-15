import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Auth0TokenService } from '@src/modules/auth/service/auth0-token.service';
import { IdTokenPayload } from '@src/types/idTokenPayload';

@Injectable()
export class TokenAuth0Middleware implements NestMiddleware {
  constructor(private readonly auth0TokenService: Auth0TokenService) {}

  async use(req: any, res: any, next: NextFunction) {
    try {
      // Extraer el token del header Authorization
      const authHeader: string = req.headers.authorization as string;

      if (!authHeader) {
        throw new BadRequestException('Authorization header is required');
      }

      const token: string = authHeader.split(' ')[1];

      if (!token) {
        throw new BadRequestException('ID token is required');
      }

      // Verificar y decodificar el token
      const decodedToken: IdTokenPayload =
        await this.auth0TokenService.decodeIdToken(token);

      // Añadir los datos del usuario al request
      req.user = decodedToken;

      next();
    } catch (error: any) {
      // Si es un error de validación JWT, convertirlo a UnauthorizedException
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        next(new UnauthorizedException('Invalid or expired token'));
      } else {
        // Propagar otros errores (BadRequestException, etc.)
        next(error);
      }
    }
  }
}
