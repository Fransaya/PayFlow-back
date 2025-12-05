import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrdersFilterDto {
  @IsOptional()
  @IsIn(['draft', 'pending', 'confirmed', 'paid', 'cancelled', 'completed'])
  status?: string;

  @IsOptional()
  @IsIn(['public', 'admin', 'whatsapp', 'pos'])
  source_channel?: string;

  @IsOptional()
  @IsIn([
    'today',
    'yesterday',
    'last_7_days',
    'last_30_days',
    'this_month',
    'last_month',
    'this_year',
    'last_year',
  ])
  date_range?: string;

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  // Campo interno, no viene del request
  tenant_id?: string;
}
