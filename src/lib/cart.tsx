import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Tamanho = "P" | "M" | "G";

export type CartItem = {
  pizzaId: string;
  nome: string;
  tamanho: Tamanho;
  precoUnitario: number;
  quantidade: number;
  imagemUrl: string | null;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantidade">, quantidade?: number) => void;
  setQuantity: (pizzaId: string, tamanho: Tamanho, quantidade: number) => void;
  removeItem: (pizzaId: string, tamanho: Tamanho) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "bella-forno-cart";

export function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed as CartItem[]);
      }
    } catch {
      /* ignore corrupted storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantidade">, quantidade = 1) => {
      setItems((prev) => {
        const index = prev.findIndex(
          (i) => i.pizzaId === item.pizzaId && i.tamanho === item.tamanho,
        );
        if (index === -1) return [...prev, { ...item, quantidade }];
        const next = [...prev];
        const existing = next[index]!;
        next[index] = {
          ...existing,
          quantidade: existing.quantidade + quantidade,
        };
        return next;
      });
    },
    [],
  );

  const setQuantity = useCallback(
    (pizzaId: string, tamanho: Tamanho, quantidade: number) => {
      setItems((prev) =>
        quantidade <= 0
          ? prev.filter(
              (i) => !(i.pizzaId === pizzaId && i.tamanho === tamanho),
            )
          : prev.map((i) =>
              i.pizzaId === pizzaId && i.tamanho === tamanho
                ? { ...i, quantidade }
                : i,
            ),
      );
    },
    [],
  );

  const removeItem = useCallback((pizzaId: string, tamanho: Tamanho) => {
    setItems((prev) =>
      prev.filter((i) => !(i.pizzaId === pizzaId && i.tamanho === tamanho)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, i) => sum + i.quantidade, 0);
    const total = items.reduce(
      (sum, i) => sum + i.quantidade * i.precoUnitario,
      0,
    );
    return {
      items,
      totalItems,
      total,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    };
  }, [items, addItem, setQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
