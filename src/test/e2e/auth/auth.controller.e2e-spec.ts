import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@src/app.module';
import { AuthService } from '@src/modules/auth/service/auth.service';
import { GoogleTokenService } from '@src/modules/auth/service/google-token.service';
import { IdTokenPayload } from '@src/types/idTokenPayload';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const authService = {
    registerOwner: jest.fn(),
    registerBusiness: jest.fn(),
  };
  const googleTokenService = {
    decodeIdToken: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(authService)
      .overrideProvider(GoogleTokenService)
      .useValue(googleTokenService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUser: IdTokenPayload = {
    sub: 'auth0|123',
    email: 'owner@example.com',
    email_verified: true,
  };

  describe('POST /api/v1/auth/register-owner', () => {
    it('→ 201 cuando todo está bien', async () => {
      const dto = {
        tenant: { name: 'ACME', slug: 'acme' },
        user: { display_name: 'John' },
      };
      const res = {
        success: true,
        data: { tenant: {}, user: {}, authAccount: {} },
        message: 'Owner registered successfully',
      };
      authService.registerOwner.mockResolvedValue(res);
      googleTokenService.decodeIdToken.mockResolvedValue(mockUser);

      const { body } = await request(app.getHttpServer())
        .post('/api/v1/auth/register-owner')
        .set('x-oauth-token', 'Bearer fake-token')
        .send(dto)
        .expect(201);

      expect(body).toEqual(res);
      expect(googleTokenService.decodeIdToken).toHaveBeenCalledWith(
        'fake-token',
      );
      expect(authService.registerOwner).toHaveBeenCalledWith(dto, mockUser);
    });

    it('→ 400 cuando falta x-oauth-token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register-owner')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Authorization header is required');
        });
    });

    it('→ 400 cuando el dto no valida', async () => {
      googleTokenService.decodeIdToken.mockResolvedValue(mockUser);
      await request(app.getHttpServer())
        .post('/api/v1/auth/register-owner')
        .set('x-oauth-token', 'Bearer fake-token')
        .send({ tenant: { slug: 'acme' } }) // falta name
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/register-business', () => {
    it('→ 201 cuando todo está bien', async () => {
      const dto = { user: { email: 'biz@acme.com', name: 'Biz' } };
      const query = { 'invite-token': 'inv_123' };
      const res = {
        success: true,
        data: { userBusiness: {}, authAccount: {} },
        message: 'Business registered successfully',
      };
      authService.registerBusiness.mockResolvedValue(res);
      googleTokenService.decodeIdToken.mockResolvedValue(mockUser);

      const { body } = await request(app.getHttpServer())
        .post('/api/v1/auth/register-business')
        .query(query)
        .set('x-oauth-token', 'Bearer fake-token')
        .send(dto)
        .expect(201);

      expect(body).toEqual(res);
      expect(authService.registerBusiness).toHaveBeenCalledWith(
        dto,
        query,
        mockUser,
      );
    });
  });
});
