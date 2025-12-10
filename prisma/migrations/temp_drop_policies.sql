-- Temporalmente eliminar políticas RLS para permitir ALTER COLUMN
DROP POLICY IF EXISTS tenant_isolation_policy ON business_hours;
DROP POLICY IF EXISTS tenant_isolation_policy ON order_item;
DROP POLICY IF EXISTS tenant_isolation_policy ON "order";
DROP POLICY IF EXISTS tenant_isolation_policy ON product;
DROP POLICY IF EXISTS tenant_isolation_policy ON product_variant;
DROP POLICY IF EXISTS tenant_isolation_policy ON category;
DROP POLICY IF EXISTS tenant_isolation_policy ON business;
DROP POLICY IF EXISTS tenant_isolation_policy ON user_business;
DROP POLICY IF EXISTS tenant_isolation_policy ON user_owner;
DROP POLICY IF EXISTS tenant_isolation_policy ON session_app;
DROP POLICY IF EXISTS tenant_isolation_policy ON mp_config;
DROP POLICY IF EXISTS tenant_isolation_policy ON payment;
DROP POLICY IF EXISTS tenant_isolation_policy ON delivery_config;
DROP POLICY IF EXISTS tenant_isolation_policy ON role;
DROP POLICY IF EXISTS tenant_isolation_policy ON social_integration;
