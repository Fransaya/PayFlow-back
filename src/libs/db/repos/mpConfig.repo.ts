import { InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MpConfigStore } from '@src/types/mp-config';

export function MpConfigRepo(tx: Prisma.TransactionClient) {
  return {
    async getMpConfigStoreByTenantId(
      tenant_id: string,
    ): Promise<MpConfigStore | null> {
      try {
        const mpConfigStore = await tx.mp_config.findFirst({
          where: { tenant_id: tenant_id },
        });

        if (!mpConfigStore) return null;

        return {
          mpUserId: mpConfigStore.mp_user_id || '',
          tenantId: mpConfigStore.tenant_id || '',
          accessTokenEnc: mpConfigStore.mp_access_token_enc || '',
          refreshTokenEnc: mpConfigStore.mp_refresh_token_enc || '',
          tokenExpiry: mpConfigStore.mp_token_expiry || new Date(),
          maxIntallments: mpConfigStore.max_installments || 1,
          excludedPaymentsTypes: mpConfigStore.excluded_payment_types || [],
        };
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    },

    /**
     * Guarda o actualiza la configuración de Mercado Pago para el tenant activo.
     * NOTA: Este método asume que el RLS está activo y que el tenant_id ha sido
     * inyectado en el contexto de la DB por tu Guard de multi-tenancy.
     */
    async saveConfig(data: MpConfigStore, tenant_id: string): Promise<void> {
      try {
        await tx.mp_config.upsert({
          where: { tenant_id: tenant_id }, // Usa el tenant_id del contexto
          update: {
            mp_user_id: String(data.mpUserId),
            mp_access_token_enc: data.accessTokenEnc,
            mp_refresh_token_enc: data.refreshTokenEnc,
            mp_token_expiry: data.tokenExpiry,
          },
          create: {
            tenant_id: tenant_id,
            mp_user_id: String(data.mpUserId),
            mp_access_token_enc: data.accessTokenEnc,
            mp_refresh_token_enc: data.refreshTokenEnc,
            mp_token_expiry: data.tokenExpiry,
          },
        });
      } catch (error) {
        console.error('DB Error in saveConfig:', error);
        // Manejo de errores específicos de DB o log de error
        throw new InternalServerErrorException(
          'Error al guardar la configuración de Mercado Pago.',
        );
      }
    },

    /**
     * Obtengo configuracion de mercado pago asociado a un tenant por user_id de mp
     */
    async getMpConfigStoreByMpUserId(
      mp_user_id: string,
    ): Promise<MpConfigStore | null> {
      try {
        const mpConfigStore = await tx.mp_config.findFirst({
          where: { mp_user_id: mp_user_id },
        });

        if (!mpConfigStore) return null;

        return {
          mpUserId: mpConfigStore.mp_user_id || '',
          tenantId: mpConfigStore.tenant_id || '',
          accessTokenEnc: mpConfigStore.mp_access_token_enc || '',
          refreshTokenEnc: mpConfigStore.mp_refresh_token_enc || '',
          tokenExpiry: mpConfigStore.mp_token_expiry || new Date(),
          maxIntallments: mpConfigStore.max_installments || 1,
          excludedPaymentsTypes: mpConfigStore.excluded_payment_types || [],
        };
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    },

    /**
     * Obtengo configuracion de mercado pago, de max_installments y excluded_payments_methods por tenant_id
     */
    async getPaymentConfigSettings(tenant_id: string) {
      try {
        return await tx.mp_config.findUnique({
          where: {
            tenant_id,
          },
          select: {
            max_installments: true,
            excluded_payment_types: true,
          },
        });
      } catch (error) {
        console.error('DB Error in getPaymentConfigSettings:', error);
        // Manejo de errores específicos de DB o log de error
        throw new InternalServerErrorException(
          'Error al obtener la configuración de Mercado Pago.',
        );
      }
    },

    /**
     * Actualizo configuracion de mercado pago asociado a un tenant por tenantId, de max_installments y excluded_payment_types
     */
    async updateMpConfigSettingsByTenantId(
      tenant_id: string,
      max_installments: number,
      excluded_payment_types: string[],
    ): Promise<any> {
      try {
        return await tx.mp_config.update({
          where: { tenant_id: tenant_id },
          data: {
            max_installments: max_installments,
            excluded_payment_types: excluded_payment_types,
          },
          select: {
            max_installments: true,
            excluded_payment_types: true,
          },
        });
      } catch (error) {
        console.error('DB Error in updateMpConfigSettingsByTenantId:', error);
        // Manejo de errores específicos de DB o log de error
        throw new InternalServerErrorException(
          'Error al actualizar la configuración de Mercado Pago.',
        );
      }
    },
  };
}
