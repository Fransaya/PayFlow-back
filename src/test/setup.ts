import { config } from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno de prueba
config({ path: join(__dirname, '..', '.env.test') });

// Verificar variables de entorno al inicio
const requiredEnvVars = [
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
];

console.log('🔧 Verificando configuración de tests...');

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Missing environment variable: ${envVar}`);
  } else {
    console.log(`✅ ${envVar} configurado`);
  }
}

console.log('🚀 Setup de tests completado');
