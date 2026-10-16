ALTER TABLE app_private."Incident"
  ADD COLUMN "aiError" TEXT,
  ADD COLUMN "aiStartedAt" TIMESTAMPTZ,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'OPEN',
  ADD CONSTRAINT "Incident_status_valid" CHECK ("status" IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
  ADD CONSTRAINT "Incident_aiStatus_valid" CHECK ("aiStatus" IN ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'));
