-- Supabase-only identity integration; isolated vanilla PostgreSQL has no auth schema.
DO $migration$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    EXECUTE $function$
      CREATE OR REPLACE FUNCTION app_private.handle_new_user()
      RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $body$
      BEGIN
        INSERT INTO app_private."Profile" (id) VALUES (NEW.id);
        RETURN NEW;
      END;
      $body$;
    $function$;
    REVOKE ALL ON FUNCTION app_private.handle_new_user() FROM PUBLIC;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'campusflow_auth_profile' AND tgrelid = 'auth.users'::regclass) THEN
      EXECUTE 'CREATE TRIGGER campusflow_auth_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION app_private.handle_new_user()';
    END IF;
    REVOKE ALL ON SCHEMA app_private FROM anon, authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM anon, authenticated;
  END IF;
END;
$migration$;
