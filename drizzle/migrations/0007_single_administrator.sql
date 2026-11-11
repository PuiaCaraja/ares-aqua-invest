-- The owner is explicitly selected; public sign-up must never choose its own role.
-- Run as one transaction; prevent sign-ups racing the backfill and trigger installation.
LOCK TABLE auth.users, public.user_roles IN SHARE ROW EXCLUSIVE MODE;
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon, authenticated;
CREATE TABLE app_private.administrator_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  email text NOT NULL CHECK (email = lower(btrim(email)))
);
REVOKE ALL ON app_private.administrator_settings FROM PUBLIC, anon, authenticated;
ALTER TABLE app_private.administrator_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO app_private.administrator_settings (email)
VALUES ('leila.puia@equipe.pixaflow.com');

-- Reconcile existing accounts without creating users, passwords or confirming emails.
DELETE FROM public.user_roles AS roles
WHERE roles.role = 'admin' AND NOT EXISTS (
  SELECT 1 FROM auth.users AS users, app_private.administrator_settings AS settings
  WHERE users.id = roles.user_id AND lower(users.email) = settings.email
    AND users.email_confirmed_at IS NOT NULL
);
DELETE FROM public.user_roles AS roles
WHERE roles.role = 'user' AND EXISTS (
  SELECT 1 FROM auth.users AS users, app_private.administrator_settings AS settings
  WHERE users.id = roles.user_id AND lower(users.email) = settings.email
    AND users.email_confirmed_at IS NOT NULL
);
INSERT INTO public.user_roles (user_id, role)
SELECT users.id,
  CASE WHEN lower(users.email) = settings.email AND users.email_confirmed_at IS NOT NULL
    THEN 'admin'::public.app_role ELSE 'user'::public.app_role END
FROM auth.users AS users CROSS JOIN app_private.administrator_settings AS settings
ON CONFLICT (user_id, role) DO NOTHING;

CREATE UNIQUE INDEX user_roles_single_role_idx ON public.user_roles (user_id);
CREATE UNIQUE INDEX user_roles_single_admin_idx ON public.user_roles (role) WHERE role = 'admin';
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM PUBLIC, anon, authenticated;

CREATE FUNCTION app_private.assign_account_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  SELECT CASE WHEN lower(NEW.email) = settings.email AND NEW.email_confirmed_at IS NOT NULL
    THEN 'admin'::public.app_role ELSE 'user'::public.app_role END
  INTO assigned_role FROM app_private.administrator_settings AS settings;
  IF assigned_role IS NULL THEN
    RAISE EXCEPTION 'Administrator configuration missing';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = NEW.id AND role <> assigned_role;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION app_private.assign_account_role() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_account_role
AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION app_private.assign_account_role();

-- Called with the verified user's bearer, never with a caller-supplied ID/email/role.
CREATE FUNCTION public.get_account_role()
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  RETURN CASE WHEN EXISTS (
    SELECT 1 FROM public.user_roles AS roles
    JOIN auth.users AS users ON users.id = roles.user_id
    CROSS JOIN app_private.administrator_settings AS settings
    WHERE roles.user_id = auth.uid() AND roles.role = 'admin'
      AND lower(users.email) = settings.email AND users.email_confirmed_at IS NOT NULL
  ) THEN 'admin' ELSE 'client' END;
END;
$$;
REVOKE ALL ON FUNCTION public.get_account_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_account_role() TO authenticated, service_role;

-- Keep legacy role checks consistent with the selected owner.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles AS roles JOIN auth.users AS users ON users.id = roles.user_id
    CROSS JOIN app_private.administrator_settings AS settings
    WHERE roles.user_id = _user_id AND roles.role = _role
      AND (_role <> 'admin' OR (lower(users.email) = settings.email AND users.email_confirmed_at IS NOT NULL))
  )
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
