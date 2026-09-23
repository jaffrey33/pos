# Kape Umbra — Café POS

A point-of-sale screen for a café: a searchable/filterable menu grid on
the left and a running order/checkout panel on the right. Built as
React client components (Next.js `"use client"`) styled with Tailwind.

## Files

| File | Role |
|---|---|
| `cafe-pos.tsx` | Top-level `CafePOS` component. Owns menu search/filter, cart state, and the responsive layout (menu grid + order panel). |
| `current-order.tsx` | `CurrentOrder` component. Renders the cart, order type toggle, totals, and handles checkout. Fully controlled by props from `CafePOS`. |
| `@/lib/menu` (external) | Source of truth for menu item shape (`MenuItem`) — title-case categories (`"Drinks" \| "Snacks" \| "Meals"`), used for the seed data. |

## Data flow

`CafePOS` receives `menu: PosMenuItem[]` as a prop (expected to come
from the database via Prisma) and owns all mutable state. `CurrentOrder`
is a controlled child: it receives cart data and callbacks as props and
has no direct access to cart state.

```
page/server component
   └── <CafePOS menu={...} />          (owns: category, query, cart, checkoutState, mobileCartOpen)
         ├── menu grid (search + category filter + item cards)
         └── <CurrentOrder ... />      (owns: orderType, orderNumber, checkoutError)
```

## Key types

```ts
// Categories are stored UPPERCASE in the database (see CATEGORY_MAP in
// the Prisma seed script), which differs from MenuItem["category"] in
// @/lib/menu (title case: "Drinks" | "Snacks" | "Meals").
type DbCategory = "DRINKS" | "SNACKS" | "MEALS";

type PosMenuItem = Omit<MenuItem, "category"> & { category: DbCategory };

type CategoryFilter = "All" | DbCategory;

export type CheckoutState = "idle" | "processing" | "success";

export type CartLine = { item: PosMenuItem; qty: number };

type Cart = Record<string, CartLine>; // keyed by item.id
```

`CheckoutState` and `CartLine` are exported from `cafe-pos.tsx` so
`current-order.tsx` can import them as types without duplicating the
definitions or creating a runtime circular dependency.

> **Note:** if a Prisma-generated `MenuCategory` enum exists, it can
> replace the hand-written `DbCategory` type for a single source of
> truth.

## `CafePOS` (`cafe-pos.tsx`)

**Props:** `{ menu: PosMenuItem[] }`

**State:**
- `category: CategoryFilter` — active category tab, default `"All"`.
- `query: string` — search box text, matched against item name
  (case-insensitive substring).
- `cart: Cart` — the order in progress.
- `checkoutState: CheckoutState` — mirrors the checkout lifecycle;
  while not `"idle"`, `addItem` is a no-op so items can't be added
  mid-checkout.
- `mobileCartOpen: boolean` — controls the mobile order drawer (see
  below).
- `now: Date` — ticks every second via `setInterval` to drive the
  header clock; cleared on unmount.

**Derived values:** `filtered` (menu filtered by category + query,
memoized), `cartItems`, `itemCount`, `subtotal`, `total` (currently
`total === subtotal`; no tax line is applied).

**Handlers passed down to `CurrentOrder`:** `changeQty`, `removeItem`,
`clearCart`, plus `setCheckoutState` and `onClose` (for the drawer).

**Layout:** a single `flex` row containing the menu column and the
order panel. On screens `lg` and wider it's a normal two-column
layout; below `lg` the order panel becomes an off-canvas drawer (see
next section).

## `CurrentOrder` (`current-order.tsx`)

**Props:**

```ts
type CurrentOrderProps = {
  cartItems: CartLine[];
  itemCount: number;
  subtotal: number;
  total: number;
  checkoutState: CheckoutState;
  setCheckoutState: Dispatch<SetStateAction<CheckoutState>>;
  onChangeQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onClose?: () => void; // optional: only used for the mobile drawer
};
```

**Own state:** `checkoutError`, `orderNumber` (ticket number, starts
at `128`), `orderType` (`"Dine In" | "Takeaway"`).

**Checkout flow (`handleCheckout`):**
1. No-ops if the cart is empty or a checkout is already in progress.
2. Sets `checkoutState` to `"processing"` and clears any previous
   error.
3. `POST /api/orders` with `{ orderType, lines: [{ menuItemId, qty,
   unitPrice }] }`.
4. On success: sets `checkoutState` to `"success"`, then after 1.5s
   resets to `"idle"`, clears the cart (`onClearCart`), updates
   `orderNumber` from the response's `ticketNo`, and closes the mobile
   drawer (`onClose?.()`).
5. On failure: shows the error message under the checkout button and
   resets `checkoutState` to `"idle"`.

The "Charge" button's label and icon swap with `checkoutState`
(`Charge {total}` → spinner + "Processing…" → check + "Sent to
Kitchen"). "Clear" and "Charge" are disabled when the cart is empty;
"Charge" is also disabled while not idle.

## Mobile cart drawer

Below the `lg` breakpoint, `CurrentOrder` is hidden off-screen and
opened via the cart icon (with an item-count badge) in the header.

- `mobileCartOpen` (in `CafePOS`) drives a wrapper div around
  `CurrentOrder`:
  - Default: `fixed inset-y-0 right-0`, off-screen
    (`translate-x-full`), slides in (`translate-x-0`) when open.
  - `lg:` and up: reverts to `static`, normal sizing, always visible
    — the drawer mechanics are inert on larger screens.
- A `fixed inset-0 bg-black/50` backdrop renders (below `lg` only)
  while the drawer is open; clicking it closes the drawer.
- `CurrentOrder` shows a close (`X`) button next to the shopping-bag
  icon in its header, visible only below `lg`, wired to `onClose`.
- The drawer also auto-closes after a successful checkout.

If the mobile/desktop split needs a different breakpoint, update all
`lg:`/`max-lg:` classes together (cart badge button, backdrop, drawer
wrapper, close button).

## Known gaps / things to verify against the rest of the app

- **`total === subtotal`** — there's a commented-out tax line in
  `CurrentOrder`; no tax is currently calculated or charged.
- **`menu` prop source** — `PosMenuItem` assumes `menu` comes from the
  database (uppercase categories). If a caller ever passes the static
  `MENU` array from `@/lib/menu` directly, categories won't match and
  the category tabs/icons will silently show nothing for that data.
- **`/api/orders` contract** — assumed to accept `{ orderType, lines:
  { menuItemId, qty, unitPrice }[] }` and return an object with a
  `ticketNo` field; not verified against the actual route handler.
- **Accessibility** — category tabs and menu item cards are plain
  buttons with no `aria-pressed`/`aria-selected` state; the mobile
  drawer has no focus trap or `Escape`-to-close handling.
