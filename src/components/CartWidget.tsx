import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { formatPrice, useCart } from "@/lib/cart";

export function CartWidget() {
  const [open, setOpen] = useState(false);
  const { items, totalItems, total, setQuantity, removeItem } = useCart();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir carrinho de pedidos"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground pizza-shadow transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <div className="relative">
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-cheese text-xs font-black text-foreground shadow-sm">
            {totalItems}
          </span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <aside className="relative flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Seu carrinho
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar carrinho"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <p className="mt-10 text-center text-sm text-muted-foreground">
                  Seu carrinho está vazio. Escolha uma pizza no cardápio!
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={`${item.pizzaId}-${item.tamanho}`}
                      className="flex gap-3 rounded-2xl border border-border bg-background p-3"
                    >
                      {item.imagemUrl ? (
                        <img
                          src={item.imagemUrl}
                          alt={item.nome}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-16 w-16 shrink-0 rounded-xl bg-secondary" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">
                              {item.nome}
                            </p>
                            <p className="text-xs font-semibold text-muted-foreground">
                              Tamanho {item.tamanho} ·{" "}
                              {formatPrice(item.precoUnitario)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.pizzaId, item.tamanho)
                            }
                            aria-label={`Remover ${item.nome} ${item.tamanho}`}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                            <button
                              type="button"
                              aria-label="Diminuir quantidade"
                              onClick={() =>
                                setQuantity(
                                  item.pizzaId,
                                  item.tamanho,
                                  item.quantidade - 1,
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:text-primary"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-black text-foreground">
                              {item.quantidade}
                            </span>
                            <button
                              type="button"
                              aria-label="Aumentar quantidade"
                              onClick={() =>
                                setQuantity(
                                  item.pizzaId,
                                  item.tamanho,
                                  item.quantidade + 1,
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:text-primary"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-black text-foreground">
                            {formatPrice(item.precoUnitario * item.quantidade)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="border-t border-border px-5 py-4">
              <div className="flex items-center justify-between text-base font-black text-foreground">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                aria-disabled={items.length === 0}
                className={`mt-3 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                  items.length === 0
                    ? "pointer-events-none bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                Finalizar pedido
              </Link>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
