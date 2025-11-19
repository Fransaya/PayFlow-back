// src/modules/auth/roles/permission.enum.ts

/**
 * Define todos los permisos posibles en la aplicación.
 * Sigue el patrón {RECURSO}:{ACCIÓN} para una granularidad clara.
 */
export enum AppPermission {
  // --- Permisos de Catálogo y Productos (catalog-service) [cite: 37] ---

  // Leer listados, detalles de productos y variantes
  CATALOG_READ = 'catalog:read',
  // Crear, editar o eliminar productos, variantes y categorías [cite: 37, 119]
  CATALOG_WRITE = 'catalog:write',

  // --- Permisos de Órdenes (order-service) [cite: 38] ---

  // Leer listados y detalles de todas las órdenes del tenant [cite: 7]
  ORDER_READ = 'order:read',
  // Crear nuevas órdenes desde el panel (opcional, p.ej. para ventas telefónicas)
  ORDER_CREATE = 'order:create',
  // Cambiar el estado de una orden (aceptado, en preparación, listo, cancelado, etc.) [cite: 68, 97, 123]
  ORDER_MANAGE_STATUS = 'order:manage_status',
  // Gestionar devoluciones/reembolsos (solo si el rol lo permite)
  ORDER_MANAGE_REFUNDS = 'order:manage_refunds',

  // --- Permisos de Usuarios y Roles (auth-service) [cite: 35, 101, 182] ---

  // Ver la lista y detalles de otros usuarios del mismo negocio (empleados)
  USER_BUSINESS_READ = 'user:read_business',
  // Crear, invitar, editar o desactivar usuarios de negocio (empleados)
  USER_BUSINESS_WRITE = 'user:write_business',
  // Crear, editar y eliminar roles personalizados para el tenant [cite: 7]
  ROLE_MANAGE = 'role:manage',
  // Asignar roles a usuarios de negocio (diferente de crear/editar el rol en sí)
  ROLE_ASSIGN = 'role:assign',

  // --- Permisos de Pagos y Suscripciones (payment-service & tenant-service) [cite: 36, 39] ---

  // Ver el historial de pagos de órdenes
  PAYMENT_READ = 'payment:read',
  // Ver y gestionar la vinculación con Mercado Pago (OAuth) [cite: 51]
  MP_CONFIG_MANAGE = 'mp:manage_config',
  // Ver detalles de la suscripción a la plataforma (plan, estado) [cite: 36, 74]
  SUBSCRIPTION_READ = 'subscription:read',
  // Iniciar el proceso de suscripción o cambiar el plan del negocio [cite: 70]
  SUBSCRIPTION_WRITE = 'subscription:write',

  // --- Permisos de Configuración General y Canales (tenant-service & messaging-service) [cite: 40] ---

  // Editar información básica del negocio (nombre, dirección, logo)
  SETTINGS_BUSINESS_WRITE = 'settings:write_business',
  // Editar la configuración de personalización del carrito (colores, temas, subdominio) [cite: 159]
  SETTINGS_CART_WRITE = 'settings:write_cart',
  // Ver y gestionar la configuración de canales de mensajería (WhatsApp, IG, Telegram) [cite: 40, 75]
  CHANNELS_MANAGE = 'channels:manage',
  // Ver el dashboard de métricas (KPIs, ventas, conversión) [cite: 11, 163]
  REPORTING_READ = 'reporting:read',
}
