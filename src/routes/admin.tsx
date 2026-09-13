import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart";
import {
  STATUS_OPCOES,
  atualizarStatusPedido,
  garantirAdmin,
  listarPedidos,
  type PedidoAdmin,
  type StatusPedido,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel do dono | Bella Forno" },
      {
        name: "description",
        content:
          "Área restrita da Bella Forno: acompanhe os pedidos recebidos e atualize o status de cada entrega.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel do dono | Bella Forno" },
      {
        property: "og:description",
        content: "Acesso restrito ao dono da pizzaria Bella Forno.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const statusEstilo: Record<StatusPedido, string> = {
  recebido: "bg-secondary/20 text-secondary-foreground",
  "em preparo": "bg-accent/25 text-foreground",
  "saiu para entrega": "bg-primary/15 text-primary",
  entregue: "bg-emerald-500/15 text-emerald-700",
};

function AdminPage() {
  const [checando, setChecando] = useState(true);
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLogado(!!data.session);
      setChecando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLogado(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return logado ? <Painel /> : <LoginForm />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviando(true);
    try {
      if (modo === "cadastro") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        if (!data.session) {
          setAviso(
            "Conta criada! Confirme o cadastro pelo link enviado ao seu e-mail e depois entre.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) throw error;
      }
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Não foi possível continuar.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 pizza-shadow">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-extrabold text-foreground">
            Área do dono
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre para acompanhar os pedidos da Bella Forno.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-foreground">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-pizza mt-1"
              placeholder="dono@bellaforno.com"
            />
          </div>
          <div>
            <label htmlFor="senha" className="text-sm font-semibold text-foreground">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              minLength={6}
              autoComplete={modo === "login" ? "current-password" : "new-password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input-pizza mt-1"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {erro}
            </p>
          )}
          {aviso && (
            <p className="rounded-xl bg-secondary/15 px-3 py-2 text-sm text-foreground">
              {aviso}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {enviando
              ? "Aguarde…"
              : modo === "login"
                ? "Entrar"
                : "Criar conta do dono"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setModo(modo === "login" ? "cadastro" : "login");
            setErro(null);
            setAviso(null);
          }}
          className="mt-4 w-full text-sm font-semibold text-primary hover:underline"
        >
          {modo === "login"
            ? "Primeiro acesso? Criar a conta do dono"
            : "Já tenho conta, quero entrar"}
        </button>

        <Link
          to="/"
          className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao cardápio
        </Link>
      </div>
    </main>
  );
}

function Painel() {
  const carregar = useServerFn(listarPedidos);
  const ensureAdmin = useServerFn(garantirAdmin);
  const mudarStatus = useServerFn(atualizarStatusPedido);

  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      await ensureAdmin({});
      const lista = await carregar({});
      setPedidos(lista);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os pedidos.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function alterar(id: string, status: StatusPedido) {
    const anteriores = pedidos;
    setPedidos((atual) =>
      atual.map((p) => (p.id === id ? { ...p, status } : p)),
    );
    try {
      await mudarStatus({ data: { id, status } });
    } catch (err) {
      setPedidos(anteriores);
      setErro(
        err instanceof Error ? err.message : "Não foi possível mudar o status.",
      );
    }
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">
              Pedidos · Bella Forno
            </h1>
            <p className="text-sm text-muted-foreground">
              {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"} no total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void buscar()}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent/20"
            >
              <RefreshCw className="h-4 w-4" /> Atualizar
            </button>
            <button
              onClick={() => void sair()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {erro && (
          <p className="mb-6 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {erro}
          </p>
        )}

        {carregando ? (
          <p className="text-muted-foreground">Carregando pedidos…</p>
        ) : pedidos.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Nenhum pedido por aqui ainda.
          </p>
        ) : (
          <ul className="space-y-4">
            {pedidos.map((pedido) => (
              <li
                key={pedido.id}
                className="rounded-3xl border border-border bg-card p-5 pizza-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {pedido.cliente_nome}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pedido.cliente_telefone} · {pedido.cliente_endereco}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(pedido.created_at).toLocaleString("pt-BR")} ·{" "}
                      {pedido.forma_pagamento === "pix"
                        ? "PIX"
                        : "Pagar na entrega"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusEstilo[pedido.status]}`}
                  >
                    {pedido.status}
                  </span>
                </div>

                <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm text-foreground">
                  {pedido.itens.map((item, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>
                        {item.quantidade}× {item.nome} ({item.tamanho})
                      </span>
                      <span className="text-muted-foreground">
                        {formatPrice(Number(item.subtotal))}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-lg font-extrabold text-primary">
                    Total: {formatPrice(pedido.total)}
                  </p>
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    Status
                    <select
                      value={pedido.status}
                      onChange={(e) =>
                        void alterar(pedido.id, e.target.value as StatusPedido)
                      }
                      className="rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold"
                    >
                      {STATUS_OPCOES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
