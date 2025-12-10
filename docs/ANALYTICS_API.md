# API de Analytics - Guía de Referencia

Esta guía documenta todos los endpoints del módulo de analytics, incluyendo los parámetros de entrada y las estructuras de respuesta.

---

## 📋 Tabla de Contenidos

2. [Filtros Comunes](#filtros-comunes)
3. [Endpoints](#endpoints)
   - [Dashboard Completo](#1-dashboard-completo)
   - [Métricas Principales (KPIs)](#2-métricas-principales-kpis)
   - [Ventas por Período](#3-ventas-por-período)
   - [Top Productos](#4-top-productos)
   - [Pedidos por Canal](#5-pedidos-por-canal)
   - [Pedidos por Estado](#6-pedidos-por-estado)
   - [Análisis de Pagos](#7-análisis-de-pagos)
   - [Análisis de Entregas](#8-análisis-de-entregas)
   - [Rendimiento por Categoría](#9-rendimiento-por-categoría)
   - [Insights de Clientes](#10-insights-de-clientes)
   - [Top Variantes](#11-top-variantes)
   - [Abandono de Carrito](#12-abandono-de-carrito)
   - [Productos con Bajo Stock](#13-productos-con-bajo-stock)
   - [Productos sin Ventas](#14-productos-sin-ventas)

---

## 🔍 Filtros Comunes

La mayoría de los endpoints aceptan los siguientes query parameters para filtrar datos:

### Query Parameters

| Parámetro         | Tipo              | Requerido | Descripción                                                    | Ejemplo                        |
| ----------------- | ----------------- | --------- | -------------------------------------------------------------- | ------------------------------ |
| `dateFrom`        | string (ISO 8601) | No        | Fecha de inicio del período                                    | `2024-01-01T00:00:00.000Z`     |
| `dateTo`          | string (ISO 8601) | No        | Fecha de fin del período                                       | `2024-12-31T23:59:59.999Z`     |
| `period`          | enum              | No        | Agrupación temporal: `day`, `week`, `month`, `quarter`, `year` | `month`                        |
| `status`          | string[]          | No        | Filtrar por estados de pedido                                  | `completed,processing`         |
| `source_channel`  | string[]          | No        | Filtrar por canal de origen                                    | `whatsapp,instagram,web`       |
| `payment_method`  | string[]          | No        | Filtrar por método de pago                                     | `mercadopago,cash_on_delivery` |
| `delivery_method` | string[]          | No        | Filtrar por método de entrega                                  | `pickup,delivery`              |
| `category_id`     | string[]          | No        | Filtrar por categorías de producto                             | `uuid1,uuid2`                  |
| `product_id`      | string[]          | No        | Filtrar por productos específicos                              | `uuid1,uuid2`                  |
| `minAmount`       | number            | No        | Monto mínimo de pedido                                         | `1000`                         |
| `maxAmount`       | number            | No        | Monto máximo de pedido                                         | `50000`                        |
| `customer_phone`  | string            | No        | Filtrar por teléfono de cliente                                | `+5491123456789`               |

**Nota:** Si no se especifican `dateFrom` y `dateTo`, por defecto se utilizan los últimos 30 días.

---

## 📊 Endpoints

### 1. Dashboard Completo

Obtiene todas las métricas en una sola respuesta para el dashboard principal.

**Endpoint:** `GET /analytics/dashboard`

**Query Parameters:** [Filtros Comunes](#filtros-comunes)

**Ejemplo de Request:**

```http
GET /analytics/dashboard?dateFrom=2024-11-01&dateTo=2024-12-09&period=day&status=completed
```

**Respuesta:**

```json
{
  "summary": {
    "totalRevenue": 150000.5,
    "totalOrders": 125,
    "averageTicket": 1200.0,
    "conversionRate": 85.5,
    "growthRate": 12.3
  },
  "salesByPeriod": [
    {
      "date": "2024-12-01T00:00:00.000Z",
      "revenue": 5000.0,
      "orders": 10,
      "averageTicket": 500.0
    }
  ],
  "topProducts": [
    {
      "product_id": "uuid-123",
      "name": "Producto A",
      "totalSold": 45,
      "revenue": 22500.0,
      "category": "Categoría 1",
      "image_url": "https://..."
    }
  ],
  "ordersByChannel": [
    {
      "channel": "whatsapp",
      "count": 75,
      "revenue": 90000.0,
      "percentage": 60.0
    }
  ],
  "ordersByStatus": [
    {
      "status": "completed",
      "count": 100,
      "percentage": 80.0
    }
  ],
  "paymentAnalysis": {
    "byMethod": [
      {
        "method": "mercadopago",
        "count": 80,
        "revenue": 120000.0,
        "successRate": 95.5
      }
    ],
    "pending": 5,
    "failed": 2
  },
  "deliveryAnalysis": {
    "pickup": {
      "count": 50,
      "revenue": 60000.0
    },
    "delivery": {
      "count": 75,
      "revenue": 90000.0,
      "avgShippingCost": 500.0
    }
  },
  "categoryPerformance": [
    {
      "category_id": "uuid-cat-1",
      "name": "Categoría A",
      "revenue": 50000.0,
      "productsSold": 200,
      "orderCount": 45
    }
  ],
  "customerInsights": {
    "newCustomers": 35,
    "returningCustomers": 40,
    "topCustomers": [
      {
        "phone": "+5491123456789",
        "name": "Juan Pérez",
        "totalOrders": 12,
        "totalSpent": 15000.0
      }
    ]
  }
}
```

---

### 2. Métricas Principales (KPIs)

Obtiene solo las métricas clave del negocio.

**Endpoint:** `GET /analytics/summary`

**Query Parameters:** [Filtros Comunes](#filtros-comunes)

**Ejemplo de Request:**

```http
GET /analytics/summary?dateFrom=2024-12-01&dateTo=2024-12-09
```

**Respuesta:**

```json
{
  "totalRevenue": 150000.5,
  "totalOrders": 125,
  "averageTicket": 1200.0,
  "conversionRate": 85.5,
  "growthRate": 12.3
}
```

**Descripción de Campos:**

- `totalRevenue`: Ingresos totales en el período
- `totalOrders`: Cantidad total de pedidos
- `averageTicket`: Promedio de valor por pedido
- `conversionRate`: Porcentaje de pedidos completados vs totales
- `growthRate`: Crecimiento porcentual vs período anterior

---

### 3. Ventas por Período

Obtiene ventas agrupadas por día, semana, mes, etc.

**Endpoint:** `GET /analytics/sales-by-period`

**Query Parameters:** [Filtros Comunes](#filtros-comunes) (especialmente `period`)

**Ejemplo de Request:**

```http
GET /analytics/sales-by-period?period=week&dateFrom=2024-11-01&dateTo=2024-12-09
```

**Respuesta:**

```json
[
  {
    "date": "2024-11-04T00:00:00.000Z",
    "revenue": 25000.0,
    "orders": 50,
    "averageTicket": 500.0
  },
  {
    "date": "2024-11-11T00:00:00.000Z",
    "revenue": 30000.0,
    "orders": 60,
    "averageTicket": 500.0
  }
]
```

---

### 4. Top Productos

Obtiene los productos más vendidos.

**Endpoint:** `GET /analytics/top-products`

**Query Parameters:**

- [Filtros Comunes](#filtros-comunes)
- `limit` (number, opcional): Cantidad de productos a retornar (default: 10)

**Ejemplo de Request:**

```http
GET /analytics/top-products?limit=5&dateFrom=2024-11-01
Authorization: Bearer <token>
```

**Respuesta:**

```json
[
  {
    "product_id": "uuid-123",
    "name": "Producto A",
    "totalSold": 150,
    "revenue": 75000.0,
    "category": "Categoría 1",
    "image_url": "https://example.com/img.jpg"
  },
  {
    "product_id": "uuid-456",
    "name": "Producto B",
    "totalSold": 120,
    "revenue": 60000.0,
    "category": "Categoría 2",
    "image_url": null
  }
]
```

---

### 5. Pedidos por Canal

Distribución de pedidos según el canal de origen.

**Endpoint:** `GET /analytics/orders-by-channel`

**Query Parameters:** [Filtros Comunes](#filtros-comunes)

**Ejemplo de Request:**

```http
GET /analytics/orders-by-channel?dateFrom=2024-12-01
Authorization: Bearer <token>
```

**Respuesta:**

```json
[
  {
    "channel": "whatsapp",
    "count": 75,
    "revenue": 90000.0,
    "percentage": 60.0
  },
  {
    "channel": "instagram",
    "count": 30,
    "revenue": 36000.0,
    "percentage": 24.0
  },
  {
    "channel": "web",
    "count": 20,
    "revenue": 24000.0,
    "percentage": 16.0
  }
]
```

---

### 6. Pedidos por Estado

Distribución de pedidos según su estado.

**Endpoint:** `GET /analytics/orders-by-status`

**Query Parameters:** [Filtros Comunes](#filtros-comunes)

**Ejemplo de Request:**

```http
GET /analytics/orders-by-status
Authorization: Bearer <token>
```

**Respuesta:**

```json
[
  {
    "status": "completed",
    "count": 100,
    "percentage": 80.0
  },
  {
    "status": "processing",
    "count": 15,
    "percentage": 12.0
  },
  {
    "status": "draft",
    "count": 10,
    "percentage": 8.0
  }
]
```

---

### 7. Análisis de Pagos

Análisis de métodos de pago y sus tasas de éxito.

**Endpoint:** `GET /analytics/payment-analysis`

**Query Parameters:** [Filtros Comunes](#filtros-comunes)

**Ejemplo de Request:**

```http
GET /analytics/payment-analysis?dateFrom=2024-12-01
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "byMethod": [
    {
      "method": "mercadopago",
      "count": 80,
      "revenue": 120000.0,
      "successRate": 95.5
    },
    {
      "method": "cash_on_delivery",
      "count": 45,
      "revenue": 30000.0,
      "successRate": 100.0
    }
  ],
  "pending": 5,
  "failed": 2
}
```

---

### 8. Análisis de Entregas

Análisis de métodos de entrega (retiro vs envío).

**Endpoint:** `GET /analytics/delivery-analysis`

**Query Parameters:** [Filtros Comunes](#filtros-comunes)

**Ejemplo de Request:**

```http
GET /analytics/delivery-analysis
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "pickup": {
    "count": 50,
    "revenue": 60000.0
  },
  "delivery": {
    "count": 75,
    "revenue": 90000.0,
    "avgShippingCost": 500.0
  }
}
```

---

### 9. Rendimiento por Categoría

Ventas agrupadas por categoría de productos.

**Endpoint:** `GET /analytics/category-performance`

**Query Parameters:** [Filtros Comunes](#filtros-comunes)

**Ejemplo de Request:**

```http
GET /analytics/category-performance?dateFrom=2024-11-01
Authorization: Bearer <token>
```

**Respuesta:**

```json
[
  {
    "category_id": "uuid-cat-1",
    "name": "Electrónica",
    "revenue": 50000.0,
    "productsSold": 200,
    "orderCount": 45
  },
  {
    "category_id": "uuid-cat-2",
    "name": "Indumentaria",
    "revenue": 35000.0,
    "productsSold": 150,
    "orderCount": 38
  }
]
```

---

### 10. Insights de Clientes

Información sobre clientes nuevos, recurrentes y top clientes.

**Endpoint:** `GET /analytics/customer-insights`

**Query Parameters:** [Filtros Comunes](#filtros-comunes)

**Ejemplo de Request:**

```http
GET /analytics/customer-insights?dateFrom=2024-11-01
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "newCustomers": 35,
  "returningCustomers": 40,
  "topCustomers": [
    {
      "phone": "+5491123456789",
      "name": "Juan Pérez",
      "totalOrders": 12,
      "totalSpent": 15000.0
    },
    {
      "phone": "+5491187654321",
      "name": "María García",
      "totalOrders": 10,
      "totalSpent": 12000.0
    }
  ]
}
```

---

### 11. Top Variantes

Variantes de productos más vendidas (ej: talla, color).

**Endpoint:** `GET /analytics/top-variants`

**Query Parameters:**

- [Filtros Comunes](#filtros-comunes)
- `limit` (number, opcional): Cantidad de variantes (default: 10)

**Ejemplo de Request:**

```http
GET /analytics/top-variants?limit=5
Authorization: Bearer <token>
```

**Respuesta:**

```json
[
  {
    "variantName": "Talla M",
    "productId": "uuid-123",
    "productName": "Remera Básica",
    "timesOrdered": 45,
    "totalRevenue": 22500.0
  },
  {
    "variantName": "Color Rojo",
    "productId": "uuid-456",
    "productName": "Zapatillas",
    "timesOrdered": 38,
    "totalRevenue": 19000.0
  }
]
```

---

### 12. Abandono de Carrito

Tasa de abandono de carritos (pedidos en estado draft).

**Endpoint:** `GET /analytics/cart-abandonment`

**Query Parameters:** [Filtros Comunes](#filtros-comunes)

**Ejemplo de Request:**

```http
GET /analytics/cart-abandonment?dateFrom=2024-12-01
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "totalOrders": 125,
  "abandonedOrders": 15,
  "abandonmentRate": 12.0
}
```

---

### 13. Productos con Bajo Stock

Alertas de productos con stock bajo.

**Endpoint:** `GET /analytics/low-stock-products`

**Query Parameters:**

- `threshold` (number, opcional): Umbral de stock bajo (default: 10)

**Ejemplo de Request:**

```http
GET /analytics/low-stock-products?threshold=5
Authorization: Bearer <token>
```

**Respuesta:**

```json
[
  {
    "product_id": "uuid-123",
    "name": "Producto A",
    "stock": 3,
    "category": {
      "name": "Categoría 1"
    }
  },
  {
    "product_id": "uuid-456",
    "name": "Producto B",
    "stock": 5,
    "category": {
      "name": "Categoría 2"
    }
  }
]
```

---

### 14. Productos sin Ventas

Productos visibles que no tuvieron ventas en el período.

**Endpoint:** `GET /analytics/products-without-sales`

**Query Parameters:** [Filtros Comunes](#filtros-comunes)

**Ejemplo de Request:**

```http
GET /analytics/products-without-sales?dateFrom=2024-11-01
Authorization: Bearer <token>
```

**Respuesta:**

```json
[
  {
    "product_id": "uuid-789",
    "name": "Producto Sin Ventas",
    "price": "500.00",
    "stock": 10,
    "created_at": "2024-10-15T10:00:00.000Z",
    "category": {
      "name": "Categoría 3"
    }
  }
]
```

---

## 🎯 Casos de Uso Comunes

### Dashboard Principal

```http
GET /analytics/dashboard?period=day&dateFrom=2024-12-01&dateTo=2024-12-09
```

### Reporte Mensual

```http
GET /analytics/summary?period=month&dateFrom=2024-01-01&dateTo=2024-12-31
```

### Análisis de Canal WhatsApp

```http
GET /analytics/orders-by-channel?source_channel=whatsapp&dateFrom=2024-12-01
```

### Top 20 Productos del Mes

```http
GET /analytics/top-products?limit=20&period=month&dateFrom=2024-12-01
```

### Clientes VIP (más de $10,000 en compras)

```http
GET /analytics/customer-insights?minAmount=10000&dateFrom=2024-01-01
```

---

## 📝 Notas Importantes

1. **Fechas:** Todas las fechas deben estar en formato ISO 8601 (UTC)
2. **Arrays:** Los parámetros de tipo array se pasan como valores separados por coma
3. **Paginación:** Los endpoints de top (productos, variantes) aceptan el parámetro `limit`
4. **Performance:** El endpoint `/dashboard` es más pesado, úsalo con moderación
5. **Cache:** Considera implementar cache en el frontend para datos que no cambian frecuentemente
6. **Filtros por defecto:** Sin filtros de fecha, se usan los últimos 30 días

---

## 🚀 Ejemplos de Integración Frontend

### React/Next.js

```typescript
// services/analytics.ts
const API_BASE = 'http://localhost:3000/analytics';

interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  status?: string[];
  // ... otros filtros
}

export const analyticsService = {
  async getDashboard(filters: AnalyticsFilters, token: string) {
    const params = new URLSearchParams(filters as any);
    const response = await fetch(`${API_BASE}/dashboard?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async getTopProducts(
    limit: number = 10,
    filters: AnalyticsFilters,
    token: string,
  ) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...filters,
    } as any);
    const response = await fetch(`${API_BASE}/top-products?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};
```

### Vue.js

```typescript
// composables/useAnalytics.ts
import { ref } from 'vue';

export function useAnalytics() {
  const loading = ref(false);
  const data = ref(null);

  async function fetchDashboard(filters: any, token: string) {
    loading.value = true;
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/analytics/dashboard?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      data.value = await response.json();
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, fetchDashboard };
}
```

---

## ❓ FAQ

**P: ¿Cómo filtro por múltiples estados?**
R: Pasa los valores separados por coma: `status=completed,processing`

**P: ¿Qué pasa si no paso fechas?**
R: Se usan los últimos 30 días por defecto

**P: ¿Puedo combinar filtros?**
R: Sí, todos los filtros son acumulativos (AND)

**P: ¿Los endpoints están paginados?**
R: Solo los de "top" aceptan `limit`. Los demás devuelven todos los resultados

**P: ¿Cómo obtengo datos en tiempo real?**
R: Implementa polling o considera usar WebSockets para actualizaciones en tiempo real
