import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import {
  RegisterBusinessDto,
  RegisterOwnerDto,
  QueryParmsRegisterBusinessDto,
} from '../dto/auth.dto';

import { AuthService } from '../service/auth.service';
import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { GoogleTokenGuard } from '@src/guards/google-token.guard';

import { CurrentUser } from '../../../common/decorators/extractUser.decorator';
import { IdTokenPayload } from '@src/types/idTokenPayload';
import { ApiRegisterOwnerDocs } from '../docs/register-owner.doc';

@ApiTags('Authentication')
@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-url')
  @HttpCode(HttpStatus.OK)
  async getLoginUrl(): Promise<{ loginUrl: string }> {
    return this.authService.getLoginUrl();
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async handleAuthCallback(@Body('code') code: string) {
    return this.authService.handleAuthCallback(code);
  }

  @Post('sync-auth-account')
  @UseGuards(GoogleTokenGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async synchAuthAccount(@CurrentUser() user: IdTokenPayload): Promise<any> {
    return await this.authService.synchAuthAccount(user);
  }

  @Post('login')
  @UseGuards(GoogleTokenGuard)
  @HttpCode(HttpStatus.OK)
  logingApp(@CurrentUser() user: IdTokenPayload) {
    return this.authService.logingApp(user);
  }

  @Post('login-business/:tenantSlug')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  loginBusinessApp(
    @Body() body: { email: string; password: string },
    @Param('tenantSlug') tenantSlug: string,
  ) {
    return this.authService.loginBusinessApp(body, tenantSlug);
  }

  @Post('logout')
  @UseGuards(GoogleTokenGuard) // Guardia adicional de token interno de app.
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: IdTokenPayload) {
    return this.authService.logoutApp(user);
  }

  @Post('register-owner')
  @UseGuards(GoogleTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiRegisterOwnerDocs()
  async registerOwner(
    @Body() body: RegisterOwnerDto,
    @CurrentUser() user: IdTokenPayload,
  ) {
    return await this.authService.registerOwner(body, user);
  }

  @Post('register-business')
  // @UseGuards(GoogleTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async registerBusiness(
    @Body() body: RegisterBusinessDto,
    @Query() queryParams: QueryParmsRegisterBusinessDto,
  ) {
    return await this.authService.registerBusiness(body, queryParams);
  }

  //TODO: pendiente de implementacion
  @Post('refresh')
  refresh() {}

  @Post('invite')
  invite() {}
}
