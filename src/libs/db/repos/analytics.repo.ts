import { Prisma } from '@prisma/client';

/* eslint-disable @typescript-eslint/no-unused-vars */
// ==================== TYPES & INTERFACES ====================

export interface AnalyticsFilters {
  // Filtros temporales
  dateFrom: Date;
  dateTo: Date;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';

  // Filtros de negocio
  status?: string[];
  source_channel?: string[];
  payment_method?: string[];
  delivery_method?: string[];

  // Filtros de producto
  category_id?: string[];
  product_id?: string[];

  // Filtros financieros
  minAmount?: number;
  maxAmount?: number;

  // Cliente específico
  customer_phone?: string;
}

export interface SalesByPeriod {
  date: string;
  revenue: number;
  orders: number;
  averageTicket: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  totalSold: number;
  revenue: number;
  category: string | null;
  image_url: string | null;
}

export interface OrdersByChannel {
  channel: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface PaymentMethodAnalysis {
  method: string;
  count: number;
  revenue: number;
  successRate: number;
}

export interface DeliveryAnalysis {
  pickup: { count: number; revenue: number };
  delivery: { count: number; revenue: number; avgShippingCost: number };
}

export interface CategoryPerformance {
  category_id: string;
  name: string;
  revenue: number;
  productsSold: number;
  orderCount: number;
}

export interface TopCustomer {
  phone: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  conversionRate: number;
  growthRate: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  salesByPeriod: SalesByPeriod[];
  topProducts: TopProduct[];
  ordersByChannel: OrdersByChannel[];
  ordersByStatus: OrdersByStatus[];
  paymentAnalysis: {
    byMethod: PaymentMethodAnalysis[];
    pending: number;
    failed: number;
  };
  deliveryAnalysis: DeliveryAnalysis;
  categoryPerformance: CategoryPerformance[];
  customerInsights: {
    newCustomers: number;
    returningCustomers: number;
    topCustomers: TopCustomer[];
  };
}

// ==================== REPOSITORY ====================

export function analyticsRepo(prisma: Prisma.TransactionClient) {
  return {
    /**
     * Obtiene el resumen completo de analytics para el dashboard
     */
    async getSummary(
      tenantId: string,
      filters: AnalyticsFilters,
    ): Promise<AnalyticsResponse> {
      const [
        summary,
        salesByPeriod,
        topProducts,
        ordersByChannel,
        ordersByStatus,
        paymentAnalysis,
        deliveryAnalysis,
        categoryPerformance,
        customerInsights,
      ] = await Promise.all([
        this.getSummaryMetrics(tenantId, filters),
        this.getSalesByPeriod(tenantId, filters),
        this.getTopProducts(tenantId, filters),
        this.getOrdersByChannel(tenantId, filters),
        this.getOrdersByStatus(tenantId, filters),
        this.getPaymentAnalysis(tenantId, filters),
        this.getDeliveryAnalysis(tenantId, filters),
        this.getCategoryPerformance(tenantId, filters),
        this.getCustomerInsights(tenantId, filters),
      ]);

      return {
        summary,
        salesByPeriod,
        topProducts,
        ordersByChannel,
        ordersByStatus,
        paymentAnalysis,
        deliveryAnalysis,
        categoryPerformance,
        customerInsights,
      };
    },

    /**
     * Métricas principales del negocio (KPIs)
     */
    async getSummaryMetrics(
      tenantId: string,
      filters: AnalyticsFilters,
    ): Promise<AnalyticsSummary> {
      // Totales del período actual usando query raw para evitar conflictos con RLS
      // Solo considera pedidos que generaron ingresos reales (excluye DRAFT, PENDING_PAYMENT, CANCELLED, REJECTED, REFUNDED, CHARGED_BACK)
      const validRevenueStatuses = [
        'PAID',
        'ACCEPTED',
        'IN_PREPARATION',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ];

      const currentPeriodResult = await prisma.$queryRaw<
        Array<{
          total_revenue: Prisma.Decimal;
          total_orders: bigint;
          avg_ticket: Prisma.Decimal;
        }>
      >`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COUNT(*)::bigint as total_orders,
          COALESCE(AVG(total_amount), 0) as avg_ticket
        FROM "order"
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND created_at >= ${filters.dateFrom}
          AND created_at <= ${filters.dateTo}
          AND status = ANY(${validRevenueStatuses})
          ${
            filters.status && filters.status.length > 0
              ? Prisma.sql`AND status = ANY(${filters.status})`
              : Prisma.empty
          }
          ${
            filters.source_channel && filters.source_channel.length > 0
              ? Prisma.sql`AND source_channel = ANY(${filters.source_channel})`
              : Prisma.empty
          }
          ${
            filters.payment_method && filters.payment_method.length > 0
              ? Prisma.sql`AND payment_method = ANY(${filters.payment_method})`
              : Prisma.empty
          }
          ${
            filters.delivery_method && filters.delivery_method.length > 0
              ? Prisma.sql`AND delivery_method = ANY(${filters.delivery_method})`
              : Prisma.empty
          }
          ${
            filters.minAmount !== undefined
              ? Prisma.sql`AND total_amount >= ${filters.minAmount}`
              : Prisma.empty
          }
          ${
            filters.maxAmount !== undefined
              ? Prisma.sql`AND total_amount <= ${filters.maxAmount}`
              : Prisma.empty
          }
          ${
            filters.customer_phone
              ? Prisma.sql`AND customer_phone = ${filters.customer_phone}`
              : Prisma.empty
          }
      `;

      // Contar pedidos por estado para calcular tasa de conversión
      const statusCountsResult = await prisma.$queryRaw<
        Array<{
          status: string;
          count: bigint;
        }>
      >`
        SELECT 
          status,
          COUNT(*)::bigint as count
        FROM "order"
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND created_at >= ${filters.dateFrom}
          AND created_at <= ${filters.dateTo}
          ${
            filters.status && filters.status.length > 0
              ? Prisma.sql`AND status = ANY(${filters.status})`
              : Prisma.empty
          }
        GROUP BY status
      `;

      const currentPeriod = currentPeriodResult[0];
      const totalOrders = Number(currentPeriod?.total_orders || 0);

      // Considerar estados exitosos para la tasa de conversión (pedidos que completaron el flujo)
      const successfulStatuses = [
        'PAID',
        'ACCEPTED',
        'IN_PREPARATION',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ];
      const completedOrders = statusCountsResult
        .filter((s) => successfulStatuses.includes(s.status))
        .reduce((sum, s) => sum + Number(s.count), 0);

      const conversionRate =
        totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      // Calcular período anterior para growth rate
      const periodDiff = filters.dateTo.getTime() - filters.dateFrom.getTime();
      const previousDateFrom = new Date(
        filters.dateFrom.getTime() - periodDiff,
      );
      const previousDateTo = new Date(filters.dateFrom.getTime() - 1);

      const previousPeriodResult = await prisma.$queryRaw<
        Array<{
          total_revenue: Prisma.Decimal;
        }>
      >`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue
        FROM "order"
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND created_at >= ${previousDateFrom}
          AND created_at <= ${previousDateTo}
          AND status = ANY(${validRevenueStatuses})
      `;

      const currentRevenue = Number(currentPeriod?.total_revenue || 0);
      const previousRevenue = Number(
        previousPeriodResult[0]?.total_revenue || 0,
      );
      const growthRate =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      return {
        totalRevenue: currentRevenue,
        totalOrders,
        averageTicket: Number(currentPeriod?.avg_ticket || 0),
        conversionRate,
        growthRate,
      };
    },

    /**
     * Ventas agrupadas por período (día, semana, mes)
     */
    /**
     * Ventas agrupadas por período (día, semana, mes)
     * FIX: Se usa Prisma.raw() para evitar error de parametrización en GROUP BY
     */
    async getSalesByPeriod(
      tenantId: string,
      filters: AnalyticsFilters,
    ): Promise<SalesByPeriod[]> {
      const period = filters.period || 'day';
      // Obtenemos el string del formato ('day', 'week', etc.)
      const formatString = getDateTruncFormat(period);

      // CRÍTICO: Usamos Prisma.raw para inyectar esto como texto literal, no como parámetro ($1).
      // Al venir de una función interna con valores controlados (switch case), es seguro contra SQL Injection.
      const timeInterval = Prisma.raw(`'${formatString}'`);

      // Solo contabilizar pedidos con ingresos reales
      const validRevenueStatuses = [
        'PAID',
        'ACCEPTED',
        'IN_PREPARATION',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ];

      const result = await prisma.$queryRaw<
        Array<{
          date: Date;
          revenue: Prisma.Decimal;
          orders: bigint;
        }>
      >`
        SELECT 
          DATE_TRUNC(${timeInterval}, created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*)::bigint as orders
        FROM "order"
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND created_at >= ${filters.dateFrom}
          AND created_at <= ${filters.dateTo}
          AND status = ANY(${validRevenueStatuses})
          ${
            filters.status && filters.status.length > 0
              ? Prisma.sql`AND status = ANY(${filters.status})`
              : Prisma.empty
          }
          ${
            filters.source_channel && filters.source_channel.length > 0
              ? Prisma.sql`AND source_channel = ANY(${filters.source_channel})`
              : Prisma.empty
          }
          ${
            filters.payment_method && filters.payment_method.length > 0
              ? Prisma.sql`AND payment_method = ANY(${filters.payment_method})`
              : Prisma.empty
          }
        GROUP BY DATE_TRUNC(${timeInterval}, created_at)
        ORDER BY date ASC
      `;

      return result.map((row) => ({
        // Convertimos la fecha a ISO String para el frontend
        date: row.date.toISOString(),
        // Prisma devuelve Decimal, convertimos a Number para JSON
        revenue: Number(row.revenue),
        // Prisma devuelve BigInt, convertimos a Number
        orders: Number(row.orders),
        averageTicket:
          Number(row.orders) > 0 ? Number(row.revenue) / Number(row.orders) : 0,
      }));
    },

    /**
     * Top productos más vendidos
     */
    async getTopProducts(
      tenantId: string,
      filters: AnalyticsFilters,
      limit: number = 10,
    ): Promise<TopProduct[]> {
      const result = await prisma.$queryRaw<
        Array<{
          product_id: string;
          product_name: string;
          category_name: string | null;
          image_url: string | null;
          total_sold: bigint;
          total_revenue: Prisma.Decimal;
        }>
      >`
        SELECT 
          oi.product_id::text,
          p.name as product_name,
          c.name as category_name,
          p.image_url,
          SUM(oi.quantity)::bigint as total_sold,
          SUM(oi.unit_price * oi.quantity) as total_revenue
        FROM order_item oi
        JOIN product p ON p.product_id = oi.product_id
        LEFT JOIN category c ON c.category_id = p.category_id
        WHERE oi.order_id IN (
          SELECT order_id 
          FROM "order" 
          WHERE 
            tenant_id = ${tenantId}::uuid
            AND created_at >= ${filters.dateFrom}
            AND created_at <= ${filters.dateTo}
            ${
              filters.status && filters.status.length > 0
                ? Prisma.sql`AND status = ANY(${filters.status})`
                : Prisma.empty
            }
            ${
              filters.source_channel && filters.source_channel.length > 0
                ? Prisma.sql`AND source_channel = ANY(${filters.source_channel})`
                : Prisma.empty
            }
            ${
              filters.payment_method && filters.payment_method.length > 0
                ? Prisma.sql`AND payment_method = ANY(${filters.payment_method})`
                : Prisma.empty
            }
        )
        GROUP BY oi.product_id, p.name, c.name, p.image_url
        ORDER BY total_sold DESC
        LIMIT ${limit}
      `;

      return result.map((row) => ({
        product_id: row.product_id,
        name: row.product_name,
        totalSold: Number(row.total_sold),
        revenue: Number(row.total_revenue),
        category: row.category_name,
        image_url: row.image_url,
      }));
    },

    /**
     * Distribución de pedidos por canal de origen
     */
    async getOrdersByChannel(
      tenantId: string,
      filters: AnalyticsFilters,
    ): Promise<OrdersByChannel[]> {
      // Solo contabilizar ingresos de pedidos válidos
      const validRevenueStatuses = [
        'PAID',
        'ACCEPTED',
        'IN_PREPARATION',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ];

      const result = await prisma.$queryRaw<
        Array<{
          channel: string | null;
          count: bigint;
          revenue: Prisma.Decimal;
        }>
      >`
        SELECT 
          source_channel as channel,
          COUNT(*)::bigint as count,
          COALESCE(SUM(CASE WHEN status = ANY(${validRevenueStatuses}) THEN total_amount ELSE 0 END), 0) as revenue
        FROM "order"
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND created_at >= ${filters.dateFrom}
          AND created_at <= ${filters.dateTo}
          ${
            filters.status && filters.status.length > 0
              ? Prisma.sql`AND status = ANY(${filters.status})`
              : Prisma.empty
          }
          ${
            filters.source_channel && filters.source_channel.length > 0
              ? Prisma.sql`AND source_channel = ANY(${filters.source_channel})`
              : Prisma.empty
          }
        GROUP BY source_channel
        ORDER BY count DESC
      `;

      const totalOrders = result.reduce(
        (sum, row) => sum + Number(row.count),
        0,
      );

      return result.map((row) => ({
        channel: row.channel || 'unknown',
        count: Number(row.count),
        revenue: Number(row.revenue),
        percentage:
          totalOrders > 0 ? (Number(row.count) / totalOrders) * 100 : 0,
      }));
    },

    /**
     * Distribución de pedidos por estado
     */
    async getOrdersByStatus(
      tenantId: string,
      filters: AnalyticsFilters,
    ): Promise<OrdersByStatus[]> {
      const result = await prisma.$queryRaw<
        Array<{
          status: string;
          count: bigint;
        }>
      >`
        SELECT 
          status,
          COUNT(*)::bigint as count
        FROM "order"
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND created_at >= ${filters.dateFrom}
          AND created_at <= ${filters.dateTo}
          ${
            filters.status && filters.status.length > 0
              ? Prisma.sql`AND status = ANY(${filters.status})`
              : Prisma.empty
          }
        GROUP BY status
        ORDER BY count DESC
      `;

      const totalOrders = result.reduce(
        (sum, row) => sum + Number(row.count),
        0,
      );

      return result.map((row) => ({
        status: row.status,
        count: Number(row.count),
        percentage:
          totalOrders > 0 ? (Number(row.count) / totalOrders) * 100 : 0,
      }));
    },

    /**
     * Análisis de métodos de pago
     */
    async getPaymentAnalysis(tenantId: string, filters: AnalyticsFilters) {
      // Análisis por método de pago - solo revenue de pedidos válidos
      const validRevenueStatuses = [
        'PAID',
        'ACCEPTED',
        'IN_PREPARATION',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ];

      const byMethod = await prisma.$queryRaw<
        Array<{
          payment_method: string | null;
          count: bigint;
          total_amount: Prisma.Decimal;
        }>
      >`
        SELECT 
          payment_method,
          COUNT(*)::bigint as count,
          COALESCE(SUM(CASE WHEN status = ANY(${validRevenueStatuses}) THEN total_amount ELSE 0 END), 0) as total_amount
        FROM "order"
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND created_at >= ${filters.dateFrom}
          AND created_at <= ${filters.dateTo}
          ${
            filters.status && filters.status.length > 0
              ? Prisma.sql`AND status = ANY(${filters.status})`
              : Prisma.empty
          }
          ${
            filters.source_channel && filters.source_channel.length > 0
              ? Prisma.sql`AND source_channel = ANY(${filters.source_channel})`
              : Prisma.empty
          }
          ${
            filters.payment_method && filters.payment_method.length > 0
              ? Prisma.sql`AND payment_method = ANY(${filters.payment_method})`
              : Prisma.empty
          }
        GROUP BY payment_method
      `;

      // Análisis de estados de pago
      const paymentStatuses = await prisma.$queryRaw<
        Array<{
          status: string;
          count: bigint;
        }>
      >`
        SELECT 
          status,
          COUNT(*)::bigint as count
        FROM payment
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND created_at >= ${filters.dateFrom}
          AND created_at <= ${filters.dateTo}
        GROUP BY status
      `;

      const totalPayments = paymentStatuses.reduce(
        (sum, row) => sum + Number(row.count),
        0,
      );
      const approvedCount = Number(
        paymentStatuses.find((p) => p.status === 'APPROVED')?.count || 0,
      );

      const methodAnalysis: PaymentMethodAnalysis[] = byMethod.map((row) => ({
        method: row.payment_method || 'unknown',
        count: Number(row.count),
        revenue: Number(row.total_amount),
        successRate:
          totalPayments > 0 ? (approvedCount / totalPayments) * 100 : 0,
      }));

      return {
        byMethod: methodAnalysis,
        pending: Number(
          paymentStatuses.find((p) => p.status === 'IN_PROGRESS')?.count || 0,
        ),
        failed:
          Number(
            paymentStatuses.find((p) => p.status === 'REJECTED')?.count || 0,
          ) +
          Number(
            paymentStatuses.find((p) => p.status === 'CANCELLED')?.count || 0,
          ) +
          Number(
            paymentStatuses.find((p) => p.status === 'EXPIRED')?.count || 0,
          ),
      };
    },

    /**
     * Análisis de métodos de entrega
     */
    async getDeliveryAnalysis(
      tenantId: string,
      filters: AnalyticsFilters,
    ): Promise<DeliveryAnalysis> {
      // Solo contabilizar ingresos y costos de envío de pedidos válidos
      const validRevenueStatuses = [
        'PAID',
        'ACCEPTED',
        'IN_PREPARATION',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ];

      const result = await prisma.$queryRaw<
        Array<{
          delivery_method: string | null;
          count: bigint;
          total_amount: Prisma.Decimal;
          shipping_cost: Prisma.Decimal;
        }>
      >`
        SELECT 
          delivery_method,
          COUNT(*)::bigint as count,
          COALESCE(SUM(CASE WHEN status = ANY(${validRevenueStatuses}) THEN total_amount ELSE 0 END), 0) as total_amount,
          COALESCE(SUM(CASE WHEN status = ANY(${validRevenueStatuses}) THEN shipping_cost ELSE 0 END), 0) as shipping_cost
        FROM "order"
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND created_at >= ${filters.dateFrom}
          AND created_at <= ${filters.dateTo}
          ${
            filters.status && filters.status.length > 0
              ? Prisma.sql`AND status = ANY(${filters.status})`
              : Prisma.empty
          }
        GROUP BY delivery_method
      `;

      const pickup = result.find((r) => r.delivery_method === 'pickup');
      const delivery = result.find((r) => r.delivery_method === 'delivery');

      return {
        pickup: {
          count: Number(pickup?.count || 0),
          revenue: Number(pickup?.total_amount || 0),
        },
        delivery: {
          count: Number(delivery?.count || 0),
          revenue: Number(delivery?.total_amount || 0),
          avgShippingCost: delivery
            ? Number(delivery.shipping_cost) / Number(delivery.count)
            : 0,
        },
      };
    },

    /**
     * Rendimiento por categoría de producto
     */
    async getCategoryPerformance(
      tenantId: string,
      filters: AnalyticsFilters,
    ): Promise<CategoryPerformance[]> {
      const whereClause = buildWhereClause(tenantId, filters);

      const result = await prisma.$queryRaw<
        Array<{
          category_id: string;
          category_name: string;
          revenue: Prisma.Decimal;
          products_sold: bigint;
          order_count: bigint;
        }>
      >`
        SELECT 
          c.category_id::text,
          c.name as category_name,
          COALESCE(SUM(oi.unit_price * oi.quantity), 0) as revenue,
          COALESCE(SUM(oi.quantity), 0)::bigint as products_sold,
          COUNT(DISTINCT oi.order_id)::bigint as order_count
        FROM category c
        LEFT JOIN product p ON p.category_id = c.category_id
        LEFT JOIN order_item oi ON oi.product_id = p.product_id
          AND oi.order_id IN (
            SELECT order_id 
            FROM "order" 
            WHERE 
              tenant_id = ${tenantId}::uuid
              AND created_at >= ${filters.dateFrom}
              AND created_at <= ${filters.dateTo}
              ${
                filters.status && filters.status.length > 0
                  ? Prisma.sql`AND status = ANY(${filters.status})`
                  : Prisma.empty
              }
          )
        WHERE c.tenant_id = ${tenantId}::uuid
        GROUP BY c.category_id, c.name
        HAVING COALESCE(SUM(oi.unit_price * oi.quantity), 0) > 0
        ORDER BY revenue DESC
      `;

      return result.map((row) => ({
        category_id: row.category_id,
        name: row.category_name,
        revenue: Number(row.revenue),
        productsSold: Number(row.products_sold),
        orderCount: Number(row.order_count),
      }));
    },

    /**
     * Insights de clientes
     */
    async getCustomerInsights(tenantId: string, filters: AnalyticsFilters) {
      // Top clientes por gasto total
      const topCustomersResult = await prisma.$queryRaw<
        Array<{
          customer_phone: string | null;
          customer_name: string | null;
          total_amount: Prisma.Decimal;
          order_count: bigint;
        }>
      >`
        SELECT 
          customer_phone,
          customer_name,
          SUM(total_amount) as total_amount,
          COUNT(*)::bigint as order_count
        FROM "order"
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND customer_phone IS NOT NULL
          AND created_at >= ${filters.dateFrom}
          AND created_at <= ${filters.dateTo}
          ${
            filters.status && filters.status.length > 0
              ? Prisma.sql`AND status = ANY(${filters.status})`
              : Prisma.empty
          }
        GROUP BY customer_phone, customer_name
        ORDER BY total_amount DESC
        LIMIT 10
      `;

      const topCustomers: TopCustomer[] = topCustomersResult.map((row) => ({
        phone: row.customer_phone || '',
        name: row.customer_name || 'Unknown',
        totalOrders: Number(row.order_count),
        totalSpent: Number(row.total_amount),
      }));

      // Clientes nuevos vs recurrentes
      const allCustomers = await prisma.$queryRaw<
        Array<{
          customer_phone: string;
          first_order: Date;
          order_count: bigint;
        }>
      >`
        SELECT 
          customer_phone,
          MIN(created_at) as first_order,
          COUNT(*)::bigint as order_count
        FROM "order"
        WHERE 
          tenant_id = ${tenantId}::uuid
          AND customer_phone IS NOT NULL
          AND created_at >= ${filters.dateFrom}
          AND created_at <= ${filters.dateTo}
        GROUP BY customer_phone
      `;

      const newCustomers = allCustomers.filter(
        (c) => c.first_order >= filters.dateFrom && Number(c.order_count) === 1,
      ).length;

      const returningCustomers = allCustomers.filter(
        (c) => Number(c.order_count) > 1,
      ).length;

      return {
        newCustomers,
        returningCustomers,
        topCustomers,
      };
    },

    /**
     * Análisis de variantes de productos más vendidas
     */
    async getTopVariants(
      tenantId: string,
      filters: AnalyticsFilters,
      limit: number = 10,
    ) {
      const whereClause = buildWhereClause(tenantId, filters);

      // Query que parsea el JSON de selected_variants
      const result = await prisma.$queryRaw<
        Array<{
          variant_name: string;
          product_id: string;
          product_name: string;
          times_ordered: bigint;
          total_revenue: Prisma.Decimal;
        }>
      >`
        SELECT 
          variant->>'name' as variant_name,
          p.product_id::text,
          p.name as product_name,
          COUNT(*)::bigint as times_ordered,
          SUM(oi.unit_price * oi.quantity) as total_revenue
        FROM order_item oi
        JOIN product p ON p.product_id = oi.product_id
        CROSS JOIN LATERAL jsonb_array_elements(oi.selected_variants) as variant
        WHERE oi.order_id IN (
          SELECT order_id 
          FROM "order" 
          WHERE 
            tenant_id = ${tenantId}::uuid
            AND created_at >= ${filters.dateFrom}
            AND created_at <= ${filters.dateTo}
            ${
              filters.status && filters.status.length > 0
                ? Prisma.sql`AND status = ANY(${filters.status})`
                : Prisma.empty
            }
        )
        GROUP BY variant->>'name', p.product_id, p.name
        ORDER BY times_ordered DESC
        LIMIT ${limit}
      `;

      return result.map((row) => ({
        variantName: row.variant_name,
        productId: row.product_id,
        productName: row.product_name,
        timesOrdered: Number(row.times_ordered),
        totalRevenue: Number(row.total_revenue),
      }));
    },

    /**
     * Análisis de abandono de carrito (pedidos en draft)
     */
    async getCartAbandonmentRate(tenantId: string, filters: AnalyticsFilters) {
      const totalOrders = await prisma.order.count({
        where: {
          tenant_id: tenantId,
          created_at: {
            gte: filters.dateFrom,
            lte: filters.dateTo,
          },
        },
      });

      const abandonedOrders = await prisma.order.count({
        where: {
          tenant_id: tenantId,
          status: 'DRAFT',
          created_at: {
            gte: filters.dateFrom,
            lte: filters.dateTo,
          },
        },
      });

      return {
        totalOrders,
        abandonedOrders,
        abandonmentRate:
          totalOrders > 0 ? (abandonedOrders / totalOrders) * 100 : 0,
      };
    },

    /**
     * Productos con bajo stock (alertas)
     */
    async getLowStockProducts(tenantId: string, threshold: number = 10) {
      return prisma.product.findMany({
        where: {
          tenant_id: tenantId,
          visible: true,
          stock: {
            lte: threshold,
            gt: 0,
          },
        },
        select: {
          product_id: true,
          name: true,
          stock: true,
          category: {
            select: { name: true },
          },
        },
        orderBy: {
          stock: 'asc',
        },
      });
    },

    /**
     * Productos sin ventas en el período
     */
    async getProductsWithoutSales(tenantId: string, filters: AnalyticsFilters) {
      const productsWithSales = await prisma.order_item.findMany({
        where: {
          order: {
            tenant_id: tenantId,
            created_at: {
              gte: filters.dateFrom,
              lte: filters.dateTo,
            },
          },
        },
        select: {
          product_id: true,
        },
        distinct: ['product_id'],
      });

      const soldProductIds = productsWithSales.map((p) => p.product_id);

      return prisma.product.findMany({
        where: {
          tenant_id: tenantId,
          visible: true,
          product_id: {
            notIn: soldProductIds,
          },
        },
        select: {
          product_id: true,
          name: true,
          price: true,
          stock: true,
          created_at: true,
          category: {
            select: { name: true },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    },
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Construye el WHERE clause común para filtrar orders
 */
function buildWhereClause(tenantId: string, filters: AnalyticsFilters) {
  const where: Prisma.orderWhereInput = {
    tenant_id: tenantId,
    created_at: {
      gte: filters.dateFrom,
      lte: filters.dateTo,
    },
  };

  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters.source_channel && filters.source_channel.length > 0) {
    where.source_channel = { in: filters.source_channel };
  }

  if (filters.payment_method && filters.payment_method.length > 0) {
    where.payment_method = { in: filters.payment_method };
  }

  if (filters.delivery_method && filters.delivery_method.length > 0) {
    where.delivery_method = { in: filters.delivery_method };
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.total_amount = {};
    if (filters.minAmount !== undefined) {
      where.total_amount.gte = filters.minAmount;
    }
    if (filters.maxAmount !== undefined) {
      where.total_amount.lte = filters.maxAmount;
    }
  }

  if (filters.customer_phone) {
    where.customer_phone = filters.customer_phone;
  }

  return where;
}

/**
 * Obtiene el formato de truncamiento de fecha según el período
 */
function getDateTruncFormat(
  period: 'day' | 'week' | 'month' | 'quarter' | 'year',
): string {
  switch (period) {
    case 'day':
      return 'day';
    case 'week':
      return 'week';
    case 'month':
      return 'month';
    case 'quarter':
      return 'quarter';
    case 'year':
      return 'year';
    default:
      return 'day';
  }
}
