-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app_private";

-- CreateEnum
CREATE TYPE "app_private"."Role" AS ENUM ('CLIENT', 'OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "app_private"."AssetStatus" AS ENUM ('AVAILABLE', 'DISABLED', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "app_private"."Profile" (
    "id" UUID NOT NULL,
    "role" "app_private"."Role" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."Space" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "app_private"."AssetStatus" NOT NULL DEFAULT 'DISABLED',
    "source" TEXT NOT NULL,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."Reservation" (
    "id" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "startAt" TIMESTAMPTZ NOT NULL,
    "endAt" TIMESTAMPTZ NOT NULL,
    "attendees" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "cancelledAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."Resource" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "app_private"."AssetStatus" NOT NULL DEFAULT 'DISABLED',
    "source" TEXT NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."Loan" (
    "id" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMPTZ,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."Incident" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "aiStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "triage" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."AuditEvent" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Space_name_key" ON "app_private"."Space"("name");

-- CreateIndex
CREATE INDEX "Reservation_userId_createdAt_idx" ON "app_private"."Reservation"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_code_key" ON "app_private"."Resource"("code");

-- CreateIndex
CREATE INDEX "Loan_userId_createdAt_idx" ON "app_private"."Loan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Incident_userId_createdAt_idx" ON "app_private"."Incident"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "app_private"."AuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "app_private"."Reservation" ADD CONSTRAINT "Reservation_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "app_private"."Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_private"."Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_private"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_private"."Loan" ADD CONSTRAINT "Loan_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "app_private"."Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_private"."Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_private"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_private"."Incident" ADD CONSTRAINT "Incident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_private"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain constraints not represented by Prisma schema syntax.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE app_private."Space" ADD CONSTRAINT "Space_capacity_positive" CHECK (capacity > 0);
ALTER TABLE app_private."Reservation" ADD CONSTRAINT "Reservation_attendees_positive" CHECK (attendees > 0);
ALTER TABLE app_private."Reservation" ADD CONSTRAINT "Reservation_interval_valid" CHECK ("endAt" > "startAt");
ALTER TABLE app_private."Reservation" ADD CONSTRAINT "Reservation_no_overlap"
  EXCLUDE USING gist ("spaceId" WITH =, tstzrange("startAt", "endAt", '[)') WITH &&)
  WHERE ("cancelledAt" IS NULL);
CREATE UNIQUE INDEX "Loan_one_active_per_resource" ON app_private."Loan" ("resourceId") WHERE "returnedAt" IS NULL;
ALTER TABLE app_private."Loan" ADD CONSTRAINT "Loan_return_after_creation" CHECK ("returnedAt" IS NULL OR "returnedAt" >= "createdAt");
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM PUBLIC;
