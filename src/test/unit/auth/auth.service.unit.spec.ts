import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@src/modules/auth/service/auth.service';
import { Auth0TokenService } from '@src/modules/auth/service/auth0-token.service';
import { DbService } from '@libs/db';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  RegisterOwnerDto,
  RegisterBusinessDto,
  QueryParmsRegisterBusinessDto,
} from '@src/modules/auth/dto/auth.dto';
import { IdTokenPayload } from '@src/types/idTokenPayload';
import { InviteToken } from '@src/types/inviteToken';
import * as jwt from 'jsonwebtoken';

jest.mock('@libs/db', () => ({
  DbService: jest.fn().mockImplementation(() => ({
    runInTransaction: jest.fn((_, cb) => cb(mockTx)),
  })),
  authRepo: jest.fn(() => mockTx.authRepo),
  tenantRepo: jest.fn(() => mockTx.tenantRepo),
  userRepo: jest.fn(() => mockTx.userRepo),
}));

const mockTx = {
  authRepo: {
    createOwnerWithTransaction: jest.fn(),
    createBusinessWithTransaction: jest.fn(),
  },
  tenantRepo: {
    tenantExist: jest.fn(),
    tenantExistById: jest.fn(),
  },
  userRepo: {
    userExistsByEmail: jest.fn(),
    userExistsInTenant: jest.fn(),
  },
};

