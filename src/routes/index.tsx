import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, Pizza, Flame, Plus } from "lucide-react";
import { getAvailablePizzas, type Pizza } from "@/lib/pizzas.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pizzaria Bella Forno — Cardápio Digital" },
      {
        name: "description",
        content:
          "Peça as melhores pizzas da Pizzaria Bella Forno. Cardápio digital com entrega rápida e ingredientes frescos.",
      },
      {
        property: "og:title",
        content: "Pizzaria Bella Forno — Cardápio Digital",
      },
      {
        property: "og:description",
        content:
          "Peça as melhores pizzas da Pizzaria Bella Forno. Cardápio digital com entrega rápida e ingredientes frescos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const pizzas = await getAvailablePizzas();
    return { pizzas };
  },
  component: MenuPage,
});

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function MenuPage() {
  const { pizzas } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <section className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-secondary-foreground">
            <Flame className="h-3.5 w-3.5 text-primary" />
            Sabor de verdade
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Nosso Cardápio
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Escolha o seu tamanho e adicione ao carrinho. Preparada no forno a
            lenha com ingredientes selecionados.
          </p>
        </section>

        {pizzas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pizzas.map((pizza) => (
              <PizzaCard key={pizza.id} pizza={pizza} />
            ))}
          </div>
        )}
      </main>

      <FixedCart />
    </div>
  );
}

function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Pizza className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black leading-none tracking-tight text-foreground">
              Bella Forno
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              Pizzaria
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground sm:flex">
          <a href="#" className="text-foreground transition-colors hover:text-primary">
            Cardápio
          </a>
          <a href="#" className="transition-colors hover:text-primary">
            Promoções
          </a>
          <a href="#" className="transition-colors hover:text-primary">
            Contato
          </a>
        </nav>
      </div>
    </header>
  );
}

function FixedCart() {
  return (
    <button
      type="button"
      aria-label="Carrinho de pedidos"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground pizza-shadow transition-all hover:bg-primary/90 hover:pizza-card-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-cheese text-xs font-black text-foreground shadow-sm">
          0
        </span>
      </div>
    </button>
  );
}

function PizzaCard({ pizza }: { pizza: Pizza }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground transition-all duration-300 pizza-shadow hover:pizza-card-hover">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {pizza.imagem_url ? (
          <img
            src={pizza.imagem_url}
            alt={pizza.nome}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary text-muted-foreground">
            <Pizza className="h-12 w-12 opacity-40" />
            <span className="text-sm font-medium">Sem imagem</span>
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur-sm">
          Disponível
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-black text-foreground">{pizza.nome}</h3>
        {pizza.descricao && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {pizza.descricao}
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <PriceBadge label="P" price={pizza.preco_p} />
          <PriceBadge label="M" price={pizza.preco_m} />
          <PriceBadge label="G" price={pizza.preco_g} />
        </div>

        <button
          type="button"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}

function PriceBadge({ label, price }: { label: string; price: number }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-secondary px-2 py-2.5">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <span className="text-sm font-black text-secondary-foreground">
        {formatPrice(price)}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Pizza className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">
        Nenhuma pizza disponível
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Nosso cardápio está sendo atualizado. Volte em breve para conferir as
        novidades!
      </p>
    </div>
  );
}
