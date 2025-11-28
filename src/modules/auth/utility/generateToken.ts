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
  };

  // Define las opciones y haz un "type assertion"
  const options: any = {
    expiresIn,
  };

  const token = jsonwebtoken.sign(payload, config.jwt.secret, options);

  return token;
}
