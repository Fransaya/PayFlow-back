import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsPhoneNumber,
} from 'class-validator';

// DTO que refleja la interface Business
export class CreateBusinessDto {
  @IsUUID()
  @IsNotEmpty()
  business_id: string;

  @IsUUID()
  @IsNotEmpty()
  tenant_id: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  legal_name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value == null ? null : String(value).trim()))
  cuit: string | null;

  // Nota: el nombre en la interface original es `contanct_name` (se mantiene aquí)
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value == null ? null : String(value).trim()))
  contanct_name: string | null;

  @IsOptional()
  @IsPhoneNumber('AR', { message: 'Invalid phone number' })
  @Transform(({ value }) => (value == null ? null : String(value).trim()))
  contanct_phone: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value == null ? null : String(value).trim()))
  address: string | null;
}
