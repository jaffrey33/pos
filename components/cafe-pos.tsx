"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Coffee,
  Cookie,
  LayoutGrid,
  Search,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import type { MenuItem } from "@/lib/menu";
import CurrentOrder from "./current-order";

// Categories are stored uppercase in the database (see CATEGORY_MAP in the seed),
// so rows reaching this component differ from MenuItem["category"] in @/lib/menu.
type DbCategory = "DRINKS" | "SNACKS" | "MEALS";

type PosMenuItem = Omit<MenuItem, "category"> & { category: DbCategory };

type CategoryFilter = "All" | DbCategory;

export type CheckoutState = "idle" | "processing" | "success";

export type CartLine = {
  item: PosMenuItem;
  qty: number;
};

type Cart = Record<string, CartLine>;

const CATEGORIES: {
  key: CategoryFilter;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
    { key: "All", label: "All", icon: LayoutGrid },
    { key: "DRINKS", label: "Drinks", icon: Coffee },
    { key: "SNACKS", label: "Snacks", icon: Cookie },
    { key: "MEALS", label: "Meals", icon: UtensilsCrossed },
  ];

function omitCartItem(cart: Cart, id: string): Cart {
  const next = { ...cart };
  delete next[id];
  return next;
}

export default function CafePOS({ menu }: { menu: PosMenuItem[] }) {
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

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
  const total = subtotal;

  const addItem = (item: PosMenuItem) => {
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

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div
      className="flex h-screen overflow-hidden shadow-2xl bg-white"
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
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
     <div className="flex gap-center items-center gap-2">
           <div className="text-right text-xs text-neutral-500">
            <div className="text-lg font-bold text-neutral-900">{timeStr}</div>
            <div>{dateStr}</div>
          </div>
             <button
                 onClick={() => setMobileCartOpen(true)}
                 aria-label="View current order"
                 className="max-lg:flex relative h-10 w-10 items-center justify-center rounded-lg bg-neutral-400 text-neutral-500 hidden transition active:scale-95"
             >
                 <ShoppingBag size={20} strokeWidth={1.6} className="text-neutral-100" />
                 {Object.keys(cart).length > 0 && (
                     <div className="absolute -right-1 -top-2 p-0.5 px-1.5 rounded-full text-xs text-neutral-100 bg-amber-600 font-bold shadow-md">
                         {Object.keys(cart).length}
                     </div>
                 )}
             </button>
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
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-semibold transition active:scale-95 ${active
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item, i) => {
              const inCart = cart[item.id]?.qty || 0;
              const CategoryIcon = CATEGORIES.find((c) => c.key === item.category)?.icon;
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
                    {CategoryIcon && <CategoryIcon size={17} strokeWidth={1.7} />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-tight text-neutral-900">
                      {item.name}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      {item.tag}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-amber-600">{item.price}</div>
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

      {mobileCartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileCartOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 z-50 h-full w-full max-w-sm transform transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:h-auto lg:w-auto lg:max-w-none lg:translate-x-0 ${
          mobileCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <CurrentOrder
          cartItems={cartItems}
          itemCount={itemCount}
          subtotal={subtotal}
          total={total}
          checkoutState={checkoutState}
          setCheckoutState={setCheckoutState}
          onChangeQty={changeQty}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onClose={() => setMobileCartOpen(false)}
        />
      </div>
    </div>
  );
}