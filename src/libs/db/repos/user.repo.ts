import { Prisma } from '@prisma/client';
import { GetUserByEmailResponse } from '@src/types/user';

export function userRepo(tx: Prisma.TransactionClient) {
  return {
    async getUserBusinessById(user_id: string, tenant_id: string) {
      return tx.user_business.findUnique({
        where: { user_id, tenant_id },
        select: {
          user_id: true,
          tenant_id: true,
          name: true,
          email: true,
          status: true,
          tenants: {
            select: { name: true, slug: true },
          },
          user_role: {
            include: {
              role: {
                select: { name: true },
              },
            },
          },
        },
      });
    },

    async userExistsByEmail(email: string): Promise<boolean> {
      if (!email?.trim()) throw new Error('Email is required');

      const normalizedEmail = email.toLowerCase().trim();

      // Buscar en auth_account ya que es donde se centraliza la autenticación
      const authAccount = await tx.auth_account.findFirst({
        where: { email: normalizedEmail },
        select: { account_id: true },
      });

      return !!authAccount;
    },

    async userExistsInTenant(
      email: string,
      tenantId: string,
      userId: string,
    ): Promise<boolean> {
      if (!email?.trim()) throw new Error('Email is required');
      if (!tenantId?.trim()) throw new Error('Tenant ID is required');

      const normalizedEmail = email.toLowerCase().trim();

      // Buscar en user_owner
      const userOwner = await tx.user_owner.findFirst({
        where: {
          email: normalizedEmail,
          tenant_id: tenantId.trim(),
        },
        select: { user_owner_id: true },
      });

      if (userOwner) return true;

      // Buscar en user_business (excluyendo el userId actual)
      const userBusiness = await tx.user_business.findFirst({
        where: {
          email: normalizedEmail,
          tenant_id: tenantId.trim(),
          ...(userId && { user_id: { not: userId.trim() } }), // Excluir el usuario actual
        },
        select: { user_id: true },
      });

      return !!userBusiness;
    },

    async getUserByEmail(email: string): Promise<GetUserByEmailResponse> {
      if (!email?.trim()) throw new Error('Email is required');

      const normalizedEmail = email.toLowerCase().trim();

      const authAccount = await tx.auth_account.findFirst({
        where: { email: normalizedEmail },
        select: {
          account_id: true,
          user_type: true,
          user_ref: true,
          provider: true,
          provider_sub: true,
          email: true,
          password_hash: true,
        },
      });

      if (!authAccount) return null;

      // Obtener datos específicos del usuario según su tipo
      if (authAccount.user_type === 'OWNER') {
        const userOwner = await tx.user_owner.findUnique({
          where: { user_owner_id: authAccount.user_ref },
          include: {
            tenants: {
              select: {
                tenant_id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        return {
          ...authAccount,
          user_type: 'OWNER' as const,
          user_details: userOwner,
        };
      }

      if (authAccount.user_type === 'BUSINESS') {
        const userBusiness = await tx.user_business.findUnique({
          where: { user_id: authAccount.user_ref },
          include: {
            user_role: {
              include: {
                role: true,
              },
            },
            tenants: {
              select: {
                tenant_id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        return {
          ...authAccount,
          user_type: 'BUSINESS' as const,
          user_details: userBusiness,
        };
      }

      return {
        ...authAccount,
        user_type: authAccount.user_type as 'OWNER' | 'BUSINESS',
      };
    },
  };
}
