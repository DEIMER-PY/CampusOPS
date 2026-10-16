-- Apply only to the dedicated CampusFlow project after approval.
-- Provision LOGIN password separately from ignored server environment; never commit it.
CREATE ROLE campusflow_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
GRANT CONNECT ON DATABASE postgres TO campusflow_runtime;
GRANT USAGE ON SCHEMA app_private TO campusflow_runtime;
GRANT SELECT ON app_private."Profile" TO campusflow_runtime;
GRANT SELECT, INSERT, UPDATE ON app_private."Space", app_private."Resource", app_private."Reservation", app_private."Loan", app_private."Incident" TO campusflow_runtime;
GRANT SELECT, INSERT ON app_private."AuditEvent" TO campusflow_runtime;
-- No DELETE, DDL, role management, or profile promotion permissions.
CREATE FUNCTION app_private.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO app_private."Profile" (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION app_private.handle_new_user() FROM PUBLIC;
CREATE TRIGGER campusflow_auth_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION app_private.handle_new_user();
REVOKE ALL ON SCHEMA app_private FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM anon, authenticated;
