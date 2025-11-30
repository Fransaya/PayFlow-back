# 📚 API Pública - Endpoints para Carrito Público

> **Base URL:** `http://localhost:3000/api/v1`
>
> **Nota:** Estos endpoints son públicos y no requieren autenticación.

---

## 📑 Índice

1. [Business (Negocio)](#1-business-negocio)
2. [Products (Productos)](#2-products-productos)
3. [Categories (Categorías)](#3-categories-categorías)
4. [Product Variants (Variantes de Producto)](#4-product-variants-variantes-de-producto)

---

## 1. Business (Negocio)

### Obtener información del negocio por slug

Obtiene la información pública del tenant/negocio usando su slug único.

```
GET /business/public/:slug
```

**Parámetros de URL:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|--------|-----------|--------------------------------|
| slug | string | ✅ | Slug único del tenant/negocio |

**Ejemplo de Request:**

```
GET http://localhost:3000/api/v1/business/public/mi-tienda
```

**Ejemplo de Response (200 OK):**

```json
{
  "tenant": {
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Mi Tienda",
    "slug": "mi-tienda",
    "primary_color": "#3498db",
    "secondary_color": "#2ecc71",
    "custom_domain": null,
    "currency": "ARS",
    "plan_status": "trial",
    "created_at": "2025-01-15T10:30:00.000Z",
    "business": [
      {
        "business_id": "660e8400-e29b-41d4-a716-446655440001",
        "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
        "legal_name": "Mi Tienda S.A.",
        "cuit": "30-12345678-9",
        "contact_name": "Juan Pérez",
        "contact_phone": "+54 11 1234-5678",
        "address": "Av. Corrientes 1234, CABA",
        "logo_url": "https://s3.amazonaws.com/bucket/presigned-url-logo.png?signature=..."
      }
    ]
  }
}
```

**Posibles Errores:**
| Código | Mensaje |
|--------|-----------------------------------|
| 500 | Error getting public business info |

---

## 2. Products (Productos)

### Obtener productos del negocio

Obtiene la lista de productos visibles de un tenant con paginación, búsqueda y filtros.

```
GET /product/public/:tenantId
```

**Parámetros de URL:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|--------|-----------|------------------|
| tenantId | string | ✅ | UUID del tenant |

**Query Parameters:**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-------------|--------|-----------|---------|--------------------------------------------------|
| page | number | ❌ | 1 | Número de página |
| limit | number | ❌ | 10 | Cantidad de productos por página |
| search | string | ❌ | - | Búsqueda por nombre de producto |
| category_id | string | ❌ | - | UUID de categoría para filtrar |
| sort_by | string | ❌ | - | Campo por el cual ordenar (ej: `price`, `name`) |
| order | string | ❌ | - | Dirección del orden: `ASC` o `DESC` |

**Ejemplo de Request:**

```
GET http://localhost:3000/api/v1/product/public/550e8400-e29b-41d4-a716-446655440000?page=1&limit=10&search=hamburguesa&category_id=770e8400-e29b-41d4-a716-446655440002&sort_by=price&order=ASC
```

**Ejemplo de Response (200 OK):**

```json
{
  "data": [
    {
      "product_id": "880e8400-e29b-41d4-a716-446655440003",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
      "category_id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Hamburguesa Clásica",
      "description": "Hamburguesa de carne vacuna 150g con lechuga, tomate y cebolla",
      "price": "1500.00",
      "currency": "ARS",
      "stock": 50,
      "image_url": "https://s3.amazonaws.com/bucket/presigned-url-product.png?signature=...",
      "visible": true,
      "created_at": "2025-01-20T15:45:00.000Z",
      "category": {
        "category_id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Hamburguesas"
      }
    },
    {
      "product_id": "880e8400-e29b-41d4-a716-446655440004",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
      "category_id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Hamburguesa Doble",
      "description": "Doble medallón de carne vacuna 300g total",
      "price": "2200.00",
      "currency": "ARS",
      "stock": 30,
      "image_url": "https://s3.amazonaws.com/bucket/presigned-url-product2.png?signature=...",
      "visible": true,
      "created_at": "2025-01-20T16:00:00.000Z",
      "category": {
        "category_id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Hamburguesas"
      }
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

**Posibles Errores:**
| Código | Mensaje |
|--------|-----------------------------------|
| 500 | Tenant ID is required |
| 500 | Error getting products for public |

---

## 3. Categories (Categorías)

### Obtener todas las categorías del negocio

Obtiene la lista de categorías activas de un tenant.

```
GET /categories/public/:tenantId/all
```

**Parámetros de URL:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|--------|-----------|------------------|
| tenantId | string | ✅ | UUID del tenant |

**Query Parameters:**
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|--------|-----------|---------|-----------------------------------|
| page | number | ❌ | 1 | Número de página |
| limit | number | ❌ | 10 | Cantidad de categorías por página |
| search | string | ❌ | - | Búsqueda por nombre de categoría |
| order | string | ❌ | - | Dirección del orden: `ASC`/`DESC` |

**Ejemplo de Request:**

```
GET http://localhost:3000/api/v1/categories/public/550e8400-e29b-41d4-a716-446655440000/all?page=1&limit=20&order=ASC
```

**Ejemplo de Response (200 OK):**

```json
[
  {
    "category_id": "770e8400-e29b-41d4-a716-446655440001",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Bebidas",
    "description": "Bebidas frías y calientes",
    "active": true,
    "image_key": "categories/bebidas.png",
    "image_url": "https://s3.amazonaws.com/bucket/presigned-url-category.png?signature=..."
  },
  {
    "category_id": "770e8400-e29b-41d4-a716-446655440002",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Hamburguesas",
    "description": "Hamburguesas artesanales",
    "active": true,
    "image_key": "categories/hamburguesas.png",
    "image_url": "https://s3.amazonaws.com/bucket/presigned-url-category2.png?signature=..."
  },
  {
    "category_id": "770e8400-e29b-41d4-a716-446655440003",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Postres",
    "description": "Dulces y postres caseros",
    "active": true,
    "image_key": null,
    "image_url": null
  }
]
```

**Posibles Errores:**
| Código | Mensaje |
|--------|------------------------------------|
| 500 | Tenant ID is required |
| 500 | Error getting categories by tenant |

---

## 4. Product Variants (Variantes de Producto)

### Obtener variantes de un producto

Obtiene todas las variantes activas de un producto específico.

```
GET /product-variant/public/:tenantId/:productId
```

**Parámetros de URL:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|--------|-----------|--------------------|
| tenantId | string | ✅ | UUID del tenant |
| productId | string | ✅ | UUID del producto |

**Ejemplo de Request:**

```
GET http://localhost:3000/api/v1/product-variant/public/550e8400-e29b-41d4-a716-446655440000/880e8400-e29b-41d4-a716-446655440003
```

**Ejemplo de Response (200 OK):**

```json
[
  {
    "variant_id": "990e8400-e29b-41d4-a716-446655440001",
    "product_id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "Con cheddar",
    "price_delta": "200.00",
    "sku": "HAMB-CLAS-CHED",
    "stock": 20,
    "active": true
  },
  {
    "variant_id": "990e8400-e29b-41d4-a716-446655440002",
    "product_id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "Con bacon",
    "price_delta": "350.00",
    "sku": "HAMB-CLAS-BAC",
    "stock": 15,
    "active": true
  },
  {
    "variant_id": "990e8400-e29b-41d4-a716-446655440003",
    "product_id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "Combo con papas",
    "price_delta": "500.00",
    "sku": "HAMB-CLAS-COMBO",
    "stock": 25,
    "active": true
  }
]
```

**Nota sobre `price_delta`:** Este valor se suma al precio base del producto para obtener el precio final de la variante.

**Cálculo del precio final:**

```
Precio final = product.price + variant.price_delta
```

**Ejemplo:**

- Producto: Hamburguesa Clásica = $1500.00
- Variante: Con cheddar (price_delta = $200.00)
- **Precio final: $1700.00**

**Posibles Errores:**
| Código | Mensaje |
|--------|--------------------------------|
| 500 | Failed to get product variants |

---

## 📋 Resumen de Endpoints

| Método | Endpoint                                       | Descripción                    |
| ------ | ---------------------------------------------- | ------------------------------ |
| GET    | `/business/public/:slug`                       | Info del negocio por slug      |
| GET    | `/product/public/:tenantId`                    | Lista de productos con filtros |
| GET    | `/categories/public/:tenantId/all`             | Lista de categorías            |
| GET    | `/product-variant/public/:tenantId/:productId` | Variantes de un producto       |

---

## 🔄 Flujo recomendado para el carrito

1. **Obtener info del negocio:** `GET /business/public/:slug`
   - Obtener `tenant_id` de la respuesta

2. **Cargar categorías:** `GET /categories/public/:tenantId/all`
   - Mostrar menú de categorías

3. **Cargar productos:** `GET /product/public/:tenantId?category_id=...`
   - Filtrar por categoría seleccionada

4. **Cargar variantes:** `GET /product-variant/public/:tenantId/:productId`
   - Al seleccionar un producto, cargar sus variantes

---

## 📝 Notas adicionales

- **Imágenes:** Los campos `image_url` y `logo_url` devuelven URLs pre-firmadas de S3 con tiempo de expiración limitado. Se recomienda no cachear estas URLs por mucho tiempo.

- **Paginación:** Los endpoints que soportan paginación devuelven un objeto `meta` con información de total de registros y páginas.

- **Moneda:** El campo `currency` indica la moneda de los precios (por defecto "ARS" - Peso Argentino).
