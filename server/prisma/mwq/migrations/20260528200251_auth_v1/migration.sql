-- Migration: auth_v1 (MWQ DB)
-- Runs after auth_v1_enum which committed MWQ_MEMBER and AQMS_MEMBER into the Role enum.
-- Migrates VIEWER rows -> MWQ_MEMBER, adds accountStatus index, creates refresh_tokens table.
--
-- VIEWER remains in the enum (dead value) for Postgres 12-13 compat.
-- The T2 requireAuth middleware rejects any token/row with role='VIEWER'.

-- Migrate existing VIEWER rows to MWQ_MEMBER
UPDATE "users" SET "role" = 'MWQ_MEMBER' WHERE "role" = 'VIEWER';

-- Add accountStatus index on users
CREATE INDEX IF NOT EXISTS "users_accountStatus_idx" ON "users"("accountStatus");

-- Create refresh_tokens table
CREATE TABLE "refresh_tokens" (
    "id"          SERIAL NOT NULL,
    "UserID"      INTEGER NOT NULL,
    "TokenHash"   VARCHAR(255) NOT NULL,
    "FamilyID"    UUID NOT NULL,
    "IssuedAt"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpiresAt"   TIMESTAMPTZ(6) NOT NULL,
    "RevokedAt"   TIMESTAMPTZ(6),
    "RotatedToID" INTEGER,
    "UserAgent"   VARCHAR(255),
    "IpAddress"   VARCHAR(60),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_UserID_fkey"
    FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE CASCADE;

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_RotatedToID_fkey"
    FOREIGN KEY ("RotatedToID") REFERENCES "refresh_tokens"("id");

-- Indexes on refresh_tokens
CREATE INDEX "refresh_tokens_UserID_RevokedAt_idx" ON "refresh_tokens"("UserID", "RevokedAt");
CREATE INDEX "refresh_tokens_ExpiresAt_idx"         ON "refresh_tokens"("ExpiresAt");
CREATE INDEX "refresh_tokens_FamilyID_idx"          ON "refresh_tokens"("FamilyID");
