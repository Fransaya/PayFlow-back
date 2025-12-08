import * as crypto from 'crypto';
// La clave DEBE ser exactamente 32 bytes para AES-256
const MOCK_KMS_KEY = Buffer.from(
  process.env.KMS_MOCK_KEY_32_BYTES || '12345678901234567890123456789012', // Exactamente 32 caracteres
  'utf-8',
);

/**
 * 💡 Función mock para cifrar un token.
 * Reemplazar con la implementación real de AWS KMS o Vault.
 */
export function encryptToken(token: string): string {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    MOCK_KMS_KEY,
    MOCK_KMS_KEY.subarray(0, 16),
  );
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/**
 * Función para descifrar un token.
 */
export function decryptToken(encryptedToken: string): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    MOCK_KMS_KEY,
    MOCK_KMS_KEY.subarray(0, 16),
  );
  let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
