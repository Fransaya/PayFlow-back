import {
  IsInt,
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class UpdateBusinessHourDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'open_time debe tener formato HH:mm (ej: 09:00)',
  })
  open_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'close_time debe tener formato HH:mm (ej: 18:00)',
  })
  close_time?: string;

  @IsOptional()
  @IsBoolean()
  is_closed?: boolean;
}
