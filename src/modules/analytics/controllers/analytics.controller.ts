import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { UserFromJWT } from '@src/types/userFromJWT';
import { CurrentUser } from '@src/common/decorators/extractUser.decorator';
import { JwtGuard } from '@src/guards/jwt.guard';
import {
  AnalyticsFiltersDto,
  LimitQueryDto,
  ThresholdQueryDto,
} from '../dto/analytics-filters.dto';
import type { AnalyticsFilters } from '@src/libs/db/repos/analytics.repo';

@Controller('analytics')
@UseGuards(JwtGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Convierte AnalyticsFiltersDto a AnalyticsFilters
   */
  private parseFilters(dto: AnalyticsFiltersDto): AnalyticsFilters {
    return this.analyticsService.buildCustomFilters({
      dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
      dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
      period: dto.period,
      status: dto.status,
      source_channel: dto.source_channel,
      payment_method: dto.payment_method,
      delivery_method: dto.delivery_method,
      category_id: dto.category_id,
      product_id: dto.product_id,
      minAmount: dto.minAmount,
      maxAmount: dto.maxAmount,
      customer_phone: dto.customer_phone,
    });
  }

  /**
   * GET /analytics/dashboard
   * Obtiene el resumen completo del dashboard de analytics
   */
  @Get('dashboard')
  async getDashboardAnalytics(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(`Dashboard requested by tenant: ${user.tenant_id}`);
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getDashboardAnalytics(user.tenant_id, filters);
  }

  /**
   * GET /analytics/summary
   * Obtiene solo las métricas principales (KPIs)
   */
  @Get('summary')
  async getSummaryMetrics(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(`Summary metrics requested by tenant: ${user.tenant_id}`);
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getSummaryMetrics(user.tenant_id, filters);
  }

  /**
   * GET /analytics/sales-by-period
   * Obtiene ventas agrupadas por período (día, semana, mes)
   */
  @Get('sales-by-period')
  async getSalesByPeriod(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(
      `Sales by period requested by tenant: ${user.tenant_id}, period: ${filtersDto.period || 'day'}`,
    );
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getSalesByPeriod(user.tenant_id, filters);
  }

  /**
   * GET /analytics/top-products
   * Obtiene los productos más vendidos
   */
  @Get('top-products')
  async getTopProducts(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
    @Query(new ValidationPipe({ transform: true })) limitDto: LimitQueryDto,
  ) {
    this.logger.log(
      `Top products requested by tenant: ${user.tenant_id}, limit: ${limitDto.limit}`,
    );
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getTopProducts(
      user.tenant_id,
      filters,
      limitDto.limit || 10,
    );
  }

  /**
   * GET /analytics/orders-by-channel
   * Obtiene distribución de pedidos por canal de origen
   */
  @Get('orders-by-channel')
  async getOrdersByChannel(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(`Orders by channel requested by tenant: ${user.tenant_id}`);
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getOrdersByChannel(user.tenant_id, filters);
  }

  /**
   * GET /analytics/orders-by-status
   * Obtiene distribución de pedidos por estado
   */
  @Get('orders-by-status')
  async getOrdersByStatus(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(`Orders by status requested by tenant: ${user.tenant_id}`);
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getOrdersByStatus(user.tenant_id, filters);
  }

  /**
   * GET /analytics/payment-analysis
   * Obtiene análisis de métodos de pago y sus tasas de éxito
   */
  @Get('payment-analysis')
  async getPaymentAnalysis(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(`Payment analysis requested by tenant: ${user.tenant_id}`);
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getPaymentAnalysis(user.tenant_id, filters);
  }

  /**
   * GET /analytics/delivery-analysis
   * Obtiene análisis de métodos de entrega (pickup vs delivery)
   */
  @Get('delivery-analysis')
  async getDeliveryAnalysis(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(`Delivery analysis requested by tenant: ${user.tenant_id}`);
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getDeliveryAnalysis(user.tenant_id, filters);
  }

  /**
   * GET /analytics/category-performance
   * Obtiene rendimiento de ventas por categoría de producto
   */
  @Get('category-performance')
  async getCategoryPerformance(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(
      `Category performance requested by tenant: ${user.tenant_id}`,
    );
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getCategoryPerformance(
      user.tenant_id,
      filters,
    );
  }

  /**
   * GET /analytics/customer-insights
   * Obtiene insights de clientes (nuevos vs recurrentes, top clientes)
   */
  @Get('customer-insights')
  async getCustomerInsights(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(`Customer insights requested by tenant: ${user.tenant_id}`);
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getCustomerInsights(user.tenant_id, filters);
  }

  /**
   * GET /analytics/top-variants
   * Obtiene las variantes de productos más vendidas
   */
  @Get('top-variants')
  async getTopVariants(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
    @Query(new ValidationPipe({ transform: true })) limitDto: LimitQueryDto,
  ) {
    this.logger.log(
      `Top variants requested by tenant: ${user.tenant_id}, limit: ${limitDto.limit}`,
    );
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getTopVariants(
      user.tenant_id,
      filters,
      limitDto.limit || 10,
    );
  }

  /**
   * GET /analytics/cart-abandonment
   * Obtiene tasa de abandono de carrito (pedidos en draft)
   */
  @Get('cart-abandonment')
  async getCartAbandonmentRate(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(
      `Cart abandonment rate requested by tenant: ${user.tenant_id}`,
    );
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getCartAbandonmentRate(
      user.tenant_id,
      filters,
    );
  }

  /**
   * GET /analytics/low-stock-products
   * Obtiene productos con stock bajo (alertas de inventario)
   */
  @Get('low-stock-products')
  async getLowStockProducts(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    thresholdDto: ThresholdQueryDto,
  ) {
    this.logger.log(
      `Low stock products requested by tenant: ${user.tenant_id}, threshold: ${thresholdDto.threshold}`,
    );
    return this.analyticsService.getLowStockProducts(
      user.tenant_id,
      thresholdDto.threshold || 10,
    );
  }

  /**
   * GET /analytics/products-without-sales
   * Obtiene productos sin ventas en el período especificado
   */
  @Get('products-without-sales')
  async getProductsWithoutSales(
    @CurrentUser() user: UserFromJWT,
    @Query(new ValidationPipe({ transform: true }))
    filtersDto: AnalyticsFiltersDto,
  ) {
    this.logger.log(
      `Products without sales requested by tenant: ${user.tenant_id}`,
    );
    const filters = this.parseFilters(filtersDto);
    return this.analyticsService.getProductsWithoutSales(
      user.tenant_id,
      filters,
    );
  }
}
