import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsIP,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO para crear una sesión
export class CreateSessionAppDto {
  @IsOptional()
  @IsUUID()
  user_owner_id?: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsNotEmpty()
  @IsUUID()
  tenant_id: string;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  refresh_token_enc: string;

  @IsNotEmpty()
  @Type(() => Date)
  refresh_expires_at: Date;

  @IsNotEmpty()
  @IsIP()
  ip_address: string;

  @IsNotEmpty()
  @IsString()
  user_agent: string;
}

// DTO para actualizar una sesión
export class UpdateSessionAppDto {
  @IsOptional()
  @IsString()
  refresh_token_enc?: string;

  @IsOptional()
  @Type(() => Date)
  refresh_expires_at?: Date;

  @IsOptional()
  @Type(() => Date)
  last_used_at?: Date;

  @IsOptional()
  @IsIP()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}

// DTO de respuesta (sin datos sensibles)
export class SessionAppResponseDto {
  session_id: string;
  user_owner_id: string | null;
  user_id: string | null;
  tenant_id: string;
  provider: string;
  refresh_expires_at: Date;
  created_at: Date;
  last_used_at: Date;
  ip_address: string;
  user_agent: string;

  // Omite refresh_token_enc por seguridad
}

// DTO para obtener data de una session completa.
export class SessionAppInternalDto {
  session_id: string;
  user_owner_id: string | null;
  user_id: string | null;
  tenant_id: string;
  provider: string | null;
  refresh_token_enc: string;
  refresh_expires_at: Date;
  created_at: Date;
  last_used_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
}

// DTO para consultas/filtros de sesión
export class SessionAppFilterDto {
  @IsOptional()
  @IsUUID()
  user_owner_id?: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsUUID()
  tenant_id?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsIP()
  ip_address?: string;

  // Filtros por fecha
  @IsOptional()
  @Type(() => Date)
  created_after?: Date;

  @IsOptional()
  @Type(() => Date)
  created_before?: Date;

  @IsOptional()
  @Type(() => Date)
  last_used_after?: Date;

  @IsOptional()
  @Type(() => Date)
  last_used_before?: Date;
}

// DTO mínimo para operaciones internas
export class SessionAppBasicDto {
  session_id: string;
  tenant_id: string;
  provider: string;
  created_at: Date;
  last_used_at: Date;
}

// DTO para validar refresh token
export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refresh_token: string;

  @IsOptional()
  @IsIP()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}
