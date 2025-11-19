import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo rol
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Nombre del rol',
    example: 'Vendedor',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del rol',
    example: 'Encargado de gestionar ventas y atención al cliente',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La descripción no puede exceder 255 caracteres',
  })
  description?: string | null;

  @ApiProperty({
    description: 'Array de permisos asignados al rol',
    example: ['product:read', 'product:write', 'order:read'],
    type: [String],
    isArray: true,
  })
  @IsArray({ message: 'Los permisos deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe asignar al menos un permiso al rol' })
  @IsString({
    each: true,
    message: 'Cada permiso debe ser una cadena de texto',
  })
  permissions: string[];
}

/**
 * DTO para actualizar un rol existente
 * Todos los campos son opcionales
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiPropertyOptional({
    description: 'Estado activo/inactivo del rol',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo active debe ser un booleano' })
  active?: boolean;
}

/**
 * DTO de respuesta para un rol
 */
export class RoleResponseDto {
  @ApiProperty({
    description: 'ID único del rol',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  role_id: string;

  @ApiProperty({
    description: 'ID del tenant al que pertenece el rol',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  tenant_id: string;

  @ApiProperty({
    description: 'Nombre del rol',
    example: 'Vendedor',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del rol',
    example: 'Encargado de gestionar ventas',
  })
  description?: string | null;

  @ApiProperty({
    description: 'Array de permisos asignados al rol',
    example: ['product:read', 'product:write', 'order:read'],
    type: [String],
  })
  permissions: string[];

  @ApiProperty({
    description: 'Estado del rol',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Fecha de creación del rol',
    example: '2024-11-19T12:00:00Z',
  })
  created_at: Date;
}

/**
 * DTO para asignar un rol a un usuario
 */
export class AssignRoleDto {
  @ApiProperty({
    description: 'ID del usuario al que se asignará el rol',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsString()
  user_id: string;

  @ApiProperty({
    description: 'ID del rol a asignar',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsString()
  role_id: string;
}
