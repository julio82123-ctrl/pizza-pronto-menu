import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Pizza as PizzaIcon,
  QrCode,
} from "lucide-react";
import { formatPrice, useCart } from "@/lib/cart";
import { criarPedido } from "@/lib/pedidos.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar Pedido — Pizzaria Bella Forno" },
      {
        name: "description",
        content:
          "Confirme seu pedido na Pizzaria Bella Forno: informe nome, telefone, endereço de entrega e escolha pagar na entrega ou por PIX.",
      },
      { property: "og:title", content: "Finalizar Pedido — Pizzaria Bella Forno" },
      {
        property: "og:description",
        content:
          "Confirme seu pedido de pizza com entrega rápida. Pague na entrega ou por PIX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

type FormaPagamento = "entrega" | "pix";

function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const enviarPedido = useServerFn(criarPedido);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("entrega");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);

    if (items.length === 0) {
      setErro("Seu carrinho está vazio.");
      return;
    }
    if (nome.trim().length < 2) return setErro("Informe seu nome completo.");
    if (telefone.trim().length < 8)
      return setErro("Informe um telefone válido com DDD.");
    if (endereco.trim().length < 5)
      return setErro("Informe o endereço completo para entrega.");

    setEnviando(true);
    try {
      const resultado = await enviarPedido({
        data: {
          cliente_nome: nome.trim(),
          cliente_telefone: telefone.trim(),
          cliente_endereco: endereco.trim(),
          forma_pagamento: formaPagamento,
          itens: items.map((i) => ({
            pizzaId: i.pizzaId,
            nome: i.nome,
            tamanho: i.tamanho,
            precoUnitario: i.precoUnitario,
            quantidade: i.quantidade,
          })),
        },
      });
      if (
        !resultado ||
        typeof resultado !== "object" ||
        (resultado as { ok?: boolean }).ok !== true
      ) {
        throw new Error(
          "Não foi possível confirmar o pedido. Tente novamente em instantes.",
        );
      }
      clearCart();
      setSucesso(true);
      router.invalidate();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o pedido. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center pizza-shadow">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-foreground">
            Pedido recebido!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Obrigado, {nome.split(" ")[0]}! Já estamos preparando sua pizza.
            {formaPagamento === "pix"
              ? " Enviaremos os dados do PIX pelo telefone informado."
              : " O pagamento será feito na entrega."}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Cardápio
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <PizzaIcon className="h-4 w-4" />
            </div>
            <span className="text-lg font-black text-foreground">
              Bella Forno
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Finalizar pedido
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha seus dados de entrega e confirme o pedido.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border bg-card p-6 pizza-shadow"
          >
            <div className="space-y-4">
              <Field label="Nome completo">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={120}
                  required
                  placeholder="Ex.: Maria Silva"
                  className="input-pizza"
                />
              </Field>

              <Field label="Telefone (WhatsApp)">
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  maxLength={30}
                  required
                  inputMode="tel"
                  placeholder="(11) 99999-9999"
                  className="input-pizza"
                />
              </Field>

              <Field label="Endereço de entrega">
                <textarea
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  maxLength={300}
                  required
                  rows={3}
                  placeholder="Rua, número, bairro, complemento"
                  className="input-pizza resize-none"
                />
              </Field>

              <fieldset>
                <legend className="mb-2 text-sm font-bold text-foreground">
                  Forma de pagamento
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <PaymentOption
                    checked={formaPagamento === "entrega"}
                    onSelect={() => setFormaPagamento("entrega")}
                    icon={<Banknote className="h-5 w-5" />}
                    title="Pagar na entrega"
                    description="Dinheiro ou cartão na porta"
                  />
                  <PaymentOption
                    checked={formaPagamento === "pix"}
                    onSelect={() => setFormaPagamento("pix")}
                    icon={<QrCode className="h-5 w-5" />}
                    title="PIX"
                    description="Enviamos a chave após o pedido"
                  />
                </div>
              </fieldset>
            </div>

            {erro && (
              <p className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || items.length === 0}
              className="mt-6 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              {enviando
                ? "Enviando pedido..."
                : `Confirmar pedido · ${formatPrice(total)}`}
            </button>
          </form>

          <aside className="h-fit rounded-3xl border border-border bg-card p-6 pizza-shadow">
            <h2 className="text-lg font-black text-foreground">Resumo</h2>
            {items.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Seu carrinho está vazio.{" "}
                <Link to="/" className="font-bold text-primary">
                  Ver cardápio
                </Link>
              </p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li
                      key={`${item.pizzaId}-${item.tamanho}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="font-semibold text-foreground">
                        {item.quantidade}× {item.nome}
                        <span className="ml-1 text-muted-foreground">
                          ({item.tamanho})
                        </span>
                      </span>
                      <span className="shrink-0 font-black text-foreground">
                        {formatPrice(item.precoUnitario * item.quantidade)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-base font-black text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function PaymentOption({
  checked,
  onSelect,
  icon,
  title,
  description,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
        checked
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <span
        className={`mt-0.5 ${checked ? "text-primary" : "text-muted-foreground"}`}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
