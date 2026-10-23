-- Expand Role Enum
ALTER TYPE app_private."Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE app_private."Role" ADD VALUE IF NOT EXISTS 'CAMPUS_DIRECTOR';
ALTER TYPE app_private."Role" ADD VALUE IF NOT EXISTS 'ACADEMIC_COORDINATOR';
ALTER TYPE app_private."Role" ADD VALUE IF NOT EXISTS 'TRAINER';
ALTER TYPE app_private."Role" ADD VALUE IF NOT EXISTS 'CAMPER';
ALTER TYPE app_private."Role" ADD VALUE IF NOT EXISTS 'PARTNER_REPRESENTATIVE';
ALTER TYPE app_private."Role" ADD VALUE IF NOT EXISTS 'IT_OPERATOR';

-- Enums
DO $enums$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'OrganizationType' AND n.nspname = 'app_private') THEN
    CREATE TYPE app_private."OrganizationType" AS ENUM ('CAMPUS_HEADQUARTERS', 'CAMPUS_BRANCH', 'PARTNER_COMPANY', 'EDUCATIONAL_ALLIANCE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'LearningPath' AND n.nspname = 'app_private') THEN
    CREATE TYPE app_private."LearningPath" AS ENUM ('AI_DATA', 'CLOUD_DEVOPS', 'FULLSTACK_DEVELOPMENT', 'SOFT_SKILLS', 'CYBERSECURITY');
  END IF;
END
$enums$;

-- Organizations
CREATE TABLE IF NOT EXISTS app_private."Organization" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "type" app_private."OrganizationType" NOT NULL DEFAULT 'CAMPUS_BRANCH',
  "taxId" TEXT,
  "billingPlan" TEXT NOT NULL DEFAULT 'ENTERPRISE_INTERNAL',
  "quotaHours" INTEGER NOT NULL DEFAULT 40 CHECK ("quotaHours" >= 0),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campus Branches
CREATE TABLE IF NOT EXISTS app_private."CampusBranch" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES app_private."Organization"("id") ON DELETE RESTRICT,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization Memberships
CREATE TABLE IF NOT EXISTS app_private."OrganizationMembership" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES app_private."Profile"("id") ON DELETE CASCADE,
  "organizationId" UUID NOT NULL REFERENCES app_private."Organization"("id") ON DELETE RESTRICT,
  "department" TEXT,
  "role" app_private."Role" NOT NULL DEFAULT 'CAMPER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationMembership_userId_organizationId_key" UNIQUE ("userId", "organizationId")
);

-- ConsentLog (Ley 1581 Habeas Data)
CREATE TABLE IF NOT EXISTS app_private."ConsentLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES app_private."Profile"("id") ON DELETE CASCADE,
  "policyVersion" TEXT NOT NULL,
  "acceptedPurposes" JSONB NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "isMinor" BOOLEAN NOT NULL DEFAULT false,
  "guardianEmail" TEXT,
  "guardianConsentAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ConsentLog_userId_policyVersion_idx" ON app_private."ConsentLog"("userId", "policyVersion");

-- DigitalActa (Ley 527 Firmas y No-Repudio)
CREATE TABLE IF NOT EXISTS app_private."DigitalActa" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES app_private."Organization"("id") ON DELETE RESTRICT,
  "loanId" UUID NOT NULL UNIQUE REFERENCES app_private."Loan"("id") ON DELETE CASCADE,
  "actaType" TEXT NOT NULL CHECK ("actaType" IN ('DELIVERY', 'RETURN')),
  "assetSerial" TEXT NOT NULL,
  "conditionNotes" TEXT NOT NULL,
  "sha256Hash" TEXT NOT NULL,
  "signatureData" TEXT NOT NULL,
  "pdfS3Key" TEXT,
  "signedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alter Space (Additive)
ALTER TABLE app_private."Space" ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES app_private."Organization"("id");
ALTER TABLE app_private."Space" ADD COLUMN IF NOT EXISTS "branchId" UUID REFERENCES app_private."CampusBranch"("id");
ALTER TABLE app_private."Space" ADD COLUMN IF NOT EXISTS "hardwareSpecs" JSONB;

-- Alter Resource (Additive)
ALTER TABLE app_private."Resource" ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES app_private."Organization"("id");
ALTER TABLE app_private."Resource" ADD COLUMN IF NOT EXISTS "batchCode" TEXT;
ALTER TABLE app_private."Resource" ADD COLUMN IF NOT EXISTS "hardwareModel" TEXT;

-- Alter Reservation (Additive)
ALTER TABLE app_private."Reservation" ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES app_private."Organization"("id");

-- Alter Incident (Additive)
ALTER TABLE app_private."Incident" ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES app_private."Organization"("id");

-- Alter AuditEvent (Additive)
ALTER TABLE app_private."AuditEvent" ADD COLUMN IF NOT EXISTS "previousHash" TEXT;
ALTER TABLE app_private."AuditEvent" ADD COLUMN IF NOT EXISTS "hash" TEXT;

-- Security Grants & RLS for new tables
REVOKE ALL ON app_private."Organization" FROM PUBLIC;
REVOKE ALL ON app_private."CampusBranch" FROM PUBLIC;
REVOKE ALL ON app_private."OrganizationMembership" FROM PUBLIC;
REVOKE ALL ON app_private."ConsentLog" FROM PUBLIC;
REVOKE ALL ON app_private."DigitalActa" FROM PUBLIC;

ALTER TABLE app_private."Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private."CampusBranch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private."OrganizationMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private."ConsentLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private."DigitalActa" ENABLE ROW LEVEL SECURITY;

DO $roles$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='campusflow_runtime') THEN
    GRANT SELECT, INSERT, UPDATE ON app_private."Organization" TO campusflow_runtime;
    GRANT SELECT, INSERT, UPDATE ON app_private."CampusBranch" TO campusflow_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON app_private."OrganizationMembership" TO campusflow_runtime;
    GRANT SELECT, INSERT ON app_private."ConsentLog" TO campusflow_runtime;
    GRANT SELECT, INSERT ON app_private."DigitalActa" TO campusflow_runtime;

    CREATE POLICY runtime_org_all ON app_private."Organization" FOR ALL TO campusflow_runtime USING (true) WITH CHECK (true);
    CREATE POLICY runtime_branch_all ON app_private."CampusBranch" FOR ALL TO campusflow_runtime USING (true) WITH CHECK (true);
    CREATE POLICY runtime_membership_all ON app_private."OrganizationMembership" FOR ALL TO campusflow_runtime USING (true) WITH CHECK (true);
    CREATE POLICY runtime_consent_all ON app_private."ConsentLog" FOR ALL TO campusflow_runtime USING (true) WITH CHECK (true);
    CREATE POLICY runtime_acta_all ON app_private."DigitalActa" FOR ALL TO campusflow_runtime USING (true) WITH CHECK (true);
  END IF;
END
$roles$;
