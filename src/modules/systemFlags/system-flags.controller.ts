import { Controller, Get, Query } from '@nestjs/common';
import { SystemFlagsService } from './system-flags.service';

@Controller('system-flags')
export class SystemFlagsController {
  constructor(private readonly systemFlagsService: SystemFlagsService) {}

  /**
   * GET /system-flags?type=admin|public
   * Ejemplo: /system-flags?type=public
   */
  @Get()
  async getFlag(@Query('type') type: 'admin' | 'public') {
    if (!['admin', 'public'].includes(type)) {
      return { error: 'type debe ser admin o public' };
    }
    return this.systemFlagsService.getFlag(type);
  }
}
