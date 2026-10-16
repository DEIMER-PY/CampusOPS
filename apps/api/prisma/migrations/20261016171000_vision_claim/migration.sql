-- Lease for recovery after an interrupted visual assessment.
ALTER TABLE app_private."Incident" ADD COLUMN "visionStartedAt" TIMESTAMPTZ;
