CREATE TABLE public.historico_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta_usuario text NOT NULL,
  resposta_ia text NOT NULL,
  cota_recomendada text,
  data_interacao timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.historico_ia TO service_role;
ALTER TABLE public.historico_ia ENABLE ROW LEVEL SECURITY;