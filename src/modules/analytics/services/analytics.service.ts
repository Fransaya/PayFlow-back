import { Injectable, Logger } from '@nestjs/common';
import { DbService, analyticsRepo } from '@src/libs/db';
import type {
  AnalyticsFilters,
  AnalyticsResponse,
} from '@src/libs/db/repos/analytics.repo';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly dbService: DbService) {}

  /**
   * Obtiene el dashboard completo de analytics para un tenant
   */
  async getDashboardAnalytics(
    tenantId: string,
    filters: AnalyticsFilters,
  ): Promise<AnalyticsResponse> {
    this.logger.log(`Getting dashboard analytics for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getSummary(tenantId, filters);
    });
  }

  /**
   * Obtiene solo las métricas principales (KPIs) del negocio
   */
  async getSummaryMetrics(tenantId: string, filters: AnalyticsFilters) {
    this.logger.log(`Getting summary metrics for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getSummaryMetrics(tenantId, filters);
    });
  }

  /**
   * Obtiene ventas agrupadas por período
   */
  async getSalesByPeriod(tenantId: string, filters: AnalyticsFilters) {
    this.logger.log(
      `Getting sales by period for tenant: ${tenantId}, period: ${filters.period || 'day'}`,
    );

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getSalesByPeriod(tenantId, filters);
    });
  }

  /**
   * Obtiene los productos más vendidos
   */
  async getTopProducts(
    tenantId: string,
    filters: AnalyticsFilters,
    limit: number = 10,
  ) {
    this.logger.log(`Getting top ${limit} products for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getTopProducts(tenantId, filters, limit);
    });
  }

  /**
   * Obtiene distribución de pedidos por canal
   */
  async getOrdersByChannel(tenantId: string, filters: AnalyticsFilters) {
    this.logger.log(`Getting orders by channel for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getOrdersByChannel(tenantId, filters);
    });
  }

  /**
   * Obtiene distribución de pedidos por estado
   */
  async getOrdersByStatus(tenantId: string, filters: AnalyticsFilters) {
    this.logger.log(`Getting orders by status for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getOrdersByStatus(tenantId, filters);
    });
  }

  /**
   * Obtiene análisis de métodos de pago
   */
  async getPaymentAnalysis(tenantId: string, filters: AnalyticsFilters) {
    this.logger.log(`Getting payment analysis for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getPaymentAnalysis(tenantId, filters);
    });
  }

  /**
   * Obtiene análisis de métodos de entrega
   */
  async getDeliveryAnalysis(tenantId: string, filters: AnalyticsFilters) {
    this.logger.log(`Getting delivery analysis for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getDeliveryAnalysis(tenantId, filters);
    });
  }

  /**
   * Obtiene rendimiento por categoría
   */
  async getCategoryPerformance(tenantId: string, filters: AnalyticsFilters) {
    this.logger.log(`Getting category performance for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getCategoryPerformance(tenantId, filters);
    });
  }

  /**
   * Obtiene insights de clientes
   */
  async getCustomerInsights(tenantId: string, filters: AnalyticsFilters) {
    this.logger.log(`Getting customer insights for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getCustomerInsights(tenantId, filters);
    });
  }

  /**
   * Obtiene variantes de productos más vendidas
   */
  async getTopVariants(
    tenantId: string,
    filters: AnalyticsFilters,
    limit: number = 10,
  ) {
    this.logger.log(`Getting top ${limit} variants for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getTopVariants(tenantId, filters, limit);
    });
  }

  /**
   * Obtiene tasa de abandono de carrito
   */
  async getCartAbandonmentRate(tenantId: string, filters: AnalyticsFilters) {
    this.logger.log(`Getting cart abandonment rate for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getCartAbandonmentRate(tenantId, filters);
    });
  }

  /**
   * Obtiene productos con bajo stock
   */
  async getLowStockProducts(tenantId: string, threshold: number = 10) {
    this.logger.log(
      `Getting low stock products for tenant: ${tenantId}, threshold: ${threshold}`,
    );

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getLowStockProducts(tenantId, threshold);
    });
  }

  /**
   * Obtiene productos sin ventas en el período
   */
  async getProductsWithoutSales(tenantId: string, filters: AnalyticsFilters) {
    this.logger.log(`Getting products without sales for tenant: ${tenantId}`);

    return await this.dbService.runInTransaction({ tenantId }, async (tx) => {
      const repo = analyticsRepo(tx);
      return await repo.getProductsWithoutSales(tenantId, filters);
    });
  }

  /**
   * Genera filtros por defecto para un período (últimos 30 días)
   */
  getDefaultFilters(
    period: 'day' | 'week' | 'month' = 'day',
  ): AnalyticsFilters {
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30); // Últimos 30 días por defecto

    return {
      dateFrom,
      dateTo,
      period,
    };
  }

  /**
   * Genera filtros personalizados a partir de parámetros
   */
  buildCustomFilters(params: {
    dateFrom?: Date;
    dateTo?: Date;
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    status?: string[];
    source_channel?: string[];
    payment_method?: string[];
    delivery_method?: string[];
    category_id?: string[];
    product_id?: string[];
    minAmount?: number;
    maxAmount?: number;
    customer_phone?: string;
  }): AnalyticsFilters {
    const dateTo = params.dateTo || new Date();
    const dateFrom =
      params.dateFrom ||
      (() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date;
      })();

    return {
      dateFrom,
      dateTo,
      period: params.period,
      status: params.status,
      source_channel: params.source_channel,
      payment_method: params.payment_method,
      delivery_method: params.delivery_method,
      category_id: params.category_id,
      product_id: params.product_id,
      minAmount: params.minAmount,
      maxAmount: params.maxAmount,
      customer_phone: params.customer_phone,
    };
  }
}
