-- Additive prototype changes. No existing records or permissions are removed.
ALTER TABLE app_private."Incident"
 ADD COLUMN "assetCode" TEXT,
 ADD COLUMN "evidence" JSONB,
 ADD COLUMN "visual" JSONB,
 ADD COLUMN "visionStatus" TEXT NOT NULL DEFAULT 'NONE',
 ADD COLUMN "communications" JSONB,
 ADD COLUMN "notification" JSONB;
ALTER TABLE app_private."Reservation" ADD COLUMN "participants" JSONB;
