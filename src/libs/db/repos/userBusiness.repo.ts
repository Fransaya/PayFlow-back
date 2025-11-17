import { Prisma } from '@prisma/client';

import {
  CreateUserBusinessDto,
  UpdateUserBusinessDto,
} from '@src/modules/userBusiness/dto/userBusiness.dto';

import { USERS_BUSINESS_STATUS } from '@src/constants/app.contants';

export function userBusinessRepo(tx: Prisma.TransactionClient) {
  return {
    getUsersForBusiness: async (tenantId: string) => {
      return tx.user_business.findMany({
        where: {
          tenant_id: tenantId,
        },
      });
    },

    async createUserBusiness(body: CreateUserBusinessDto, tenantId: string) {
      return tx.user_business.create({
        data: {
          tenant_id: tenantId,
          email: body.email,
          name: body.name,
          status: USERS_BUSINESS_STATUS.ACTIVE,
          created_at: new Date(),
        },
      });
    },

    async updateUserBusiness(
      body: UpdateUserBusinessDto,
      tenantId: string,
      userId: string,
    ) {
      return tx.user_business.update({
        where: {
          user_id: userId,
          tenant_id: tenantId,
        },
        data: body,
      });
    },
  };
}
