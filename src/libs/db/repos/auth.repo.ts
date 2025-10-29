// src/libs/db/repos/auth.repo.ts
import { Prisma } from '@prisma/client';

export function authRepo(tx: Prisma.TransactionClient) {
  return {
    async createOwnerWithTransaction(
      tenant_data: { name: string; slug: string },
      user_data: { name: string; email: string; phone: string },
      auth_data: {
        user_type: string;
        provider: string;
        provider_sub: string;
        password_hash?: string;
      },
    ) {
      // Ojo: esto ya se ejecuta dentro de una tx de DbService.runInTransaction
      const tenant = await tx.tenant.create({
        data: {
          name: tenant_data.name.trim(),
          slug: tenant_data.slug.trim().toLowerCase(),
          created_at: new Date(),
        },
      });

      const user_owner = await tx.user_owner.create({
        data: {
          tenant_id: tenant.tenant_id,
          name: user_data.name.trim(),
          email: user_data.email.toLowerCase().trim(),
          phone: user_data.phone.trim(),
          active: true,
        },
      });

      const auth_account = await tx.auth_account.create({
        data: {
          user_type: auth_data.user_type,
          user_ref: user_owner.user_owner_id,
          provider: auth_data.provider,
          provider_sub: auth_data.provider_sub,
          email: user_data.email.toLowerCase().trim(),
          password_hash: auth_data.password_hash || '',
        },
      });

      return { tenant, user_owner, auth_account };
    },

    async createBusinessWithTransaction(
      user_data: {
        tenant_id: string;
        name: string;
        email: string;
        status: string;
      },
      auth_data: {
        user_type: string;
        provider: string;
        provider_sub: string;
        password_hash?: string;
      },
    ) {
      const user_business = await tx.user_business.create({
        data: {
          tenant_id: user_data.tenant_id,
          name: user_data.name.trim(),
          email: user_data.email.toLowerCase().trim(),
          status: user_data.status,
        },
      });

      const auth_account = await tx.auth_account.create({
        data: {
          user_type: auth_data.user_type,
          user_ref: user_business.user_id,
          provider: auth_data.provider,
          provider_sub: auth_data.provider_sub,
          email: user_data.email.toLowerCase().trim(),
          password_hash: auth_data.password_hash || '',
        },
      });

      return { user_business, auth_account };
    },
  };
}
