# 📋 Documentación: Webhook de Mercado Pago - Refactorización

> **Fecha:** Diciembre 2025  
> **Archivo:** `src/webhooks/mercadoPago/public/services/webhook.mercadopago.service.ts`  
> **Branch:** `dev/fran`

---

## 📌 Índice

1. [Resumen Ejecutivo](#-resumen-ejecutivo)
2. [Problema Identificado](#-problema-identificado)
3. [Solución Implementada](#-solución-implementada)
4. [Formatos de Webhook](#-formatos-de-webhook-de-mercado-pago)
5. [Flujo de Procesamiento](#-flujo-de-procesamiento)
6. [Estructura del Servicio](#-estructura-del-servicio)
7. [Mapeo de Estados](#-mapeo-de-estados)
8. [Notificaciones WebSocket](#-notificaciones-websocket)
9. [Logs y Monitoreo](#-logs-y-monitoreo)
10. [Interfaces y Tipos](#-interfaces-y-tipos)
11. [Ejemplos de Uso](#-ejemplos-de-uso)
12. [Mejoras Futuras](#-mejoras-futuras)

---

## 🎯 Resumen Ejecutivo

Se refactorizó el servicio de webhook de Mercado Pago para:

- ✅ **Procesar únicamente** webhooks con formato V1 completo
- ✅ **Ignorar tempranamente** webhooks legacy y de tipo `merchant_order`
- ✅ **Mejorar la trazabilidad** con logging estructurado
- ✅ **Optimizar el rendimiento** con métricas de tiempo de procesamiento
- ✅ **Incrementar la mantenibilidad** con código modular y bien documentado

---

## 🔍 Problema Identificado

### Situación Anterior

Mercado Pago envía múltiples webhooks por cada transacción, con diferentes formatos:

```bash
# Logs del problema original
[Nest] 📥 Received: {"resource":"https://api.mercadolibre.com/merchant_orders/36127019344","topic":"merchant_order"}
[Nest] 📥 Received: {"action":"payment.created","api_version":"v1","data":{"id":"135859802741"},...}
[Nest] 📥 Received: {"resource":"135859802741","topic":"payment"}
[Nest] 📥 Received: {"resource":"https://api.mercadolibre.com/merchant_orders/36127019344","topic":"merchant_order"}
```

### Problemas Detectados

| Problema                               | Impacto                   |
| -------------------------------------- | ------------------------- |
| Procesamiento de webhooks innecesarios | Consumo de recursos       |
| Falta de validación exhaustiva         | Errores en runtime        |
| Logs verbosos sin estructura           | Difícil debugging         |
| Código monolítico                      | Baja mantenibilidad       |
| Sin métricas de rendimiento            | Sin visibilidad operativa |

---

## ✅ Solución Implementada

### Arquitectura de Validación

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK ENTRANTE                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              VALIDACIÓN EN CAPAS (validateWebhook)              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. ¿Es un objeto válido?                                │   │
│  │    └─ NO → return { isValid: false }                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 2. ¿Tiene 'topic' sin 'action'? (formato legacy)        │   │
│  │    └─ SÍ → return { isValid: false, reason: 'legacy' }  │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 3. ¿type === 'payment'?                                 │   │
│  │    └─ NO → return { isValid: false }                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 4. ¿Tiene 'action', 'data.id', 'user_id'?               │   │
│  │    └─ NO → return { isValid: false }                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 5. VÁLIDO ✓                                             │   │
│  │    └─ return { isValid: true, paymentId, userId }       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📥 Formatos de Webhook de Mercado Pago

### ✅ Formato V1 Completo (PROCESAMOS)

Este es el único formato que procesamos. Contiene toda la información necesaria.

```json
{
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "135859802741"
  },
  "date_created": "2025-12-04T20:38:37Z",
  "id": 126880102233,
  "live_mode": true,
  "type": "payment",
  "user_id": "2417790003"
}
```

**Campos clave:**
| Campo | Descripción | Uso |
|-------|-------------|-----|
| `type` | Tipo de notificación | Debe ser `"payment"` |
| `action` | Acción realizada | `payment.created`, `payment.updated` |
| `data.id` | ID del pago en MP | Para consultar detalles del pago |
| `user_id` | ID del collector (vendedor) | Para identificar el tenant |
| `api_version` | Versión de la API | Confirma formato V1 |

---

### ❌ Formato Legacy - Payment (IGNORAMOS)

Formato antiguo que solo contiene el ID del recurso.

```json
{
  "resource": "135859802741",
  "topic": "payment"
}
```

**Razón para ignorar:** No contiene `user_id` ni `action`, lo que dificulta el procesamiento seguro.

---

### ❌ Formato Legacy - Merchant Order (IGNORAMOS)

Notificación de orden comercial, no de pago.

```json
{
  "resource": "https://api.mercadolibre.com/merchant_orders/36127019344",
  "topic": "merchant_order"
}
```

**Razón para ignorar:** Las órdenes comerciales son un nivel de abstracción diferente. Nosotros procesamos pagos directamente.

---

## 🔄 Flujo de Procesamiento

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         handlePaymentNotification()                       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 1. Log Webhook  │      │ 2. Validar      │      │ 3. Get Tenant   │
│ logWebhookRec.. │─────▶│ validateWebhook │─────▶│ getTenantConfig │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                           │
         ┌─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 4. Get Payment  │      │ 5. Extract      │      │ 6. Process      │
│ getPaymentInfo  │─────▶│ extractOrderId  │─────▶│ processPayment  │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                           │
                                    ┌──────────────────────┤
                                    │                      │
                                    ▼                      ▼
                         ┌─────────────────┐    ┌─────────────────┐
                         │ Update Payment  │    │ Update Order    │
                         │ (PaymentService)│    │ (OrderService)  │
                         └─────────────────┘    └─────────────────┘
                                    │                      │
                                    └──────────┬───────────┘
                                               │
                                               ▼
                                    ┌─────────────────┐
                                    │ Send WebSocket  │
                                    │ Notification    │
                                    └─────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────┐
                                    │ Return Response │
                                    │ { status: ... } │
                                    └─────────────────┘
```

---

## 🏗️ Estructura del Servicio

### Métodos Públicos

```typescript
class WebhookMercadoPagoService {
  /**
   * Método principal que procesa webhooks de Mercado Pago
   * @param data - Payload del webhook (cualquier formato)
   * @returns WebhookResponse con status y mensaje
   */
  async handlePaymentNotification(data: any): Promise<WebhookResponse>;
}
```

### Métodos Privados

| Método                            | Responsabilidad                        | Retorno                      |
| --------------------------------- | -------------------------------------- | ---------------------------- |
| `validateWebhook()`               | Valida formato del webhook             | `WebhookValidationResult`    |
| `getTenantConfig()`               | Obtiene tenant por MP user_id          | `{ tenantId } \| null`       |
| `getPaymentInfo()`                | Consulta API de MP                     | Payment info o `null`        |
| `extractOrderId()`                | Extrae order_id del external_reference | `string \| null`             |
| `processPayment()`                | Orquesta actualización de estados      | `void`                       |
| `mapPaymentStatusToOrderStatus()` | Mapea estados MP → internos            | `string`                     |
| `buildNotificationPayload()`      | Construye payload WebSocket            | `PaymentNotificationPayload` |
| `extractCustomerName()`           | Extrae nombre del cliente              | `string`                     |
| `logWebhookReceived()`            | Log estructurado del webhook           | `void`                       |
| `getWebhookSummary()`             | Genera resumen para logs               | `string`                     |

---

## 📊 Mapeo de Estados

### Estado de Pago: Mercado Pago → Interno

```typescript
const PAYMENTS_STATUS_MERCADO_PAGO = {
  approved: 'APPROVED',
  pending: 'PENDING',
  in_process: 'IN_PROCESS',
  cancelled: 'CANCELLED',
  rejected: 'REJECTED',
  refunded: 'REFUNDED',
  charged_back: 'CHARGED_BACK',
};
```

### Estado de Orden: Mercado Pago → Interno

```typescript
const statusMap = {
  approved: ORDER_STATUS.PAID, // Pago aprobado
  pending: ORDER_STATUS.PENDING_PAYMENT, // Pendiente
  in_process: ORDER_STATUS.PENDING_PAYMENT, // En proceso
  cancelled: ORDER_STATUS.CANCELLED, // Cancelado
  rejected: ORDER_STATUS.REJECTED, // Rechazado
  refunded: ORDER_STATUS.REFUNDED, // Reembolsado
  charged_back: ORDER_STATUS.CHARGED_BACK, // Contracargo
};
```

### Diagrama de Estados

```
                    ┌─────────────┐
                    │   CREATED   │
                    │   (draft)   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
        ┌──────────│   PENDING   │──────────┐
        │          │  _PAYMENT   │          │
        │          └──────┬──────┘          │
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  REJECTED   │    │    PAID     │    │  CANCELLED  │
└─────────────┘    └──────┬──────┘    └─────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
     ┌───────────┐ ┌───────────┐ ┌─────────────┐
     │  REFUNDED │ │ DELIVERED │ │CHARGED_BACK │
     └───────────┘ └───────────┘ └─────────────┘
```

---

## 🔔 Notificaciones WebSocket

### Configuración del Gateway

```typescript
@WebSocketGateway({
  namespace: 'admin',
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
export class WebSocketGatewayAdmin { ... }
```

### Evento Emitido

**Evento:** `paymentStatusUpdated`  
**Sala:** `tenant-{tenantId}`

### Payload de Notificación

```typescript
interface PaymentNotificationPayload {
  tenantId: string; // UUID del tenant
  orderId: string; // UUID de la orden
  mappedOrderStatus: string; // Estado mapeado ('PAID', 'REJECTED', etc.)
  transactionAmount: number; // Monto de la transacción
  currencyId: string; // Moneda ('ARS', 'USD', etc.)
  mpPaymentId: number; // ID del pago en MP
  mpStatusDetail: string; // Detalle del estado ('accredited', etc.)
  customerEmail: string; // Email del cliente
  customerName: string; // Nombre del cliente
  paymentMethod: string; // Método de pago ('master', 'visa', etc.)
  dateApproved: string; // Fecha de aprobación (ISO 8601)
}
```

### Ejemplo de Payload

```json
{
  "tenantId": "4decac96-5bd6-41d0-9c39-a2131426661d",
  "orderId": "8d7e7621-3e66-4dba-b28d-f6476ccd2ca1",
  "mappedOrderStatus": "PAID",
  "transactionAmount": 36000,
  "currencyId": "ARS",
  "mpPaymentId": 135859802741,
  "mpStatusDetail": "accredited",
  "customerEmail": "cliente@email.com",
  "customerName": "Juan Pérez",
  "paymentMethod": "master",
  "dateApproved": "2025-12-04T16:38:38.000-04:00"
}
```

---

## 📝 Logs y Monitoreo

### Formato de Logs

```bash
# Webhook recibido (formato V1 - procesable)
[WebhookMercadoPagoService] 📥 Webhook received: type=payment, action=payment.created, payment_id=135859802741

# Webhook procesado exitosamente
[WebhookMercadoPagoService] ✅ Payment 135859802741 processed successfully for order 8d7e7621-... (156ms)

# Webhook ignorado (legacy)
[WebhookMercadoPagoService] 📥 Webhook received: topic=merchant_order (legacy format - ignored)
[WebhookMercadoPagoService] Webhook ignored: Legacy webhook format ignored (topic: merchant_order)

# Webhook ignorado (formato incompleto)
[WebhookMercadoPagoService] 📥 Webhook received: topic=payment (legacy format - ignored)
[WebhookMercadoPagoService] Webhook ignored: Legacy webhook format ignored (topic: payment)

# Error en procesamiento
[WebhookMercadoPagoService] ❌ Error processing webhook: Connection timeout
```

### Métricas Disponibles

| Métrica                 | Descripción                | Ejemplo            |
| ----------------------- | -------------------------- | ------------------ |
| Tiempo de procesamiento | Duración total del proceso | `(156ms)`          |
| Webhooks procesados     | Contador de procesados     | Logs con `✅`      |
| Webhooks ignorados      | Contador de ignorados      | Logs con `ignored` |
| Errores                 | Contador de errores        | Logs con `❌`      |

---

## 📐 Interfaces y Tipos

### WebhookValidationResult

```typescript
interface WebhookValidationResult {
  isValid: boolean; // Si el webhook es procesable
  reason?: string; // Razón si no es válido
  paymentId?: string; // ID del pago (si es válido)
  userId?: string; // ID del usuario MP (si es válido)
}
```

### WebhookResponse

```typescript
interface WebhookResponse {
  status: 'processed' | 'ignored' | 'error';
  message: string;
  paymentId?: string; // Solo si fue procesado
  orderId?: string; // Solo si fue procesado
}
```

---

## 💡 Ejemplos de Uso

### Respuesta Exitosa

```typescript
// Input: Webhook V1 válido
{
  "action": "payment.created",
  "type": "payment",
  "data": { "id": "135859802741" },
  "user_id": "2417790003"
}

// Output
{
  "status": "processed",
  "message": "Webhook processed successfully",
  "paymentId": "135859802741",
  "orderId": "8d7e7621-3e66-4dba-b28d-f6476ccd2ca1"
}
```

### Respuesta Ignorada (Legacy)

```typescript
// Input: Webhook legacy
{
  "resource": "135859802741",
  "topic": "payment"
}

// Output
{
  "status": "ignored",
  "message": "Legacy webhook format ignored (topic: payment)"
}
```

### Respuesta Ignorada (Merchant Order)

```typescript
// Input: Webhook merchant_order
{
  "resource": "https://api.mercadolibre.com/merchant_orders/36127019344",
  "topic": "merchant_order"
}

// Output
{
  "status": "ignored",
  "message": "Legacy webhook format ignored (topic: merchant_order)"
}
```

---

## 🔮 Mejoras Futuras

### Corto Plazo

- [ ] **Idempotencia:** Implementar verificación de webhooks duplicados usando `webhook.id`
- [ ] **Retry logic:** Cola de reintentos para webhooks fallidos
- [ ] **Rate limiting:** Protección contra flood de webhooks

### Mediano Plazo

- [ ] **Tipado estricto:** Reemplazar `any` por tipos específicos de MP
- [ ] **Validación de firma:** Verificar autenticidad del webhook con signature de MP
- [ ] **Métricas Prometheus:** Exportar métricas para monitoreo

### Largo Plazo

- [ ] **Event sourcing:** Almacenar todos los webhooks para auditoría
- [ ] **Multi-provider:** Abstraer para soportar otros proveedores de pago
- [ ] **Dead letter queue:** Manejo de webhooks que no pudieron procesarse

---

## 📚 Referencias

- [Mercado Pago - Webhooks Documentation](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
- [Mercado Pago - Payment API](https://www.mercadopago.com.ar/developers/es/reference/payments/_payments_id/get)
- [NestJS - WebSockets](https://docs.nestjs.com/websockets/gateways)

---

## 📄 Changelog

### v2.0.0 (Diciembre 2025)

- ✨ Refactorización completa del servicio
- 🔒 Validación exhaustiva de formato de webhook
- 📝 Logging estructurado con emojis
- ⚡ Métricas de tiempo de procesamiento
- 🏗️ Código modular con responsabilidades separadas
- 📖 Documentación completa

### v1.0.0 (Versión anterior)

- Procesamiento básico de webhooks
- Sin validación de formato
- Logs verbosos sin estructura
