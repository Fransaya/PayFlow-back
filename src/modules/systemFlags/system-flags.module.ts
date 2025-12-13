import { Module } from '@nestjs/common';
import { SystemFlagsService } from './system-flags.service';
import { SystemFlagsController } from './system-flags.controller';
import { DbModule } from '../../libs/db/db.module';

@Module({
  imports: [DbModule],
  controllers: [SystemFlagsController],
  providers: [SystemFlagsService],
  exports: [SystemFlagsService],
})
export class SystemFlagsModule {}
