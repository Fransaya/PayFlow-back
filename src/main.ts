import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { PrismaService } from './prisma/prisma.service';

import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const configServive = app.get(ConfigService);
  // const prismaService = app.get(PrismaService);
  // await prismaService.enableShutdownHooks(app);

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API con NestJS')
    .setDescription('Descripción de tu API')
    .setVersion('1.0')
    .addTag('docs') // Etiquetas opcionales para organizar endpoints
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Ruta donde estará disponible Swagger, ej: /docs

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Configuración CORS con credenciales
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
    ], // Orígenes permitidos
    credentials: true, // Permitir envío de cookies/credenciales
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Métodos HTTP permitidos
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-oauth-token',
      'x-google-token',
    ], // Headers permitidos
  });

  const port = configServive.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Listening on ${port}`);
}
bootstrap();
