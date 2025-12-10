import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PeriodEnum {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class AnalyticsFiltersDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(PeriodEnum)
  period?: PeriodEnum;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  source_channel?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  payment_method?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  delivery_method?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category_id?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  product_id?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsString()
  customer_phone?: string;
}

export class LimitQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class ThresholdQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  threshold?: number = 10;
}
