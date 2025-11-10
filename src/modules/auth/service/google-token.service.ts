// Servicio para validar tokens de Google OAuth 2.0
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { IdTokenPayload } from '@src/types/idTokenPayload';

@Injectable()
export class GoogleTokenService {
  private client = jwksClient({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5, // Límite de requests por minuto
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs', // Google's public keys
  });

  async decodeIdToken(idToken: string): Promise<IdTokenPayload> {
    try {
      // 1. Descodificar sin verificar para leer el header
      const decoded = jwt.decode(idToken, { complete: true });

      if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new UnauthorizedException('Invalid token structure');
      }

      // 2. Obtener la clave pública que firmó ese kid
      const key = await this.client.getSigningKey(decoded.header.kid);
      const signingKey = key.getPublicKey();

      // 3. Verificar firma + claims estándar de Google
      const payload = jwt.verify(idToken, signingKey, {
        algorithms: ['RS256'],
        audience: process.env.GOOGLE_CLIENT_ID, // El client ID de tu app en Google
        issuer: ['https://accounts.google.com', 'accounts.google.com'], // Issuers válidos de Google
        clockTolerance: 10, // Tolerancia de 10 segundos para diferencias de reloj
      }) as IdTokenPayload;

      // // 4. Validaciones adicionales opcionales de Google
      // if (!payload.email_verified) {
      //   throw new UnauthorizedException('Email not verified');
      // }

      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      // Re-throw otros errores
      throw error;
    }
  }
}
