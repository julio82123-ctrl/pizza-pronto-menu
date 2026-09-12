CREATE TABLE public.pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome text NOT NULL,
  cliente_telefone text NOT NULL,
  cliente_endereco text NOT NULL,
  itens jsonb NOT NULL,
  total numeric NOT NULL,
  forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('entrega', 'pix')),
  status text NOT NULL DEFAULT 'recebido',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.pedidos TO anon, authenticated;
GRANT ALL ON public.pedidos TO service_role;

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create an order"
ON public.pedidos FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();