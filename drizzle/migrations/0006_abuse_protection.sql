-- Persistent atomic counters, accessible only through the server's service role.
CREATE SCHEMA IF NOT EXISTS abuse_private;
REVOKE ALL ON SCHEMA abuse_private FROM PUBLIC, anon, authenticated;
CREATE TABLE abuse_private.request_limits (
  key text PRIMARY KEY CHECK (key ~ '^[a-f0-9]{64}$'),
  hits integer NOT NULL CHECK (hits > 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX request_limits_expiry_idx ON abuse_private.request_limits (expires_at);
ALTER TABLE abuse_private.request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON abuse_private.request_limits FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.enforce_request_limits(p_rules jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET statement_timeout = '4s'
AS $$
DECLARE
  rule jsonb;
  current_hits integer;
  current_expiry timestamptz;
  checked_at timestamptz := statement_timestamp();
  retry_seconds integer := 0;
  wait_seconds integer;
  blocked_rule text := '';
  max_hits integer;
  window_seconds integer;
BEGIN
  IF p_rules IS NULL OR jsonb_typeof(p_rules) <> 'array'
     OR jsonb_array_length(p_rules) NOT BETWEEN 1 AND 8 THEN
    RAISE EXCEPTION 'Invalid rate limit rules';
  END IF;

  -- Consistent lock order for overlapping buckets avoids request-to-request deadlocks.
  FOR rule IN SELECT value FROM jsonb_array_elements(p_rules) ORDER BY value->>'key'
  LOOP
    max_hits := (rule->>'limit')::integer;
    window_seconds := (rule->>'window')::integer;
    IF (rule->>'key') IS NULL OR (rule->>'key') !~ '^[a-f0-9]{64}$'
       OR (rule->>'name') IS NULL OR (rule->>'name') !~ '^[a-z_.]{1,80}$'
       OR max_hits IS NULL OR max_hits NOT BETWEEN 1 AND 10000
       OR window_seconds IS NULL OR window_seconds NOT BETWEEN 1 AND 86400 THEN
      RAISE EXCEPTION 'Invalid rate limit rule';
    END IF;

    INSERT INTO abuse_private.request_limits AS bucket (key, hits, expires_at)
    VALUES (rule->>'key', 1, checked_at + make_interval(secs => window_seconds))
    ON CONFLICT (key) DO UPDATE SET
      hits = CASE WHEN bucket.expires_at <= checked_at THEN 1 ELSE LEAST(bucket.hits + 1, max_hits + 1) END,
      expires_at = CASE WHEN bucket.expires_at <= checked_at
        THEN checked_at + make_interval(secs => window_seconds) ELSE bucket.expires_at END
    RETURNING hits, expires_at INTO current_hits, current_expiry;

    IF current_hits > max_hits THEN
      wait_seconds := GREATEST(1, CEIL(EXTRACT(EPOCH FROM current_expiry - checked_at))::integer);
      IF wait_seconds > retry_seconds THEN
        retry_seconds := wait_seconds;
        blocked_rule := rule->>'name';
      END IF;
    END IF;
  END LOOP;

  -- Bound cleanup work and skip buckets currently locked by other requests.
  DELETE FROM abuse_private.request_limits WHERE key IN (
    SELECT key FROM abuse_private.request_limits
    WHERE expires_at < checked_at - interval '1 day'
    ORDER BY expires_at LIMIT 100 FOR UPDATE SKIP LOCKED
  );
  RETURN jsonb_build_object('allowed', retry_seconds = 0, 'retry_after', retry_seconds, 'rule', blocked_rule);
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_request_limits(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_request_limits(jsonb) TO service_role;
COMMENT ON FUNCTION public.enforce_request_limits(jsonb) IS 'Server-only attempt quotas; atomic across replicas, HMAC keys only, fails closed in application.';
