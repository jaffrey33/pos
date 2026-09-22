"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Coffee,
  Cookie,
  LayoutGrid,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { MenuCategory, MenuItem } from "@/lib/menu";

type CategoryFilter = "All" | MenuCategory;
type OrderType = "Dine In" | "Takeaway";
type CheckoutState = "idle" | "processing" | "success";

type CartLine = {
  item: MenuItem;
  qty: number;
};

type Cart = Record<string, CartLine>;

const CATEGORIES: {
  key: CategoryFilter;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { key: "All", label: "All", icon: LayoutGrid },
  { key: "Drinks", label: "Drinks", icon: Coffee },
  { key: "Snacks", label: "Snacks", icon: Cookie },
  { key: "Meals", label: "Meals", icon: UtensilsCrossed },
];

const peso = (n: number) => `₱${n.toFixed(2)}`;

function omitCartItem(cart: Cart, id: string): Cart {
  const next = { ...cart };
  delete next[id];
  return next;
}

export default function CafePOS({ menu }: { menu: MenuItem[] }) {
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [orderType, setOrderType] = useState<OrderType>("Dine In");
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [orderNumber, setOrderNumber] = useState(128);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    return menu.filter((item) => {
      const matchesCat = category === "All" || item.category === category;
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [category, menu, query]);

  const cartItems = Object.values(cart);
  const itemCount = cartItems.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = cartItems.reduce((sum, line) => sum + line.qty * line.item.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const addItem = (item: MenuItem) => {
    if (checkoutState !== "idle") return;
    setCart((prev) => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { item, qty: (existing?.qty || 0) + 1 } };
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      const nextQty = existing.qty + delta;
      if (nextQty <= 0) {
        return omitCartItem(prev, id);
      }
      return { ...prev, [id]: { ...existing, qty: nextQty } };
    });
  };

  const removeItem = (id: string) => {
    setCart((prev) => omitCartItem(prev, id));
  };

  const clearCart = () => setCart({});

  const handleCheckout = () => {
    if (itemCount === 0 || checkoutState !== "idle") return;
    setCheckoutState("processing");
    setTimeout(() => {
      setCheckoutState("success");
      setTimeout(() => {
        setCheckoutState("idle");
        setCart({});
        setOrderNumber((n) => n + 1);
      }, 1500);
    }, 850);
  };

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div
      className="flex h-screen overflow-hidden rounded-2xl shadow-2xl bg-white"
      style={{ fontFamily: "'Public Sans', ui-sans-serif, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-rise { animation: riseIn 0.4s ease both; }
      `}</style>

      <div className="flex flex-1 min-w-0 flex-col gap-5 bg-white p-7 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
              <Coffee size={22} strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-xl font-extrabold leading-tight tracking-tight text-neutral-900">
                Kape Umbra
              </div>
              <div className="text-xs uppercase tracking-widest text-neutral-500">
                Point of Sale
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <div className="text-lg font-bold text-neutral-900">{timeStr}</div>
            <div>{dateStr}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-2.5 text-neutral-500">
          <Search size={16} strokeWidth={1.8} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drinks, snacks, meals…"
            className="w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                  active
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-neutral-200 bg-white text-neutral-900 hover:border-amber-300"
                }`}
              >
                <Icon size={15} strokeWidth={1.8} />
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item, i) => {
              const inCart = cart[item.id]?.qty || 0;
              return (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="animate-rise relative flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 text-left transition hover:border-amber-300 hover:shadow-lg active:scale-95"
                  style={{ animationDelay: `${Math.min(i, 20) * 25}ms` }}
                >
                  {inCart > 0 && (
                    <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white shadow-md">
                      {inCart}
                    </div>
                  )}
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                    {item.category === "Drinks" && <Coffee size={17} strokeWidth={1.7} />}
                    {item.category === "Snacks" && <Cookie size={17} strokeWidth={1.7} />}
                    {item.category === "Meals" && <UtensilsCrossed size={17} strokeWidth={1.7} />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-tight text-neutral-900">
                      {item.name}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      {item.tag}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-amber-600">{peso(item.price)}</div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full px-1 py-5 text-sm text-neutral-500">
                No items match &quot;{query}&quot;.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-shrink-0 flex-col bg-neutral-950 p-6 text-neutral-50 md:w-96">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">Current Order</div>
            <div className="mt-0.5 text-xs text-neutral-400">
              TICKET #{String(orderNumber).padStart(4, "0")}
            </div>
          </div>
          <ShoppingBag size={20} strokeWidth={1.6} className="text-neutral-400" />
        </div>

        <div className="mb-4 flex rounded-lg bg-neutral-900 p-1">
          {(["Dine In", "Takeaway"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`flex-1 rounded-md py-2 text-xs font-semibold transition ${
                orderType === t
                  ? "bg-amber-500 text-neutral-900"
                  : "bg-transparent text-neutral-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-5 text-center text-neutral-700">
            <ShoppingBag size={34} strokeWidth={1.3} />
            <div className="text-sm font-semibold text-neutral-300">No items yet</div>
            <div className="max-w-xs text-xs text-neutral-500">
              Tap a menu item on the left to start this order.
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {cartItems.map(({ item, qty }) => (
              <div
                key={item.id}
                className="animate-rise flex items-center gap-2.5 border-b border-neutral-800 pb-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    {item.tag}
                  </div>
                  <div className="mt-0.5 text-xs text-neutral-400">{peso(item.price)} each</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQty(item.id, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-700 text-neutral-50 transition hover:bg-neutral-800 active:scale-90"
                  >
                    <Minus size={12} strokeWidth={2} />
                  </button>
                  <div className="w-4 text-center text-sm">{qty}</div>
                  <button
                    onClick={() => changeQty(item.id, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-700 text-neutral-50 transition hover:bg-neutral-800 active:scale-90"
                  >
                    <Plus size={12} strokeWidth={2} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-neutral-600 transition hover:text-amber-500"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-sm text-neutral-400">
            <span>Subtotal</span>
            <span>{peso(subtotal)}</span>
          </div>
          <div className="mb-1.5 flex justify-between text-sm text-neutral-400">
            <span>Tax (8%)</span>
            <span>{peso(tax)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-neutral-800 pt-2.5 text-base font-bold">
            <span>Total</span>
            <span>{peso(total)}</span>
          </div>

          <div className="mt-4 flex gap-2.5">
            <button
              onClick={clearCart}
              disabled={cartItems.length === 0}
              className="rounded-lg border border-neutral-800 px-4 text-sm font-semibold text-neutral-400 transition hover:border-neutral-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Clear
            </button>
            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || checkoutState !== "idle"}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                checkoutState === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-500 text-neutral-900 hover:bg-amber-400"
              }`}
            >
              {checkoutState === "idle" && `Charge ${peso(total)}`}
              {checkoutState === "processing" && (
                <>
                  <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> Processing…
                </>
              )}
              {checkoutState === "success" && (
                <>
                  <Check size={16} strokeWidth={2.5} /> Sent to Kitchen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
