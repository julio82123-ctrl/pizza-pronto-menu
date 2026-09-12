CREATE TABLE public.pizzas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  preco_p numeric NOT NULL,
  preco_m numeric NOT NULL,
  preco_g numeric NOT NULL,
  imagem_url text,
  disponivel boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT ON public.pizzas TO anon;
GRANT SELECT ON public.pizzas TO authenticated;
GRANT ALL ON public.pizzas TO service_role;

ALTER TABLE public.pizzas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of available pizzas"
ON public.pizzas
FOR SELECT
TO anon, authenticated
USING (disponivel = true);