// Importa el tipo 'SignOptions' desde la librería
import jsonwebtoken from 'jsonwebtoken';
import authConfig from '@src/config/auth.config';

const config = authConfig();

export function generateToken(
  session: {
    user_id: string;
    tenant_id: string;
    provider: string;
    user_type: string;
    roles?: any | null;
    expires_at: number;
  },
  user: { email: string },
  expiresIn: string,
): string {
  const payload: { [key: string]: any } = {
    user_id: session.user_id,
    tenant_id: session.tenant_id,
    email: user.email,
    provider: session.provider,
    user_type: session.user_type,
    roles: session.roles || null,
    exp: Math.floor(session.expires_at / 1000),
  };

  // No pasamos expiresIn porque ya tenemos exp en el payload
  // Si pasamos ambos, JWT lanza error: Bad "options.expiresIn" option the payload already has an "exp" property
  const token = jsonwebtoken.sign(payload, config.jwt.secret);

  return token;
}
