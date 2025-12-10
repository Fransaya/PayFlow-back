-- Archivo: docker/postgres/rls-policies.sql
-- Políticas de Row Level Security basadas en el esquema existente

-- =============================================
-- HABILITAR ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS en todas las tablas que necesitan aislamiento por tenant
ALTER TABLE public.tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_owner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_business ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mp_config ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS PARA TENANTS
-- =============================================

-- Los usuarios solo pueden ver/acceder a su propio tenant
CREATE POLICY tenant_isolation ON public.tenant
    USING ((tenant_id = (current_setting('app.tenant_id'::text))::uuid));

-- =============================================
-- POLÍTICAS PARA AUTENTICACIÓN
-- =============================================

-- Política compleja para auth_account basada en el tipo de usuario
CREATE POLICY tenant_isolation_auth ON public.auth_account
    USING (
        CASE
            WHEN (user_type = 'owner'::text) THEN (
                EXISTS (
                    SELECT 1
                    FROM public.user_owner uo
                    WHERE ((uo.user_owner_id = auth_account.user_ref) 
                           AND (uo.tenant_id = (current_setting('app.tenant_id'::text))::uuid))
                )
            )
            WHEN (user_type = 'business'::text) THEN (
                EXISTS (
                    SELECT 1
                    FROM public.user_business ub
                    WHERE ((ub.user_id = auth_account.user_ref) 
                           AND (ub.tenant_id = (current_setting('app.tenant_id'::text))::uuid))
                )
            )
            ELSE false
        END
    );

-- =============================================
-- POLÍTICAS PARA USUARIOS
-- =============================================

-- Política para user_owner
CREATE POLICY tenant_isolation_user_owner ON public.user_owner
    FOR ALL
    USING ((tenant_id = (current_setting('app.tenant_id'::text))::uuid))
    WITH CHECK ((tenant_id = (current_setting('app.tenant_id'::text))::uuid));

-- Política para user_business
CREATE POLICY tenant_isolation_user_business ON public.user_business
    FOR ALL
    USING ((tenant_id = (current_setting('app.tenant_id'::text))::uuid))
    WITH CHECK ((tenant_id = (current_setting('app.tenant_id'::text))::uuid));

-- Política para user_roles (basada en el usuario de negocio)
CREATE POLICY tenant_isolation_user_roles ON public.user_role
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM public.user_business ub 
            WHERE ub.user_id = user_role.user_id 
            AND ub.tenant_id = (current_setting('app.tenant_id'::text))::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.user_business ub 
            WHERE ub.user_id = user_role.user_id 
            AND ub.tenant_id = (current_setting('app.tenant_id'::text))::uuid
        )
    );

-- =============================================
-- POLÍTICAS PARA NEGOCIO
-- =============================================

-- Política para business
CREATE POLICY tenant_isolation_business ON public.business
    FOR ALL
    USING ((tenant_id = (current_setting('app.tenant_id'::text))::uuid))
    WITH CHECK ((tenant_id = (current_setting('app.tenant_id'::text))::uuid));

-- =============================================
-- POLÍTICAS PARA PRODUCTOS Y CATEGORÍAS
-- =============================================

-- Política para categories
CREATE POLICY tenant_isolation_categories ON public.category
    FOR ALL
    USING ((tenant_id = (current_setting('app.tenant_id'::text))::uuid))
    WITH CHECK ((tenant_id = (current_setting('app.tenant_id'::text))::uuid));

-- Política para products
CREATE POLICY tenant_isolation_products ON public.product
    FOR ALL
    USING ((tenant_id = (current_setting('app.tenant_id'::text))::uuid))
    WITH CHECK ((tenant_id = (current_setting('app.tenant_id'::text))::uuid));

-- Política para product_variants (basada en el producto padre)
CREATE POLICY tenant_isolation_product_variants ON public.product_variant
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM public.product p 
            WHERE p.product_id = product_variant.product_id 
            AND p.tenant_id = (current_setting('app.tenant_id'::text))::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.product p 
            WHERE p.product_id = product_variant.product_id 
            AND p.tenant_id = (current_setting('app.tenant_id'::text))::uuid
        )
    );

-- =============================================
-- POLÍTICAS PARA ÓRDENES Y PAGOS
-- =============================================

