import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Injectable, InternalServerErrorException } from '@nestjs/common'; // Ejemplo usando decoradores tipo NestJS

@Injectable()
export class StorageService {
  private minioClient: Minio.Client;

  private readonly BUCKET_NAME: string;

  constructor(private readonly configService: ConfigService) {
    const endPoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'localhost',
    );
    // Remove protocol (http:// or https://)
    let sanitizedEndPoint = endPoint.replace(/^https?:\/\//, '');
    // Remove port if present (e.g. :9000)
    if (sanitizedEndPoint.includes(':')) {
      sanitizedEndPoint = sanitizedEndPoint.split(':')[0];
    }

    this.minioClient = new Minio.Client({
      endPoint: sanitizedEndPoint,
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', ''),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', ''),
    });

    this.BUCKET_NAME = this.configService.get<string>('MINIO_BUCKET', 'pedilo');
  }

  /**
   * Genero una URL firmada
   */
  async getPresignedUrl(
    tenantId: string,
    contentType: string,
    ubication: string,
  ): Promise<{ url: string; key: string }> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(contentType)) {
      throw new Error('Invalid file type. Only JPG, PNG and WebP are allowed.');
    }

    const extension = contentType.split('/')[1];
    const objectKey = `${tenantId}/${ubication}/${uuidv4()}.${extension}`;

    const expiry = 5 * 60;

    try {
      const url = await this.minioClient.presignedPutObject(
        this.BUCKET_NAME,
        objectKey,
        expiry,
      );

      return { url, key: objectKey };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new InternalServerErrorException('Could not generate upload URL');
    }
  }

  /**
   * Genera una URL firmada para VER un objeto (GET).
   * Validez: 1 hora.
   */
  async getPresignedGetUrl(objectKey: string): Promise<string> {
    try {
      const expiry = 60 * 60; // 1 hora
      return await this.minioClient.presignedGetObject(
        this.BUCKET_NAME,
        objectKey,
        expiry,
      );
    } catch (error) {
      console.error('Error generating presigned GET URL:', error);
      // Si falla, devolvemos el key original o una cadena vacía, según prefieras.
      // Para desarrollo, devolver el key ayuda a depurar.
      return objectKey;
    }
  }

  // Método para validar si el objeto realmente existe antes de guardar el producto
  async validateObjectExists(objectKey: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.BUCKET_NAME, objectKey);
      return true;
    } catch (error: any) {
      console.error('Error al validar existencia de objeto', error);
      return false;
    }
  }
}
