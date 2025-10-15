import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@src/modules/auth/controller/auth.controller';
import { AuthService } from '@src/modules/auth/service/auth.service';
import {
  RegisterOwnerDto,
  RegisterBusinessDto,
  QueryParmsRegisterBusinessDto,
} from '@src/modules/auth/dto/auth.dto';
import { IdTokenPayload } from '@src/types/idTokenPayload';

describe('AuthController - unit', () => {
  let controller: AuthController;
  let service: jest.Mocked<
    Pick<AuthService, 'registerOwner' | 'registerBusiness'>
  >;

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
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            registerOwner: jest.fn(),
            registerBusiness: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerOwner', () => {
    it('si lo delega bien al servicio devuelve 201', async () => {
      const dto: RegisterOwnerDto = {
        tenant: { name: 'ACME', slug: 'acme' },
        user: { display_name: 'John' },
      };
      const res: any = {
        success: true,
        data: {
          tenant: {
            name: 'tenat',
            tenant_id: 'tenat_id',
            slug: 'tenat_slug',
            primary_color: 'tenat_primary_color',
            secondary_color: 'tenat_secondary_color',
            custom_domain: 'tenat_custom_domain',
            plan_status: 'tenat_plan_status',
            created_at: new Date(),
          },
          user_owner: {
            tenant_id: 'tenant_id',
            mail: 'email@gmail.com',
            active: true,
          },
          auth_account: {
            user_type: '',
            user_ref: '',
            provider: '',
            provider_sub: '',
            email: '',
            password_hash: '',
          },
        },
        message: 'Owner registered successfully',
      };
      service.registerOwner.mockResolvedValue(res);

      const result = await controller.registerOwner(dto, mockUser);
      expect(result).toEqual(res);
      expect(service.registerOwner).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('registerBusiness', () => {
    it('si lo delega bien al servicio devuelve 201', async () => {
      const dto: RegisterBusinessDto = {
        user: { email: 'biz@acme.com', name: 'Biz' },
      };
      const query: QueryParmsRegisterBusinessDto = {
        invite_token: 'inv_123',
      };
      const res: any = {
        success: true,
        data: { userBusiness: {}, authAccount: {} },
        message: 'Business registered successfully',
      };
      service.registerBusiness.mockResolvedValue(res);

      const result = await controller.registerBusiness(dto, query, mockUser);
      expect(result).toEqual(res);
      expect(service.registerBusiness).toHaveBeenCalledWith(
        dto,
        query,
        mockUser,
      );
    });
  });
});