-- Política para orders
CREATE POLICY tenant_isolation_orders ON public.order
    FOR ALL
    USING ((tenant_id = (current_setting('app.tenant_id'::text))::uuid))
    WITH CHECK ((tenant_id = (current_setting('app.tenant_id'::text))::uuid));

-- Política para order_items (basada en la orden padre)
CREATE POLICY tenant_isolation_order_items ON public.order_item
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM public.order o 
            WHERE o.order_id = order_item.order_id 
            AND o.tenant_id = (current_setting('app.tenant_id'::text))::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.order o 
            WHERE o.order_id = order_item.order_id 
            AND o.tenant_id = (current_setting('app.tenant_id'::text))::uuid
        )
    );

-- Política para payments
CREATE POLICY tenant_isolation_payments ON public.payment
    FOR ALL
    USING ((tenant_id = (current_setting('app.tenant_id'::text))::uuid))
    WITH CHECK ((tenant_id = (current_setting('app.tenant_id'::text))::uuid));

-- =============================================
-- POLÍTICAS PARA CONFIGURACIONES
-- =============================================

-- Política para mp_config
CREATE POLICY tenant_isolation_mp_config ON public.mp_config
    FOR ALL
    USING ((tenant_id = (current_setting('app.tenant_id'::text))::uuid))
    WITH CHECK ((tenant_id = (current_setting('app.tenant_id'::text))::uuid));

-- =============================================
-- POLÍTICA ESPECIAL PARA ROLES
-- =============================================

-- Los roles pueden ser globales o específicos por tenant
-- Esta política permite ver todos los roles para simplicidad en desarrollo
-- En producción podrías querer restringir esto más
CREATE POLICY roles_access ON public.role
    FOR ALL
    USING (true)  -- Permite acceso a todos los roles
    WITH CHECK (true);
    

-- =============================================
-- POLITICAS DE TIMEZONE DE HORARIOS DE NEGOCIO
-- =============================================
-- Política para business_timezones
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- Política de Seguridad (Solo ver/editar tus propios horarios)
CREATE POLICY tenant_isolation_policy ON business_hours
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- =============================================
-- FUNCIONES DE UTILIDAD PARA RLS
-- =============================================

-- Función para verificar si el usuario actual es owner del tenant
CREATE OR REPLACE FUNCTION is_tenant_owner() RETURNS boolean AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM public.user_owner uo 
        JOIN public.auth_account aa ON aa.user_ref = uo.user_owner_id
        WHERE aa.email = current_user 
        AND uo.tenant_id = (current_setting('app.tenant_id'::text))::uuid
        AND aa.user_type = 'owner'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Función para verificar si el usuario actual es business user del tenant
CREATE OR REPLACE FUNCTION is_tenant_business_user() RETURNS boolean AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM public.user_business ub 
        JOIN public.auth_account aa ON aa.user_ref = ub.user_id
        WHERE aa.email = current_user 
        AND ub.tenant_id = (current_setting('app.tenant_id'::text))::uuid
        AND aa.user_type = 'business'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Función para obtener información del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_info() 
RETURNS TABLE(
    user_type text,
    user_ref uuid,
    tenant_id uuid,
    user_name text,
    user_email text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.user_type,
        aa.user_ref,
        CASE 
            WHEN aa.user_type = 'owner' THEN uo.tenant_id::uuid
            WHEN aa.user_type = 'business' THEN ub.tenant_id::uuid
            ELSE NULL
        END as tenant_id,
        CASE 
            WHEN aa.user_type = 'owner' THEN uo.name
            WHEN aa.user_type = 'business' THEN ub.name
            ELSE NULL
        END as user_name,
        aa.email
    FROM public.auth_account aa
    LEFT JOIN public.user_owner uo ON aa.user_ref = uo.user_owner_id AND aa.user_type = 'owner'
    LEFT JOIN public.user_business ub ON aa.user_ref = ub.user_id AND aa.user_type = 'business'
    WHERE aa.email = current_user;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- ROLES Y PERMISOS
-- =============================================

-- Crear rol para aplicaciones
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user;
    END IF;
END
$$;

-- Otorgar permisos básicos al rol app_user
GRANT CONNECT ON DATABASE multistore TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Permisos en tablas para app_user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Permisos en secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Permisos por defecto para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
