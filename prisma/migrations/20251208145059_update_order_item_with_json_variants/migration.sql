/*
  Warnings:

  - You are about to drop the column `variant_id` on the `order_item` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."order_item" DROP CONSTRAINT "order_items_variant_id_fkey";

-- AlterTable
ALTER TABLE "public"."order" ADD COLUMN     "aditional_note" TEXT,
ADD COLUMN     "customer_email" TEXT,
ADD COLUMN     "customer_name" TEXT,
ADD COLUMN     "customer_phone" TEXT,
ADD COLUMN     "delivery_address" JSONB,
ADD COLUMN     "delivery_method" TEXT,
ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."order_item" DROP COLUMN "variant_id",
ADD COLUMN     "selected_variants" JSONB;

-- AlterTable
ALTER TABLE "public"."tenant" ADD COLUMN     "allow_cash_on_delivery" BOOLEAN DEFAULT true;

-- CreateTable
CREATE TABLE "public"."delivery_config" (
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
CREATE TABLE "public"."social_integration" (
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

-- CreateIndex
CREATE INDEX "delivery_config_tenant_id_idx" ON "public"."delivery_config"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_config_tenant_id_type_key" ON "public"."delivery_config"("tenant_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "social_integration_tenant_id_channel_key" ON "public"."social_integration"("tenant_id", "channel");

-- AddForeignKey
ALTER TABLE "public"."delivery_config" ADD CONSTRAINT "delivery_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."social_integration" ADD CONSTRAINT "social_integration_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;
