CREATE TABLE public.cotas_interesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente text NOT NULL CHECK (char_length(btrim(nome_cliente)) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) <= 255 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  categoria_cota text NOT NULL CHECK (char_length(btrim(categoria_cota)) BETWEEN 1 AND 100),
  valor_investimento numeric(14,2) NOT NULL CHECK (valor_investimento > 0),
  data_criacao timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cotas_interesses TO service_role;
REVOKE ALL ON public.cotas_interesses FROM anon, authenticated;
ALTER TABLE public.cotas_interesses ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.cotas_interesses IS 'Private interest submissions. Writes only through the validated application server; no public read or write access.';