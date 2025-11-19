import { Module } from '@nestjs/common';
import { RoleController } from './controller/role.controller';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to access AuthService
import { RoleService } from './services/role.service';

@Module({
  imports: [AuthModule], // Import AuthModule to have access to AuthService
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
