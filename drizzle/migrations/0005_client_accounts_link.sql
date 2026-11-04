ALTER TABLE public.cotas_interesses ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.cotas_interesses ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'em_analise';
ALTER TABLE public.reservas_vip ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.historico_ia ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS cotas_interesses_user_id_idx ON public.cotas_interesses(user_id);
CREATE INDEX IF NOT EXISTS reservas_vip_user_id_idx ON public.reservas_vip(user_id);
CREATE INDEX IF NOT EXISTS historico_ia_user_id_idx ON public.historico_ia(user_id);