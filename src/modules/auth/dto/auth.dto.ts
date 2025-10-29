import {
  IsString,
  MinLength,
  MaxLength,
  ValidateNested,
  Matches,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class TenantDto {
  @IsString({ message: 'Tenant name must be a string' })
  @IsNotEmpty({ message: 'Tenant name is required' })
  @MinLength(2, { message: 'Tenant name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Tenant name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString({ message: 'Tenant slug must be a string' })
  @IsNotEmpty({ message: 'Tenant slug is required' })
  @MinLength(3, { message: 'Tenant slug must be at least 3 characters long' })
  @MaxLength(50, { message: 'Tenant slug must not exceed 50 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  slug: string;
}

export class UserDto {
  @IsString({ message: 'Display name must be a string' })
  @IsNotEmpty({ message: 'Display name is required' })
  @MinLength(2, { message: 'Display name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Display name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  display_name: string;

  @IsNotEmpty({ message: 'El Telefono es obligatorio' })
  phone: string;
}

export class RegisterOwnerDto {
  @ValidateNested({ message: 'Tenant data is invalid' })
  @Type(() => TenantDto)
  tenant: TenantDto;

  @ValidateNested({ message: 'User data is invalid' })
  @Type(() => UserDto)
  user: UserDto;
}

export class UserBusinessDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class RegisterBusinessDto {
  @ValidateNested({ message: 'User data is invalid' })
  @Type(() => UserBusinessDto)
  user: UserBusinessDto;
}

export class QueryParmsRegisterBusinessDto {
  @IsString()
  @IsNotEmpty()
  invite_token: string;
}
