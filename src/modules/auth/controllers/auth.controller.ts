/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
  Param,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ApiTags } from '@nestjs/swagger';
import {
  RegisterBusinessDto,
  RegisterOwnerDto,
  QueryParmsRegisterBusinessDto,
} from '../dto/auth.dto';

import { AuthService } from '../services/auth.service';
import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { JwtGuard } from '@src/guards/jwt.guard';
import { GoogleTokenGuard } from '@src/guards/google-token.guard';

import { CurrentUser } from '../../../common/decorators/extractUser.decorator';
import { IdTokenPayload } from '@src/types/idTokenPayload';
import { ApiRegisterOwnerDocs } from '../docs/register-owner.doc';
import { UserFromJWT } from '@src/types/userFromJWT';

@ApiTags('Authentication')
@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-url')
  @HttpCode(HttpStatus.OK)
  getLoginUrl(): Promise<{ loginUrl: string }> {
    return this.authService.getLoginUrl();
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async handleAuthCallback(
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.handleAuthCallback(code);

    // Usar método centralizado para establecer cookies de Google
    this.authService.setGoogleTokenCookies(
      res,
      result.access_token,
      result.refresh_token || null,
      result.id_token,
      result.expires_in,
    );

    // Usar método centralizado para establecer cookies de la App si el login fue exitoso
    if (result.app_session) {
      this.authService.setAuthCookies(
        res,
        result.app_session.access_token,
        result.app_session.refresh_token,
      );
    }

    return result;
  }

  @Post('sync-auth-account')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async synchAuthAccount(
    @CurrentUser('googleUser') user: IdTokenPayload,
  ): Promise<any> {
    return await this.authService.synchAuthAccount(user);
  }

  @Post('login')
  @UseGuards(JwtGuard)
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
  async loginBusinessApp(
    @Body() body: { email: string; password: string },
    @Param('tenantSlug') tenantSlug: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginBusinessApp(body, tenantSlug);

    // Usar método centralizado para establecer cookies de la App
    this.authService.setAuthCookies(
      res,
      result.data.access_token,
      result.data.refresh_token,
    );

    return result;
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  logout(
    @CurrentUser() user: UserFromJWT,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = this.authService.logoutApp(user);

    // Usar método centralizado para limpiar todas las cookies
    this.authService.clearAuthCookies(res);

    return result;
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
    @CurrentUser('googleUser') user: IdTokenPayload,
  ) {
    return await this.authService.registerOwner(body, user);
  }

  @Post('register-business')
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    const googleRefreshToken = req.cookies['google_refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const user = this.authService.validateJwtToken(refreshToken) as UserFromJWT;

    const result = await this.authService.refreshSession(
      user,
      undefined,
      googleRefreshToken,
    );

    // Usar método centralizado para establecer cookies de la App
    this.authService.setAuthCookies(
      res,
      result.access_token_app,
      result.refresh_token_app,
    );

    // Usar método centralizado para establecer cookies de Google si están presentes
    if (result.access_token_google && result.id_token_google) {
      this.authService.setGoogleTokenCookies(
        res,
        result.access_token_google,
        null, // refresh_token de Google no se renueva en este flujo
        result.id_token_google,
        result.expires_in,
      );
    }

    return result;
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  getMe(@CurrentUser() user: UserFromJWT) {
    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        tenant_id: user.tenant_id,
        provider: user.provider,
        user_type: user.user_type,
        roles: user.roles || null,
        expires_at: user.exp,
      },
      token: 'authenticated',
    };
  }

  @Post('invite')
  invite() {}
}
