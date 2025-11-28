// Importa el tipo 'SignOptions' desde la librería
import jsonwebtoken from 'jsonwebtoken';
import authConfig from '@src/config/auth.config';

const config = authConfig();

export function decodeToken(token: string): { [key: string]: any } {
  try {
    const decoded = jsonwebtoken.verify(token, config.jwt.secret);
    return decoded as { [key: string]: any };
  } catch (error) {
    console.log('error in decode token', error);
    throw new Error('Invalid token');
  }
}

export function decodeTokenGoogle(token: string): { [key: string]: any } {
  const decoded = jsonwebtoken.decode(token, { complete: true });
  console.log('Decoded Google Token in decodeTokenGoogle:', decoded);
  return decoded as { [key: string]: any };
}
