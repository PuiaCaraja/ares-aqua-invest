-- OWNER CONNECTION, ISOLATED TEST DATABASE ONLY. Run after migration 0007.
-- Exercise the real Auth triggers and RPC; all fixtures are rolled back.
BEGIN;
DELETE FROM auth.users WHERE lower(email) = 'leila.puia@equipe.pixaflow.com';
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-000000000101', 'leila.puia@equipe.pixaflow.com', NULL, '{"role":"admin"}'),
  ('00000000-0000-0000-0000-000000000102', 'client-role-test@example.com', now(), '{"role":"admin","admin":true}');
DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'), 'Unconfirmed owner must not be admin';
  ASSERT (SELECT role = 'user' FROM public.user_roles WHERE user_id = '00000000-0000-0000-0000-000000000102'), 'Metadata must not promote clients';
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
  ASSERT public.get_account_role() = 'client', 'Ordinary account must be client';
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
  ASSERT public.get_account_role() = 'client', 'Owner must confirm email first';
END;
$$;
UPDATE auth.users SET email_confirmed_at = now() WHERE id = '00000000-0000-0000-0000-000000000101';
DO $$
BEGIN
  ASSERT public.get_account_role() = 'admin', 'Confirmed configured owner must be promoted automatically';
  ASSERT (SELECT count(*) = 1 FROM public.user_roles WHERE role = 'admin'), 'Exactly one owner after confirmation';
  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000102', 'admin');
    RAISE EXCEPTION 'A second administrator was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  ASSERT NOT has_function_privilege('anon', 'public.get_account_role()', 'EXECUTE'), 'Visitors must not call role RPC';
  ASSERT NOT has_table_privilege('authenticated', 'public.user_roles', 'INSERT'), 'Clients must not assign roles';
  ASSERT NOT has_table_privilege('authenticated', 'public.user_roles', 'UPDATE'), 'Clients must not change roles';
  ASSERT NOT has_schema_privilege('authenticated', 'app_private', 'USAGE'), 'Owner configuration must be private';
END;
$$;
UPDATE auth.users SET email = 'former-owner-role-test@example.com' WHERE id = '00000000-0000-0000-0000-000000000101';
DO $$
BEGIN
  ASSERT public.get_account_role() = 'client', 'Changing away from the designated email must revoke admin';
  ASSERT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'), 'Former owner must lose admin role';
  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN
    PERFORM public.get_account_role();
    RAISE EXCEPTION 'Missing identity was accepted';
  EXCEPTION WHEN invalid_authorization_specification THEN NULL;
  END;
END;
$$;
ROLLBACK;
