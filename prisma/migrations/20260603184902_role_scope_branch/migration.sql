-- CreateEnum
CREATE TYPE "role_scope" AS ENUM ('org', 'branch', 'warehouse');

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "scope_level" "role_scope" NOT NULL DEFAULT 'org';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "warehouse_id" TEXT;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "branch_id" TEXT;
