import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateVisualConfigDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  primary_color?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  secondary_color?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  logo_url?: string;
}
