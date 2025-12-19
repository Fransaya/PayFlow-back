-- CreateTable
CREATE TABLE "auth_account" (
    "account_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_type" TEXT NOT NULL,
    "user_ref" UUID NOT NULL,
    "provider" TEXT DEFAULT 'local',
    "provider_sub" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "auth_account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "business" (
    "business_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "time_zone" TEXT NOT NULL DEFAULT 'America/Argentina/Cordoba',
    "cuit" TEXT,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "logo_url" TEXT,

    CONSTRAINT "business_pkey" PRIMARY KEY ("business_id")
);

-- CreateTable
CREATE TABLE "mp_config" (
    "mp_config_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "mp_user_id" TEXT,
    "mp_access_token_enc" TEXT,
    "mp_refresh_token_enc" TEXT,
    "mp_token_expiry" TIMESTAMPTZ(6),
    "max_installments" INTEGER NOT NULL DEFAULT 1,
    "excluded_payment_types" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mp_config_pkey" PRIMARY KEY ("mp_config_id")
);

-- CreateTable
CREATE TABLE "user_business" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_business_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_owner" (
    "user_owner_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "user_owner_pkey" PRIMARY KEY ("user_owner_id")
);

-- CreateTable
CREATE TABLE "system_flags" (
    "key" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "message" VARCHAR(255),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_flags_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "category" (
    "category_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN DEFAULT true,
    "image_key" TEXT,

    CONSTRAINT "category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "order" (
    "order_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "source_channel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "delivery_method" TEXT,
    "delivery_address" JSONB,
    "payment_method" TEXT,
    "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "aditional_note" TEXT,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "cart_json" JSONB,
    "mp_preference_id" TEXT,
    "mp_merchant_order_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "order_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) DEFAULT 0,
    "selected_variants" JSONB,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "payment" (
    "payment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "mp_payment_id" TEXT,
    "status" TEXT,
    "method" TEXT,
    "amount" DECIMAL(12,2),
    "currency" TEXT,
    "raw_json" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "product" (
    "product_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT DEFAULT 'ARS',
    "stock" INTEGER DEFAULT 0,
    "image_url" TEXT,
    "visible" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "product_variant" (
    "variant_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_delta" DECIMAL(12,2) DEFAULT 0,
    "sku" TEXT,
    "stock" INTEGER DEFAULT 0,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("variant_id")
);

-- CreateTable
CREATE TABLE "role" (
    "role_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "session_app" (
    "session_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_owner_id" UUID,
    "user_id" UUID,
    "tenant_id" UUID NOT NULL,
    "provider" VARCHAR(50),
    "refresh_token_enc" TEXT NOT NULL,
    "refresh_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,

    CONSTRAINT "session_app_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "tenant" (
    "tenant_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "custom_domain" TEXT,
    "currency" TEXT DEFAULT 'ARS',
    "plan_status" TEXT DEFAULT 'trial',
    "allow_cash_on_delivery" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "status_tenant" BOOLEAN DEFAULT true,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "delivery_config" (
    "delivery_config_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "base_rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "settings_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "delivery_config_pkey" PRIMARY KEY ("delivery_config_id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "social_integration" (
    "social_integration_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "access_token_enc" TEXT NOT NULL,
    "refresh_token_enc" TEXT,
    "external_id" TEXT,
    "status" TEXT NOT NULL,
    "raw_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "social_integration_pkey" PRIMARY KEY ("social_integration_id")
);

-- CreateTable
CREATE TABLE "business_hours" (
    "hour_id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "open_time" TIME NOT NULL,
    "close_time" TIME NOT NULL,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("hour_id")
);

-- CreateIndex
CREATE INDEX "idx_auth_account_email" ON "auth_account"("email");

-- CreateIndex
CREATE INDEX "idx_auth_account_user_ref" ON "auth_account"("user_ref", "user_type");

-- CreateIndex
CREATE UNIQUE INDEX "mp_config_tenant_id_key" ON "mp_config"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_business_email_key" ON "user_business"("email");

-- CreateIndex
CREATE INDEX "idx_user_business_email" ON "user_business"("email");

-- CreateIndex
CREATE INDEX "idx_user_business_tenant" ON "user_business"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_owner_email_key" ON "user_owner"("email");

-- CreateIndex
CREATE INDEX "idx_user_owner_email" ON "user_owner"("email");

-- CreateIndex
CREATE INDEX "idx_user_owner_tenant" ON "user_owner"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_orders_tenant_lookup" ON "order"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_orders_status" ON "order"("status");

-- CreateIndex
CREATE INDEX "idx_orders_tenant_created_at_query" ON "order"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_orders_tenant_status_query" ON "order"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "idx_payments_order" ON "payment"("order_id");

-- CreateIndex
CREATE INDEX "idx_payments_tenant_order_query" ON "payment"("tenant_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_payments_mp_payment_id" ON "payment"("mp_payment_id");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "product"("category_id");

-- CreateIndex
CREATE INDEX "idx_products_tenant" ON "product"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_products_visible" ON "product"("visible");

-- CreateIndex
CREATE INDEX "role_tenant_id_idx" ON "role"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_tenant_id_name_key" ON "role"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "idx_session_last_used" ON "session_app"("last_used_at");

-- CreateIndex
CREATE INDEX "idx_session_refresh_expires" ON "session_app"("refresh_expires_at");

-- CreateIndex
CREATE INDEX "idx_session_tenant" ON "session_app"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_session_user" ON "session_app"("user_id");

-- CreateIndex
CREATE INDEX "idx_session_user_owner" ON "session_app"("user_owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_slug_key" ON "tenant"("slug");

-- CreateIndex
CREATE INDEX "idx_tenants_slug" ON "tenant"("slug");

-- CreateIndex
CREATE INDEX "delivery_config_tenant_id_idx" ON "delivery_config"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_config_tenant_id_type_key" ON "delivery_config"("tenant_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "social_integration_tenant_id_channel_key" ON "social_integration"("tenant_id", "channel");

-- AddForeignKey
ALTER TABLE "business" ADD CONSTRAINT "business_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mp_config" ADD CONSTRAINT "mp_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_business" ADD CONSTRAINT "user_business_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_owner" ADD CONSTRAINT "user_owner_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("category_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "session_app" ADD CONSTRAINT "fk_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "session_app" ADD CONSTRAINT "fk_user_business" FOREIGN KEY ("user_id") REFERENCES "user_business"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "session_app" ADD CONSTRAINT "fk_user_owner" FOREIGN KEY ("user_owner_id") REFERENCES "user_owner"("user_owner_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delivery_config" ADD CONSTRAINT "delivery_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_business"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "social_integration" ADD CONSTRAINT "social_integration_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
