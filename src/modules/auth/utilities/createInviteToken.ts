// Método para crear invite tokens (si lo necesitas)

import { InternalServerErrorException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { InviteToken } from '@src/types/inviteToken';
import { ConfigService } from '@nestjs/config';

export function createInviteToken(
  payload: Omit<InviteToken, 'iat' | 'exp'>,
): string {
  const configService = new ConfigService();
  const JWT_SECRET = configService.get<string>('JWT_SECRET');
  if (!JWT_SECRET) {
    throw new InternalServerErrorException('JWT_SECRET is not defined');
  }

  const tokenPayload: InviteToken = {
    ...payload,
    expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
  };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: '24h', // Expiración estándar JWT adicional
  });
}
