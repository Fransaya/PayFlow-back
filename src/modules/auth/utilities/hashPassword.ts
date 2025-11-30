import * as bcrypt from 'bcrypt';

const saltRounds = 10;

export async function hashPassword(password: string): Promise<string> {
  // Genera el hash de la clave
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}
