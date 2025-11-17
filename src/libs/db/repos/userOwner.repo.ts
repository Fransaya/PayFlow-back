import { Prisma } from '@prisma/client';

import { UpdateUserOwnerDto } from '@src/modules/userOwner/dto/useOwner.dto';

export function userOwnerRepo(tx: Prisma.TransactionClient) {
  return {
    getUserOwnerInfo: async (userId: string, tenantId: string) => {
      return tx.user_owner.findUnique({
        where: {
          user_owner_id: userId,
          tenant_id: tenantId,
        },
      });
    },
    updateUserOwner: async (body: UpdateUserOwnerDto, tenantId: string) => {
      return tx.user_owner.update({
        where: {
          user_owner_id: body.user_owner_id,
          tenant_id: tenantId,
        },
        data: body,
      });
    },
  };
}
