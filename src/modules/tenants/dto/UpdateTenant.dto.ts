import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'Nombre del tenant',
    example: 'Mi Tienda Online',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Color primario en formato hexadecimal',
    example: '#FF5733',
    pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message:
      'El color primario debe estar en formato hexadecimal (#FFF o #FFFFFF)',
  })
  primary_color?: string | null;

  @ApiPropertyOptional({
    description: 'Color secundario en formato hexadecimal',
    example: '#33FF57',
    pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message:
      'El color secundario debe estar en formato hexadecimal (#FFF o #FFFFFF)',
  })
  secondary_color?: string | null;

  @ApiPropertyOptional({
    description: 'Dominio personalizado del tenant',
    example: 'mitienda.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'El dominio no puede exceder 255 caracteres' })
  @Matches(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    {
      message: 'El dominio debe ser válido (ej: ejemplo.com)',
    },
  )
  custom_domain?: string | null;
}
