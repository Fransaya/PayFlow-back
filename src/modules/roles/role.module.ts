import { Module } from '@nestjs/common';
import { RoleController } from './controllers/role.controller';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to access AuthService
import { RoleService } from './services/role.service';
import { GoogleTokenService } from '../auth/services/google-token.service';

@Module({
  imports: [AuthModule], // Import AuthModule to have access to AuthService
  controllers: [RoleController],
  providers: [RoleService, GoogleTokenService],
  exports: [RoleService],
})
export class RoleModule {}
