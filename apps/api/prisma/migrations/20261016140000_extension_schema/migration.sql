-- Keep the GiST helper extension out of the API-exposed public schema.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION btree_gist SET SCHEMA extensions;
