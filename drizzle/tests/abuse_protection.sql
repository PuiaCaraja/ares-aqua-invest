-- Run with an owner connection in an isolated test database AFTER migration 0006.
-- Fixtures and counter changes are rolled back.
BEGIN;
DO $$
DECLARE
  result jsonb;
  rules jsonb := jsonb_build_array(jsonb_build_object(
    'key', repeat('a', 64), 'name', 'test.burst', 'limit', 2, 'window', 60
  ));
BEGIN
  DELETE FROM abuse_private.request_limits WHERE key = repeat('a', 64);
  result := public.enforce_request_limits(rules);
  ASSERT (result->>'allowed')::boolean, 'First attempt must pass';
  result := public.enforce_request_limits(rules);
  ASSERT (result->>'allowed')::boolean, 'Last allowed attempt must pass';
  result := public.enforce_request_limits(rules);
  ASSERT NOT (result->>'allowed')::boolean, 'Limit + 1 must be denied';
  ASSERT (result->>'retry_after')::integer BETWEEN 1 AND 60, 'Retry delay must be bounded';
  ASSERT result->>'rule' = 'test.burst', 'Blocked policy must be identifiable';
  PERFORM public.enforce_request_limits(rules);
  ASSERT (SELECT hits = 3 FROM abuse_private.request_limits WHERE key = repeat('a', 64)), 'Blocked counters must saturate';
  UPDATE abuse_private.request_limits SET expires_at = now() - interval '1 second'
    WHERE key = repeat('a', 64);
  result := public.enforce_request_limits(rules);
  ASSERT (result->>'allowed')::boolean, 'Expired windows must reopen';
  ASSERT (SELECT hits = 1 FROM abuse_private.request_limits WHERE key = repeat('a', 64)), 'Expired counters must reset';

  -- A global rule must block a fresh individual identity too.
  rules := jsonb_build_array(
    jsonb_build_object('key', repeat('b', 64), 'name', 'test.global', 'limit', 1, 'window', 60),
    jsonb_build_object('key', repeat('c', 64), 'name', 'test.identity', 'limit', 5, 'window', 60)
  );
  DELETE FROM abuse_private.request_limits WHERE key IN (repeat('b', 64), repeat('c', 64), repeat('d', 64));
  PERFORM public.enforce_request_limits(rules);
  result := public.enforce_request_limits(jsonb_set(rules, '{1,key}', to_jsonb(repeat('d', 64))));
  ASSERT NOT (result->>'allowed')::boolean, 'Global quota must span identities';
  ASSERT result->>'rule' = 'test.global', 'Global policy must be reported';

  ASSERT NOT has_function_privilege('anon', 'public.enforce_request_limits(jsonb)', 'EXECUTE'), 'Anon must not call RPC';
  ASSERT NOT has_function_privilege('authenticated', 'public.enforce_request_limits(jsonb)', 'EXECUTE'), 'Clients must not call RPC';
  ASSERT has_function_privilege('service_role', 'public.enforce_request_limits(jsonb)', 'EXECUTE'), 'Server must call RPC';
  ASSERT NOT has_schema_privilege('anon', 'abuse_private', 'USAGE'), 'Counter schema must be private';
  ASSERT NOT has_table_privilege('authenticated', 'abuse_private.request_limits', 'SELECT'), 'Counters must not be readable by clients';
END;
$$;
ROLLBACK;
