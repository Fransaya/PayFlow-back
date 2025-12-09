-- AlterTable
ALTER TABLE "public"."mp_config" ADD COLUMN     "excluded_payment_types" JSONB,
ADD COLUMN     "max_installments" INTEGER NOT NULL DEFAULT 1;
