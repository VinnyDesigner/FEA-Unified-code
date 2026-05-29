-- Migration: auth_v1_enum (MWQ DB)
-- Adds MWQ_MEMBER and AQMS_MEMBER to the Role enum.
-- Must run in its own migration (committed) before auth_v1 references the new values.
-- VIEWER is left in place for Postgres 12-13 compat; it becomes a dead value post-migration.

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MWQ_MEMBER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'AQMS_MEMBER';
