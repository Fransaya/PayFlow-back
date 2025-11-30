-- CreateTable
CREATE TABLE "public"."auth_account" (
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
CREATE TABLE "public"."business" (
    "business_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "cuit" TEXT,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "logo_url" TEXT,

    CONSTRAINT "business_pkey" PRIMARY KEY ("business_id")
);

-- CreateTable
CREATE TABLE "public"."mp_config" (
    "mp_config_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "mp_user_id" TEXT,
    "mp_access_token_enc" TEXT,
    "mp_refresh_token_enc" TEXT,
    "mp_token_expiry" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mp_config_pkey" PRIMARY KEY ("mp_config_id")
);

-- CreateTable
CREATE TABLE "public"."user_business" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_business_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."user_owner" (
    "user_owner_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN DEFAULT true,

    CONSTRAINT "user_owner_pkey" PRIMARY KEY ("user_owner_id")
);

-- CreateTable
CREATE TABLE "public"."category" (
    "category_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN DEFAULT true,
    "image_key" TEXT,

    CONSTRAINT "category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "public"."order" (
    "order_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "source_channel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "cart_json" JSONB,
    "mp_preference_id" TEXT,
    "mp_merchant_order_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "public"."order_item" (
    "order_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) DEFAULT 0,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "public"."payment" (
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
CREATE TABLE "public"."product" (
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
CREATE TABLE "public"."product_variant" (
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
CREATE TABLE "public"."role" (
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
CREATE TABLE "public"."session_app" (
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
CREATE TABLE "public"."tenant" (
    "tenant_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "custom_domain" TEXT,
    "currency" TEXT DEFAULT 'ARS',
    "plan_status" TEXT DEFAULT 'trial',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "public"."user_role" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateIndex
CREATE INDEX "idx_auth_account_email" ON "public"."auth_account"("email");

-- CreateIndex
CREATE INDEX "idx_auth_account_user_ref" ON "public"."auth_account"("user_ref", "user_type");

-- CreateIndex
CREATE UNIQUE INDEX "mp_config_tenant_id_key" ON "public"."mp_config"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_business_email_key" ON "public"."user_business"("email");

-- CreateIndex
CREATE INDEX "idx_user_business_email" ON "public"."user_business"("email");

-- CreateIndex
CREATE INDEX "idx_user_business_tenant" ON "public"."user_business"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_owner_email_key" ON "public"."user_owner"("email");

-- CreateIndex
CREATE INDEX "idx_user_owner_email" ON "public"."user_owner"("email");

-- CreateIndex
CREATE INDEX "idx_user_owner_tenant" ON "public"."user_owner"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_orders_tenant_lookup" ON "public"."order"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_orders_status" ON "public"."order"("status");

-- CreateIndex
CREATE INDEX "idx_orders_tenant_created_at_query" ON "public"."order"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_orders_tenant_status_query" ON "public"."order"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "idx_payments_order" ON "public"."payment"("order_id");

-- CreateIndex
CREATE INDEX "idx_payments_tenant_order_query" ON "public"."payment"("tenant_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_payments_mp_payment_id" ON "public"."payment"("mp_payment_id");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "public"."product"("category_id");

-- CreateIndex
CREATE INDEX "idx_products_tenant" ON "public"."product"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_products_visible" ON "public"."product"("visible");

-- CreateIndex
CREATE INDEX "role_tenant_id_idx" ON "public"."role"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_tenant_id_name_key" ON "public"."role"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "idx_session_last_used" ON "public"."session_app"("last_used_at");

-- CreateIndex
CREATE INDEX "idx_session_refresh_expires" ON "public"."session_app"("refresh_expires_at");

-- CreateIndex
CREATE INDEX "idx_session_tenant" ON "public"."session_app"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_session_user" ON "public"."session_app"("user_id");

-- CreateIndex
CREATE INDEX "idx_session_user_owner" ON "public"."session_app"("user_owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_slug_key" ON "public"."tenant"("slug");

-- CreateIndex
CREATE INDEX "idx_tenants_slug" ON "public"."tenant"("slug");

-- AddForeignKey
ALTER TABLE "public"."business" ADD CONSTRAINT "business_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."mp_config" ADD CONSTRAINT "mp_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_business" ADD CONSTRAINT "user_business_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_owner" ADD CONSTRAINT "user_owner_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."category" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."order" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("variant_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category"("category_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."product_variant" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."role" ADD CONSTRAINT "role_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."session_app" ADD CONSTRAINT "fk_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."session_app" ADD CONSTRAINT "fk_user_business" FOREIGN KEY ("user_id") REFERENCES "public"."user_business"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."session_app" ADD CONSTRAINT "fk_user_owner" FOREIGN KEY ("user_owner_id") REFERENCES "public"."user_owner"("user_owner_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_role" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("role_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_role" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_business"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
