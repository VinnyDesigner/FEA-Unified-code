-- Phase 1: identity (User/RefreshToken) moves to the higher-level DB.
-- Module tables become FK-less on "UserID" (integrity enforced in app code).
-- The identity tables are RENAMED to *_migrated_backup (not dropped) so the
-- Phase 1 ETL can read them and a missed reader fails loudly + recoverably.
-- The "Role"/"AccountStatus" enum TYPES are intentionally NOT dropped here:
-- the renamed backup table still has columns of those types. They are removed
-- together with the backup tables in a later cleanup commit.

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_UserID_fkey";

-- DropForeignKey
ALTER TABLE "otps" DROP CONSTRAINT "otps_UserID_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_RotatedToID_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_UserID_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_UserID_fkey";

-- RenameTable (was DropTable — kept as a dev backup)
ALTER TABLE "refresh_tokens" RENAME TO "refresh_tokens_migrated_backup";

-- RenameTable (was DropTable — kept as a dev backup)
ALTER TABLE "users" RENAME TO "users_migrated_backup";
