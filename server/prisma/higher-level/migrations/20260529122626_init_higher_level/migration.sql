-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MWQ_MEMBER', 'AQMS_MEMBER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "UserID" SERIAL NOT NULL,
    "UserName" VARCHAR(60) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "Password" VARCHAR(255) NOT NULL,
    "FirstName" VARCHAR(80) NOT NULL,
    "MiddleName" VARCHAR(80),
    "LastName" VARCHAR(80) NOT NULL,
    "PhoneNumber" VARCHAR(40),
    "EmiratesId" VARCHAR(40),
    "role" "Role" NOT NULL DEFAULT 'MWQ_MEMBER',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("UserID")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "TokenHash" VARCHAR(255) NOT NULL,
    "FamilyID" UUID NOT NULL,
    "IssuedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpiresAt" TIMESTAMPTZ(6) NOT NULL,
    "RevokedAt" TIMESTAMPTZ(6),
    "RotatedToID" INTEGER,
    "UserAgent" VARCHAR(255),
    "IpAddress" VARCHAR(60),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_application_access" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "application_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_application_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_UserName_key" ON "users"("UserName");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_accountStatus_idx" ON "users"("accountStatus");

-- CreateIndex
CREATE INDEX "refresh_tokens_UserID_RevokedAt_idx" ON "refresh_tokens"("UserID", "RevokedAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_ExpiresAt_idx" ON "refresh_tokens"("ExpiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_FamilyID_idx" ON "refresh_tokens"("FamilyID");

-- CreateIndex
CREATE UNIQUE INDEX "applications_code_key" ON "applications"("code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "user_application_access_application_id_idx" ON "user_application_access"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_application_access_user_id_application_id_key" ON "user_application_access"("user_id", "application_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_RotatedToID_fkey" FOREIGN KEY ("RotatedToID") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_application_access" ADD CONSTRAINT "user_application_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_application_access" ADD CONSTRAINT "user_application_access_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_application_access" ADD CONSTRAINT "user_application_access_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
