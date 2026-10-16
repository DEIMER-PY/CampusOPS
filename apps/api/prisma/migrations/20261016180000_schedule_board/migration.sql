CREATE TABLE app_private."ScheduleBoard" (
 "id" UUID PRIMARY KEY,
 "sourceKey" TEXT NOT NULL UNIQUE,
 "sourceHash" TEXT NOT NULL,
 "title" TEXT NOT NULL,
 "rooms" JSONB NOT NULL CHECK (jsonb_typeof("rooms")='array'),
 "entries" JSONB NOT NULL CHECK (jsonb_typeof("entries")='array'),
 "applicableDate" DATE,
 "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
 "revision" INTEGER NOT NULL DEFAULT 1 CHECK ("revision">0),
 "updatedBy" UUID,
 "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
 "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
REVOKE ALL ON app_private."ScheduleBoard" FROM PUBLIC;
ALTER TABLE app_private."ScheduleBoard" ENABLE ROW LEVEL SECURITY;
-- Generic PostgreSQL test environments do not contain Supabase roles.
DO $roles$
BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON app_private."ScheduleBoard" FROM anon;
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON app_private."ScheduleBoard" FROM authenticated;
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='campusflow_runtime') THEN
  GRANT SELECT, INSERT, UPDATE ON app_private."ScheduleBoard" TO campusflow_runtime;
  CREATE POLICY runtime_schedule_select ON app_private."ScheduleBoard" FOR SELECT TO campusflow_runtime USING (true);
  CREATE POLICY runtime_schedule_insert ON app_private."ScheduleBoard" FOR INSERT TO campusflow_runtime WITH CHECK (true);
  CREATE POLICY runtime_schedule_update ON app_private."ScheduleBoard" FOR UPDATE TO campusflow_runtime USING (true) WITH CHECK (true);
 END IF;
END
$roles$;
