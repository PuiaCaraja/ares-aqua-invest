CREATE TABLE public.reservas_vip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente TEXT NOT NULL,
  data_reserva DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.reservas_vip TO service_role;
ALTER TABLE public.reservas_vip ENABLE ROW LEVEL SECURITY;