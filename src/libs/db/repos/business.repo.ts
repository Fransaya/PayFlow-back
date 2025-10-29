import { Prisma } from '@prisma/client';

export function businessRepo(tx: Prisma.TransactionClient) {
  return {
    async getBusinessById(tenant_id: string, business_id: string) {
      return tx.business.findFirst({
        where: {
          tenant_id,
          business_id,
        },
      });
    },

    async createBusiness(data: {
      tenant_id: string;
      legal_name: string;
      cuit?: string | null;
      contact_name?: string | null;
      contact_phone?: string | null;
      address?: string | null;
    }) {
      return tx.business.create({
        data: {
          tenant_id: data.tenant_id,
          legal_name: data.legal_name.trim(),
          cuit: data.cuit?.trim() || null,
          contact_name: data.contact_name?.trim() || null,
          contact_phone: data.contact_name?.trim() || null,
          address: data.address?.trim() || null,
        },
      });
    },

    async updateBusiness(
      tenant_id: string,
      business_id: string,
      data: {
        legal_name?: string;
        cuit?: string | null;
        contact_name?: string | null;
        contact_phone?: string | null;
        address?: string | null;
      },
    ) {
      return tx.business.updateMany({
        where: {
          tenant_id,
          business_id,
        },
        data: {
          legal_name: data.legal_name?.trim(),
          cuit: data.cuit !== undefined ? data.cuit?.trim() || null : undefined,
          contact_name:
            data.contact_name !== undefined
              ? data.contact_name?.trim() || null
              : undefined,
          contact_phone:
            data.contact_phone !== undefined
              ? data.contact_phone?.trim() || null
              : undefined,
          address:
            data.address !== undefined
              ? data.address?.trim() || null
              : undefined,
        },
      });
    },
  };
}
