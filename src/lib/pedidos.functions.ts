import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const itemSchema = z.object({
  pizzaId: z.string().trim().min(1).max(64),
  nome: z.string().trim().min(1).max(120),
  tamanho: z.enum(["P", "M", "G"]),
  precoUnitario: z.number().nonnegative().max(10000),
  quantidade: z.number().int().min(1).max(50),
});

const pedidoSchema = z.object({
  cliente_nome: z.string().trim().min(2, "Informe seu nome").max(120),
  cliente_telefone: z.string().trim().min(8, "Informe um telefone válido").max(30),
  cliente_endereco: z.string().trim().min(5, "Informe o endereço completo").max(300),
  forma_pagamento: z.enum(["entrega", "pix"]),
  itens: z.array(itemSchema).min(1, "O carrinho está vazio").max(50),
});

export type PedidoInput = z.infer<typeof pedidoSchema>;

export const criarPedido = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => pedidoSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const pizzaIds = [...new Set(data.itens.map((i) => i.pizzaId))];
    const { data: pizzas, error: pizzasError } = await supabase
      .from("pizzas")
      .select("id, nome, preco_p, preco_m, preco_g")
      .in("id", pizzaIds)
      .eq("disponivel", true);

    if (pizzasError) throw new Error(pizzasError.message);

    const priceFor = (
      pizza: { preco_p: number; preco_m: number; preco_g: number },
      tamanho: "P" | "M" | "G",
    ) =>
      tamanho === "P"
        ? pizza.preco_p
        : tamanho === "M"
          ? pizza.preco_m
          : pizza.preco_g;

    // Recalcula preços no servidor para não confiar nos valores do cliente.
    const itens = data.itens.map((item) => {
      const pizza = (pizzas ?? []).find((p) => p.id === item.pizzaId);
      if (!pizza) {
        throw new Error(`A pizza "${item.nome}" não está mais disponível.`);
      }
      const precoUnitario = Number(priceFor(pizza, item.tamanho));
      return {
        pizza_id: pizza.id,
        nome: pizza.nome,
        tamanho: item.tamanho,
        quantidade: item.quantidade,
        preco_unitario: precoUnitario,
        subtotal: Number((precoUnitario * item.quantidade).toFixed(2)),
      };
    });

    const total = Number(
      itens.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2),
    );

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert({
        cliente_nome: data.cliente_nome,
        cliente_telefone: data.cliente_telefone,
        cliente_endereco: data.cliente_endereco,
        itens,
        total,
        forma_pagamento: data.forma_pagamento,
        status: "recebido",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return { id: pedido.id, total };
  });
