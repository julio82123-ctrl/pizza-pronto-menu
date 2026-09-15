import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, Bike, Pizza as PizzaIcon, PackageCheck } from "lucide-react";
import { formatPrice } from "@/lib/cart";
import { obterPedidoPublico } from "@/lib/pedidos.functions";

const ESTAGIOS = [
  { valor: "recebido", titulo: "Recebido", icon: Clock },
  { valor: "em preparo", titulo: "Em preparo", icon: PizzaIcon },
  { valor: "saiu para entrega", titulo: "Saiu para entrega", icon: Bike },
  { valor: "entregue", titulo: "Entregue", icon: PackageCheck },
] as const;

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Acompanhar Pedido — Pizzaria Bella Forno" },
      {
        name: "description",
        content:
          "Acompanhe em tempo real o preparo e a entrega do seu pedido na Pizzaria Bella Forno.",
      },
      { property: "og:title", content: "Acompanhar Pedido — Pizzaria Bella Forno" },
      {
        property: "og:description",
        content: "Veja o status do seu pedido: recebido, em preparo, saiu para entrega ou entregue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AcompanhamentoPage,
});

function AcompanhamentoPage() {
  const { id } = Route.useParams();
  const buscar = useServerFn(obterPedidoPublico);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pedido-publico", id],
    queryFn: () => buscar({ data: { id } }),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const indiceAtual = data
    ? ESTAGIOS.findIndex((e) => e.valor === data.status)
    : -1;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <PizzaIcon className="h-4 w-4" />
          </div>
          <span className="text-lg font-black text-foreground">Bella Forno</span>
          <Link
            to="/"
            className="ml-auto text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            Cardápio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Acompanhe seu pedido
        </h1>

        {isLoading && (
          <p className="mt-4 text-sm text-muted-foreground">Carregando pedido...</p>
        )}

        {(isError || (!isLoading && !data)) && (
          <p className="mt-4 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Não encontramos esse pedido. Confira se o link está completo.
          </p>
        )}

        {data && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Olá, {data.cliente_nome.split(" ")[0]}! Esta página se atualiza
              sozinha conforme o pedido avança.
            </p>

            <section className="mt-8 rounded-3xl border border-border bg-card p-6 pizza-shadow">
              <ol className="space-y-4 sm:flex sm:space-y-0">
                {ESTAGIOS.map((estagio, i) => {
                  const concluido = indiceAtual >= 0 && i <= indiceAtual;
                  const atual = i === indiceAtual;
                  const Icon = estagio.icon;
                  return (
                    <li
                      key={estagio.valor}
                      className="flex flex-1 items-center gap-3 sm:flex-col sm:text-center"
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          concluido
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground"
                        } ${atual ? "ring-4 ring-primary/20" : ""}`}
                      >
                        {concluido && !atual ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </span>
                      <span
                        className={`text-sm ${
                          atual
                            ? "font-black text-primary"
                            : concluido
                              ? "font-bold text-foreground"
                              : "font-semibold text-muted-foreground"
                        }`}
                      >
                        {estagio.titulo}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="mt-6 rounded-3xl border border-border bg-card p-6 pizza-shadow">
              <h2 className="text-lg font-black text-foreground">
                Itens do pedido
              </h2>
              <ul className="mt-4 space-y-3">
                {data.itens.map((item, i) => (
                  <li
                    key={`${item.nome}-${item.tamanho}-${i}`}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="font-semibold text-foreground">
                      {item.quantidade}× {item.nome}
                      <span className="ml-1 text-muted-foreground">
                        ({item.tamanho})
                      </span>
                    </span>
                    <span className="shrink-0 font-black text-foreground">
                      {formatPrice(item.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-base font-black text-foreground">
                <span>Total</span>
                <span>{formatPrice(data.total)}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Forma de pagamento:{" "}
                <span className="font-bold text-foreground">
                  {data.forma_pagamento === "pix" ? "PIX" : "Pagar na entrega"}
                </span>
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
