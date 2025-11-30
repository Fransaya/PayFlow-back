import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { InviteToken } from '@src/types/inviteToken';
import { ConfigService } from '@nestjs/config';

import { isValidInviteTokenPayload } from './validation.auth.';

export function validateInviteToken(invite_token: string): InviteToken {
  // 1. Validación de entrada
  if (!invite_token?.trim()) {
    throw new BadRequestException('Invite token is required');
  }

  const configService = new ConfigService();

  // 2. Validación de configuración
  const JWT_SECRET = configService.get<string>('JWT_SECRET');
  if (!JWT_SECRET) {
    throw new InternalServerErrorException('JWT_SECRET is not defined');
  }

  try {
    // 3. Verificación y decodificación del token
    const decoded = jwt.verify(invite_token, JWT_SECRET) as InviteToken;

    // 4. Validación de estructura del payload
    if (!isValidInviteTokenPayload(decoded)) {
      throw new BadRequestException('Invalid invite token structure');
    }

    // 5. Validación de expiración manual (si usas expires_at custom)
    if (decoded.expires_at && decoded.expires_at < Date.now() / 1000) {
      throw new UnauthorizedException('Invite token has expired');
    }

    return decoded;
  } catch (error: any) {
    // Manejo específico de errores JWT
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedException('Invite token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new BadRequestException('Invalid invite token format');
    }
    if (error instanceof jwt.NotBeforeError) {
      throw new UnauthorizedException('Invite token not yet valid');
    }

    // Re-throw errores de validación personalizada
    if (
      error instanceof BadRequestException ||
      error instanceof UnauthorizedException
    ) {
      throw error;
    }

    // Error inesperado
    throw new InternalServerErrorException('Error validating invite token');
  }
}
