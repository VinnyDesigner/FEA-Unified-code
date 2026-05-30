-- Phase 1 cleanup: the identity ETL is verified, so drop the renamed backup
-- tables and the now-unused legacy enum types from the module DB. Identity
-- lives solely in fea_higher_level.

-- DropTable
DROP TABLE "refresh_tokens_migrated_backup";

-- DropTable
DROP TABLE "users_migrated_backup";

-- DropEnum
DROP TYPE "AccountStatus";

-- DropEnum
DROP TYPE "Role";
