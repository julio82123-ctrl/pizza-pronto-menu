import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const STATUS_OPCOES = [
  "recebido",
  "em preparo",
  "saiu para entrega",
  "entregue",
] as const;

export type StatusPedido = (typeof STATUS_OPCOES)[number];

export type PedidoItem = {
  nome: string;
  tamanho: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

export type PedidoAdmin = {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_endereco: string;
  itens: PedidoItem[];
  total: number;
  forma_pagamento: string;
  status: StatusPedido;
  created_at: string;
};

/**
 * Garante que exista um dono: o primeiro usuário que entrar recebe o papel
 * de administrador. Depois disso, novos usuários não recebem nada.
 */
export const garantirAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: jaAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (jaAdmin) return { isAdmin: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) return { isAdmin: false };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);

    return { isAdmin: true };
  });

export const listarPedidos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito ao dono da pizzaria.");

    const { data, error } = await context.supabase
      .from("pedidos")
      .select(
        "id, cliente_nome, cliente_telefone, cliente_endereco, itens, total, forma_pagamento, status, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((p) => ({
      ...p,
      total: Number(p.total),
      itens: (Array.isArray(p.itens) ? p.itens : []) as PedidoItem[],
      status: p.status as StatusPedido,
    })) satisfies PedidoAdmin[];
  });

export const atualizarStatusPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(STATUS_OPCOES) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito ao dono da pizzaria.");

    const { error } = await context.supabase
      .from("pedidos")
      .update({ status: data.status })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