describe('AuthService - unit', () => {
  let service: AuthService;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let auth0TokenService: jest.Mocked<Pick<Auth0TokenService, 'decodeIdToken'>>;

  const mockUser: IdTokenPayload = {
    sub: 'auth0|123',
    email: 'owner@example.com',
    email_verified: true,
    nickname: 'test',
    name: 'test',
    picture: 'test',
    updated_at: 'test',
    iss: 'test',
    aud: 'test',
    ext: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DbService,
          useValue: { runInTransaction: jest.fn((_, cb) => cb(mockTx)) },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'JWT_SECRET' ? 'test-secret' : null,
            ),
          },
        },
        {
          provide: Auth0TokenService,
          useValue: { decodeIdToken: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get(ConfigService);
    auth0TokenService = module.get(Auth0TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerOwner', () => {
    it('✅ should create owner successfully', async () => {
      const dto: RegisterOwnerDto = {
        tenant: { name: 'ACME', slug: 'acme' },
        user: { display_name: 'John' },
      };

      const mockResult = {
        tenant: { tenant_id: 't1', name: 'ACME', slug: 'acme' },
        user_owner: {
          user_owner_id: 'u1',
          name: 'John',
          email: mockUser.email,
        },
        auth_account: {
          account_id: 'a1',
          email: mockUser.email,
          user_type: 'owner',
        },
      };

      mockTx.tenantRepo.tenantExist.mockResolvedValue(false);
      mockTx.userRepo.userExistsByEmail.mockResolvedValue(false);
      mockTx.authRepo.createOwnerWithTransaction.mockResolvedValue(mockResult);

      const result = await service.registerOwner(dto, mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(result.message).toBe('Owner registered successfully');
      expect(mockTx.authRepo.createOwnerWithTransaction).toHaveBeenCalledWith(
        { name: 'ACME', slug: 'acme' },
        { name: 'John', email: 'owner@example.com' },
        { user_type: 'owner', provider: 'auth0', provider_sub: 'auth0|123' },
      );
    });

    it('❌ should throw ConflictException if tenant slug exists', async () => {
      const dto: RegisterOwnerDto = {
        tenant: { name: 'ACME', slug: 'acme' },
        user: { display_name: 'John' },
      };

      mockTx.tenantRepo.tenantExist.mockResolvedValue(true);

      await expect(service.registerOwner(dto, mockUser)).rejects.toThrow(
        new ConflictException('Tenant with slug "acme" already exists'),
      );
    });

    it('❌ should throw ConflictException if user email exists', async () => {
      const dto: RegisterOwnerDto = {
        tenant: { name: 'ACME', slug: 'acme' },
        user: { display_name: 'John' },
      };

      mockTx.tenantRepo.tenantExist.mockResolvedValue(false);
      mockTx.userRepo.userExistsByEmail.mockResolvedValue(true);

      await expect(service.registerOwner(dto, mockUser)).rejects.toThrow(
        new ConflictException(
          'User with email "owner@example.com" already exists',
        ),
      );
    });

    it('❌ should throw BadRequestException if DTO is invalid', async () => {
      const dto = {
        tenant: { name: '', slug: 'acme' },
        user: { display_name: 'John' },
      } as RegisterOwnerDto;

      await expect(service.registerOwner(dto, mockUser)).rejects.toThrow(
        new BadRequestException('Tenant name is required'),
      );
    });

    it('❌ should throw InternalServerErrorException if Prisma fails', async () => {
      const dto: RegisterOwnerDto = {
        tenant: { name: 'ACME', slug: 'acme' },
        user: { display_name: 'John' },
      };

      mockTx.tenantRepo.tenantExist.mockRejectedValue(new Error('DB down'));

      await expect(service.registerOwner(dto, mockUser)).rejects.toThrow(
        new InternalServerErrorException('Error validating tenant'),
      );
    });
  });

  describe('registerBusiness', () => {
    const mockInviteToken: InviteToken = {
      tenant_id: 't1',
      role_id: 'r1',
      email_asociated: 'biz@acme.com',
      status: 'active',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    const dto: RegisterBusinessDto = {
      user: { email: 'biz@acme.com', name: 'Biz' },
    };

    const query: QueryParmsRegisterBusinessDto = {
      invite_token: 'valid.jwt.token',
    };

    it('✅ should create business user successfully', async () => {
      const mockResult = {
        user_business: {
          user_id: 'ub1',
          tenant_id: 't1',
          email: 'biz@acme.com',
          name: 'Biz',
        },
        auth_account: {
          account_id: 'a1',
          email: 'biz@acme.com',
          user_type: 'business',
        },
      };

      jest.spyOn(jwt, 'verify').mockReturnValue(mockInviteToken as any);
      mockTx.tenantRepo.tenantExistById.mockResolvedValue(true);
      mockTx.userRepo.userExistsInTenant.mockResolvedValue(false);
      mockTx.authRepo.createBusinessWithTransaction.mockResolvedValue(
        mockResult,
      );

      const result = await service.registerBusiness(dto, query, {
        ...mockUser,
        email: 'biz@acme.com',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(result.message).toBe('Business user registered successfully');
    });

    it('❌ should throw BadRequestException if invite token is missing', async () => {
      await expect(
        service.registerBusiness(dto, { invite_token: '' }, mockUser),
      ).rejects.toThrow(new BadRequestException('Invite token is required'));
    });

    it('❌ should throw UnauthorizedException if token is expired', async () => {
      const expiredToken = {
        ...mockInviteToken,
        expires_at: Math.floor(Date.now() / 1000) - 100,
      };
      jest.spyOn(jwt, 'verify').mockReturnValue(expiredToken as any);

      await expect(
        service.registerBusiness(dto, query, {
          ...mockUser,
          email: 'biz@acme.com',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invite token has expired'));
    });

    it('❌ should throw BadRequestException if email does not match', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue(mockInviteToken as any);

      await expect(
        service.registerBusiness(dto, query, mockUser), // email distinto
      ).rejects.toThrow(
        new BadRequestException(
          'Invite token email does not match authenticated user email',
        ),
      );
    });

    it('❌ should throw ConflictException if user already in tenant', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue(mockInviteToken as any);
      mockTx.tenantRepo.tenantExistById.mockResolvedValue(true);
      mockTx.userRepo.userExistsInTenant.mockResolvedValue(true);

      await expect(
        service.registerBusiness(dto, query, {
          ...mockUser,
          email: 'biz@acme.com',
        }),
      ).rejects.toThrow(
        new ConflictException(
          'User with email "biz@acme.com" already exists in this tenant',
        ),
      );
    });
  });
});
