import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

@Injectable()
export class DbService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * runInTransaction: siempre pasar context con tenantId opcional
   */
  async runInTransaction<T>(
    ctx: { tenantId?: string },
    fn: (tx: Tx) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      if (ctx?.tenantId) {
        // set_config para RLS; esto hace que current_setting('app.tenant_id') devuelva tenantId
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`;
      }
      return await fn(tx);
    });
  }
}
