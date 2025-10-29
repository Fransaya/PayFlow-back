import { ApiProperty } from '@nestjs/swagger';
import {
  TenantDto,
  UserDto,
  RegisterOwnerDto,
  UserBusinessDto,
  RegisterBusinessDto,
  QueryParmsRegisterBusinessDto,
} from '../../dto/auth.dto';

// ----- Tenant -----
export class TenantDoc implements Omit<TenantDto, 'name' | 'slug'> {
  @ApiProperty({
    description: 'Tenant name',
    example: 'My Company',
    minLength: 2,
    maxLength: 100,
  })
  name: string;

  @ApiProperty({
    description: 'Tenant slug (URL friendly)',
    example: 'my-company',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    minLength: 3,
    maxLength: 50,
  })
  slug: string;
}

// ----- User -----
export class UserDoc implements Omit<UserDto, 'display_name'> {
  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  display_name: string;
  @ApiProperty({
    description: 'User phone number',
    example: '+1 123-456-7890',
  })
  phone: string;
}

// ----- Register Owner -----
export class RegisterOwnerDoc
  implements Omit<RegisterOwnerDto, 'tenant' | 'user'>
{
  @ApiProperty({ description: 'Tenant information', type: TenantDoc })
  tenant: TenantDoc;

  @ApiProperty({ description: 'User information', type: UserDoc })
  user: UserDoc;
}

// ----- Business -----
export class UserBusinessDoc
  implements Omit<UserBusinessDto, 'email' | 'name'>
{
  @ApiProperty({ example: 'test@example.com' })
  email: string;

  @ApiProperty({ example: 'My Business' })
  name: string;
}

export class RegisterBusinessDoc implements Omit<RegisterBusinessDto, 'user'> {
  @ApiProperty({ description: 'User information', type: UserBusinessDoc })
  user: UserBusinessDoc;
}

export class QueryParmsRegisterBusinessDoc
  implements Omit<QueryParmsRegisterBusinessDto, 'invite_token'>
{
  @ApiProperty({ example: 'some-invite-token' })
  invite_token: string;
}
