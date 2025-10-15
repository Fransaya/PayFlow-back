// src/modules/auth/docs/register-owner.doc.ts
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiRegisterOwnerDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Register new tenant owner' }),
    ApiResponse({
      status: 201,
      description: 'Owner successfully registered',
      schema: {
        example: {
          success: true,
          data: {
            user: {
              /* user data */
            },
            authAccount: {
              /* auth account data */
            },
            tenant: {
              /* tenant data */
            },
          },
          message: 'Owner registered successfully',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation errors or invalid token',
      schema: {
        example: {
          statusCode: 400,
          message: 'ID token is required',
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - tenant already exists',
      schema: {
        example: {
          statusCode: 409,
          message: 'Tenant with slug "example" already exists',
          error: 'Conflict',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        example: {
          statusCode: 500,
          message: 'An error occurred during owner registration',
          error: 'Internal Server Error',
        },
      },
    }),
  );
}
