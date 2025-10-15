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
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import {
  RegisterBusinessDto,
  RegisterOwnerDto,
  QueryParmsRegisterBusinessDto,
} from '../dto/auth.dto';

import { AuthService } from '../service/auth.service';
import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

import { Auth0TokenGuard } from '@src/guards/auth0-token.guard';

import { CurrentUser } from '../../../common/decorators/extractUser.decorator';
import { IdTokenPayload } from '@src/types/idTokenPayload';
import { ApiRegisterOwnerDocs } from '../docs/register-owner.doc';

@ApiTags('Authentication')
@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync-auth-account')
  @UseGuards(Auth0TokenGuard)
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
  @UseGuards(Auth0TokenGuard)
  @HttpCode(HttpStatus.OK)
  logingApp(@CurrentUser() user: IdTokenPayload) {
    return this.authService.logingApp(user);
  }

  @Post('logout')
  @UseGuards(Auth0TokenGuard) // Guardia adicional de token interno de app.
  @HttpCode(HttpStatus.OK)
  logout() {}

  @Post('register-owner')
  @UseGuards(Auth0TokenGuard)
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
  // @UseGuards(Auth0TokenGuard)
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
    @CurrentUser() user: IdTokenPayload,
  ) {
    return await this.authService.registerBusiness(body, queryParams, user);
  }

  @Post('refresh')
  refresh() {}

  @Post('invite')
  invite() {}

  @Get('me')
  me() {}
}
