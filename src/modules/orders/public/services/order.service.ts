/**
 * Order Example
 * {
  "customer": {
    "name": "Juan Pérez",
    "phone": "+54 11 1234-5678",
    "email": "juan.perez@email.com",
    "address": "Av. Corrientes 1234, CABA",
    "notes": "Tocar timbre 2B. Sin cebolla por favor."
  },
  "items": [
    {
      "product_id": "prod-uuid-001",
      "quantity": 2,
      "selected_variants": [
        {
          "variant_id": "var-uuid-001",
          "variant_name": "Extra Queso",
          "price_delta": 350
        },
        {
          "variant_id": "var-uuid-002",
          "variant_name": "Bacon",
          "price_delta": 500
        }
      ],
      "unit_price": 4850,
      "product_name": "Hamburguesa Clásica"
    },
    {
      "product_id": "prod-uuid-002",
      "quantity": 1,
      "selected_variants": [],
      "unit_price": 2500,
      "product_name": "Papas Fritas Grandes"
    },
    {
      "product_id": "prod-uuid-003",
      "quantity": 2,
      "selected_variants": [
        {
          "variant_id": "var-uuid-003",
          "variant_name": "Sin Azúcar",
          "price_delta": 0
        }
      ],
      "unit_price": 1200,
      "product_name": "Coca Cola 500ml"
    }
  ],
  "total": 14600,
  "currency": "ARS"
}
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  DbService,
  orderRepo,
  productRepo,
  productVariantRepo,
} from '@src/libs/db';

// DTO e interfaces

@Injectable()
export class OrderService {
  constructor(private readonly dbService: DbService) {}

  private readonly logger = new Logger(OrderService.name + '-Public');

  // Obtener estado de orden por ID
  async getOrderStatus(tenantId: string, orderId: string) {
    return this.dbService.runInTransaction({ tenantId }, async (tx) => {
      return orderRepo(tx).getOrderStatus(orderId);
    });
  }

  // Crear orden
  async createOrder(tenantId: string, data: any) {
    try {
      // PASO 1: obtengo productos actualizados de la DB para validar precios y existencia
      const productsIds = data.items.map((item) => item.product_id);
      const realProducts = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          return productRepo(tx).getProductsByIds(tenantId, productsIds);
        },
      );

      // PASO 2: Valido y reacalulo los items
      const validatedItems = data.items.map(async (item) => {
        const realProduct = realProducts.find(
          (p) => p.product_id === item.product_id,
        );
        if (!realProduct) {
          throw new Error(`Producto con ID ${item.product_id} no encontrado`);
        }

        if (!realProduct)
          throw new BadRequestException(
            `Producto ${item.product_id} no encontrado`,
          );
        if (!realProduct.visible)
          throw new BadRequestException(`Producto no disponible`);
        if (realProduct.stock && realProduct.stock < item.quantity)
          throw new BadRequestException(`Stock insuficiente`);

        // Calculo de precio real (producto + variantes )
        const realPrice = await this.calculateItemPrice(
          tenantId,
          item.product_id,
          item.variant_id,
        );

        return {
          ...item,
          unit_price: realPrice, // ← Precio REAL de la DB
          subtotal: realPrice * item.quantity,
        };
      });

      const resolvedItems = await Promise.all(validatedItems);

      // 3. Recalcular total
      const realTotal = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);

      // 4. Crear orden y detalles en la DB
      const orderRecord = await this.dbService.runInTransaction(
        { tenantId },
        async (tx) => {
          const newOrder = await orderRepo(tx).createOrder({
            tenant_id: tenantId,
            source_channel: data.source_channel || 'public',
            status: 'draft',
            total_amount: realTotal,
            currency: data.currency,
            cart_json: data.cart_json,
            mp_preference_id: data.mp_preference_id || null,
            mp_merchant_order_id: data.mp_merchant_order_id || null,
          });

          // Crear detalles de orden
          for (const item of resolvedItems) {
            await orderRepo(tx).createOrderItem({
              order_id: newOrder.order_id,
              product_id: item.product_id,
              variant_id: item.variant_id || null,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount: item.discount || null,
            });
          }

          return newOrder;
        },
      );

      // 5 - creo instancia de pago de mercado pago
      return orderRecord;
    } catch (error) {}
  }

  // Metodo para el calculo de precio real de un item ( producto + variantes )
  private async calculateItemPrice(
    tenant_id: string,
    product_id: string,
    variant_id: string,
  ) {
    try {
      const realProduct: any = await this.dbService.runInTransaction(
        { tenantId: tenant_id },
        async (tx) => {
          return productRepo(tx).getProductById(tenant_id, product_id);
        },
      );

      let realVariant: any | null = null;
      if (variant_id) {
        const variant = await this.dbService.runInTransaction(
          { tenantId: tenant_id },
          async (tx) => {
            return productVariantRepo(tx).getProductVariantByProductId(
              product_id,
            );
          },
        );

        realVariant = variant;
      }

      let finalPrice = Number(realProduct.price);
      if (realVariant) {
        finalPrice += Number(realVariant.price_delta);
      }

      return finalPrice;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error calculando precio del item',
      );
    }
  }
}
