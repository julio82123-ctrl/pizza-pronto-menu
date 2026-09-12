import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Pizza = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_p: number;
  preco_m: number;
  preco_g: number;
  imagem_url: string | null;
  disponivel: boolean;
};

export const getAvailablePizzas = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      {
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data, error } = await supabase
      .from("pizzas")
      .select("id, nome, descricao, preco_p, preco_m, preco_g, imagem_url, disponivel")
      .eq("disponivel", true)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Pizza[];
  },
);
