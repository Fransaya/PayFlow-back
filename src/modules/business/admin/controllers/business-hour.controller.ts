import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { UserFromJWT } from '@src/types/userFromJWT';
import { BusinessHourService } from '../services/business-hour.service';
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';
import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';
import { JwtGuard } from '@src/guards/jwt.guard';
import { CreateBusinessHourDto } from '../dto/create-business-hour.dto';
import { UpdateBusinessHourDto } from '../dto/update-business-hour.dto';
import { BusinessHourResponse } from '@src/types/business-hour';

@Controller('business/hours')
@UseFilters(HttpExceptionFilter)
export class BusinessHourController {
  constructor(private readonly businessHourService: BusinessHourService) {}

  @Get()
  @UseGuards(JwtGuard)
  async getBusinessHours(
    @CurrentUser() user: UserFromJWT,
  ): Promise<BusinessHourResponse[]> {
    const tenantId = user.tenant_id;
    return await this.businessHourService.getBusinessHoursByTenantId(tenantId);
  }

  @Post()
  @UseGuards(JwtGuard)
  async createBusinessHour(
    @CurrentUser() user: UserFromJWT,
    @Body() body: CreateBusinessHourDto,
  ): Promise<BusinessHourResponse> {
    const tenantId = user.tenant_id;
    return await this.businessHourService.createBusinessHour({
      tenant_id: tenantId,
      ...body,
    });
  }

  @Put(':hour_id')
  @UseGuards(JwtGuard)
  async updateBusinessHour(
    @Param('hour_id') hour_id: string,
    @CurrentUser() user: UserFromJWT,
    @Body() body: UpdateBusinessHourDto,
  ): Promise<BusinessHourResponse> {
    const tenantId = user.tenant_id;
    return await this.businessHourService.updateBusinessHour(
      hour_id,
      tenantId,
      body,
    );
  }

  @Delete(':hour_id')
  @UseGuards(JwtGuard)
  async deleteBusinessHour(
    @Param('hour_id') hour_id: string,
    @CurrentUser() user: UserFromJWT,
  ): Promise<{ message: string }> {
    const tenantId = user.tenant_id;
    return await this.businessHourService.deleteBusinessHour(hour_id, tenantId);
  }
}
