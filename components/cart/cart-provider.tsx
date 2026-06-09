"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import type { CartItemInput, CartSummary } from "@/lib/cart/types";
import { formatSar } from "@/lib/money";

type CartContextValue = {
  items: CartItemInput[];
  itemCount: number;
  summary: CartSummary | null;
  isServerCart: boolean;
  isLoaded: boolean;
  isOpen: boolean;
  addItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

type CartApiResponse = {
  items: CartItemInput[];
  summary: CartSummary;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "saha-cart-v1";
const EMPTY_CART_ITEMS: CartItemInput[] = [];

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemInput[]>(EMPTY_CART_ITEMS);
  const [serverSummary, setServerSummary] = useState<CartSummary | null>(null);
  const [isServerCart, setIsServerCart] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedItems = readStoredCart();

    const controller = new AbortController();

    fetch("/api/cart", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          setItems(storedItems);
          setIsLoaded(true);
          return null;
        }

        if (!response.ok) {
          throw new Error("Unable to load cart.");
        }

        return (await response.json()) as CartApiResponse;
      })
      .then(async (payload) => {
        if (!payload || controller.signal.aborted) {
          return;
        }

        setIsServerCart(true);

        if (storedItems.length > 0) {
          const mergedPayload = await mutateServerCart("/api/cart/items", {
            method: "POST",
            body: JSON.stringify({ items: storedItems }),
            signal: controller.signal,
          });

          if (!controller.signal.aborted) {
            window.localStorage.removeItem(CART_STORAGE_KEY);
            applyServerCart(mergedPayload, setItems, setServerSummary);
            setIsLoaded(true);
          }

          return;
        }

        applyServerCart(payload, setItems, setServerSummary);
        setIsLoaded(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setIsServerCart(false);
          setServerSummary(null);
          setItems(storedItems);
          setIsLoaded(true);
        }
      });

    return () => controller.abort();
  }, []);

  const addItem = useCallback(
    (productId: string) => {
      setIsOpen(true);

      if (isServerCart) {
        void mutateServerCart("/api/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId, quantity: 1 }),
        }).then((payload) => applyServerCart(payload, setItems, setServerSummary));
        return;
      }

      setItems((currentItems) => {
        const nextItems = resolveAddedItem(currentItems, productId);
        writeStoredCart(nextItems);

        return nextItems;
      });
    },
    [isServerCart],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (isServerCart) {
        void mutateServerCart(`/api/cart/items/${encodeURIComponent(productId)}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        }).then((payload) => applyServerCart(payload, setItems, setServerSummary));
        return;
      }

      setItems((currentItems) => {
        const nextItems = normalizeItems(
          currentItems.map((item) =>
            item.productId === productId ? { ...item, quantity } : item,
          ),
        );
        writeStoredCart(nextItems);

        return nextItems;
      });
    },
    [isServerCart],
  );

  const removeItem = useCallback(
    (productId: string) => {
      if (isServerCart) {
        void mutateServerCart(`/api/cart/items/${encodeURIComponent(productId)}`, {
          method: "DELETE",
        }).then((payload) => applyServerCart(payload, setItems, setServerSummary));
        return;
      }

      setItems((currentItems) => {
        const nextItems = currentItems.filter((item) => item.productId !== productId);
        writeStoredCart(nextItems);

        return nextItems;
      });
    },
    [isServerCart],
  );

  const clearCart = useCallback(() => {
    if (isServerCart) {
      void mutateServerCart("/api/cart", {
        method: "DELETE",
      }).then((payload) => applyServerCart(payload, setItems, setServerSummary));
      return;
    }

    writeStoredCart([]);
    setItems([]);
  }, [isServerCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      summary: serverSummary,
      isServerCart,
      isLoaded,
      isOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }),
    [
      addItem,
      clearCart,
      isOpen,
      isLoaded,
      isServerCart,
      items,
      removeItem,
      serverSummary,
      updateQuantity,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}

function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    summary: serverSummary,
    isServerCart,
    updateQuantity,
    removeItem,
  } = useCart();
  const cartKey = JSON.stringify(items);
  const [summaryState, setSummaryState] = useState<{
    key: string;
    summary: CartSummary | null;
  }>({ key: "", summary: null });
  const summary = isServerCart
    ? serverSummary
    : summaryState.key === cartKey
      ? summaryState.summary
      : null;
  const isLoading =
    isOpen &&
    items.length > 0 &&
    (isServerCart ? !serverSummary : summaryState.key !== cartKey);

  useEffect(() => {
    if (isServerCart || !isOpen || items.length === 0) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/cart/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load cart summary.");
        }

        return (await response.json()) as CartSummary;
      })
      .then((nextSummary) => {
        setSummaryState({ key: cartKey, summary: nextSummary });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSummaryState({ key: cartKey, summary: null });
        }
      });

    return () => controller.abort();
  }, [cartKey, isOpen, isServerCart, items]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-zinc-950/45"
        onClick={closeCart}
      />
      <aside
        aria-label="Shopping cart"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
              Your cart
            </p>
            <h2 className="text-2xl font-black text-zinc-950">Shopping bag</h2>
          </div>
          <button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-200"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag aria-hidden="true" className="size-10 text-zinc-300" />
              <h3 className="mt-4 text-xl font-black text-zinc-950">
                Your cart is empty
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Add products to prepare a cash on delivery order.
              </p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="size-20 animate-pulse rounded-lg bg-zinc-200" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200" />
                    <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-zinc-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && summary ? (
            <div className="space-y-5">
              {summary.items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="relative size-20 overflow-hidden rounded-lg bg-zinc-100">
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-bold text-zinc-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-zinc-600">
                      {formatSar(item.unitPriceHalalas)}
                    </p>
                    {!item.isAvailable ? (
                      <p className="mt-1 text-xs font-bold text-rose-600">
                        Quantity unavailable
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex h-9 items-center rounded-full border border-zinc-200">
                        <QuantityButton
                          label={`Decrease ${item.title} quantity`}
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                        >
                          <Minus aria-hidden="true" className="size-4" />
                        </QuantityButton>
                        <span className="w-8 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <QuantityButton
                          label={`Increase ${item.title} quantity`}
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                        >
                          <Plus aria-hidden="true" className="size-4" />
                        </QuantityButton>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => removeItem(item.productId)}
                        className="inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-rose-600"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="border-t border-zinc-200 px-5 py-5">
          {summary?.issues.length ? (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              Some cart items need attention before checkout.
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-600">
              Estimated subtotal
            </span>
            <span className="text-xl font-black text-zinc-950">
              {formatSar(summary?.estimatedSubtotalHalalas ?? 0)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Estimate only. Final SAR totals, VAT, delivery fees, and stock are
            recalculated server-side at checkout. Sign in is required to place
            a COD order.
          </p>
          <Link
            href="/cart"
            onClick={closeCart}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            View cart
          </Link>
          <Link
            href="/checkout"
            onClick={closeCart}
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full border border-zinc-950 px-5 text-sm font-bold text-zinc-950 transition hover:border-emerald-800 hover:text-emerald-800"
          >
            Continue to checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}

function QuantityButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100"
    >
      {children}
    </button>
  );
}

function resolveAddedItem(currentItems: CartItemInput[], productId: string) {
  const existingItem = currentItems.find((item) => item.productId === productId);

  if (existingItem) {
    return currentItems.map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
        : item,
    );
  }

  return normalizeItems([...currentItems, { productId, quantity: 1 }]);
}

async function mutateServerCart(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to update cart.");
  }

  return (await response.json()) as CartApiResponse;
}

function applyServerCart(
  payload: CartApiResponse,
  setItems: (items: CartItemInput[]) => void,
  setServerSummary: (summary: CartSummary) => void,
) {
  setItems(normalizeItems(payload.items));
  setServerSummary(payload.summary);
}

function normalizeItems(items: CartItemInput[]) {
  return items
    .filter(
      (item) =>
        typeof item.productId === "string" &&
        item.productId.length > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    )
    .slice(0, 20)
    .map((item) => ({
      productId: item.productId,
      quantity: Math.min(item.quantity, 99),
    }));
}

function writeStoredCart(items: CartItemInput[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }
}

function readStoredCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!storedCart) {
      return [];
    }

    const parsed = JSON.parse(storedCart) as CartItemInput[];

    return Array.isArray(parsed) ? normalizeItems(parsed) : [];
  } catch {
    return [];
  }
}
