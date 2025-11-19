import { Prisma } from '@prisma/client';

import {
  CreateUserBusinessDto,
  UpdateUserBusinessDto,
} from '@src/modules/userBusiness/dto/userBusiness.dto';

import { USERS_BUSINESS_STATUS } from '@src/constants/app.contants';

export function userBusinessRepo(tx: Prisma.TransactionClient) {
  return {
    getUserBusinessBasicInfo: async (userId: string) => {
      return tx.user_business.findUnique({
        where: {
          user_id: userId,
        },
        select: {
          email: true,
          name: true,
        },
      });
    },
    getUsersForBusiness: async (tenantId: string) => {
      return tx.user_business.findMany({
        where: {
          tenant_id: tenantId,
        },
      });
    },

    getSpecificUserBusiness: async (tenantId: string, userId: string) => {
      return tx.user_business.findFirst({
        where: {
          tenant_id: tenantId,
          user_id: userId,
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
