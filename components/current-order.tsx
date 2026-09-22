import { Check, Loader2, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import type { CartLine, CheckoutState } from './cafe-pos';

type OrderType = "Dine In" | "Takeaway";

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
    onClose?: () => void;
};

function CurrentOrder({
    cartItems,
    itemCount,
    subtotal,
    total,
    checkoutState,
    setCheckoutState,
    onChangeQty,
    onRemoveItem,
    onClearCart,
    onClose,
}: CurrentOrderProps) {
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [orderNumber, setOrderNumber] = useState(128);
    const [orderType, setOrderType] = useState<OrderType>("Dine In");

    const handleCheckout = async () => {
        if (itemCount === 0 || checkoutState !== "idle") return;

        setCheckoutState("processing");
        setCheckoutError(null);

        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderType,
                    lines: cartItems.map(({ item, qty }) => ({
                        menuItemId: item.id,
                        qty,
                        unitPrice: Number(item.price),
                    })),
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.error ?? `Order failed (${res.status})`);
            }

            const order = await res.json();

            setCheckoutState("success");
            setTimeout(() => {
                setCheckoutState("idle");
                onClearCart();
                setOrderNumber(order.ticketNo);
                onClose?.();
            }, 1500);
        } catch (err) {
            console.error("Checkout failed:", err);
            setCheckoutError(err instanceof Error ? err.message : "Something went wrong");
            setCheckoutState("idle");
        }
    };

    return (
        <div className="flex h-full w-full shrink-0 flex-col bg-neutral-950 p-6 text-neutral-50 md:w-96">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <div className="text-lg font-bold">Current Order</div>
                    <div className="mt-0.5 text-xs text-neutral-400">
                        TICKET #{String(orderNumber).padStart(4, "0")}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ShoppingBag size={20} strokeWidth={1.6} className="text-neutral-400" />
                    {onClose && (
                        <button
                            onClick={onClose}
                            aria-label="Close order panel"
                            className="rounded-md p-1 text-neutral-400 transition hover:text-neutral-50 lg:hidden"
                        >
                            <X size={20} strokeWidth={1.8} />
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-4 flex rounded-lg bg-neutral-900 p-1">
                {(["Dine In", "Takeaway"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setOrderType(t)}
                        className={`flex-1 rounded-md py-2 text-xs font-semibold transition ${orderType === t
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
                                <div className="mt-0.5 text-xs text-neutral-400">{item.price} each</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onChangeQty(item.id, -1)}
                                    className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-700 text-neutral-50 transition hover:bg-neutral-800 active:scale-90"
                                >
                                    <Minus size={12} strokeWidth={2} />
                                </button>
                                <div className="w-4 text-center text-sm">{qty}</div>
                                <button
                                    onClick={() => onChangeQty(item.id, 1)}
                                    className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-700 text-neutral-50 transition hover:bg-neutral-800 active:scale-90"
                                >
                                    <Plus size={12} strokeWidth={2} />
                                </button>
                            </div>

                            <button
                                onClick={() => onRemoveItem(item.id)}
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
                    <span>{subtotal}</span>
                </div>
                {/* <div className="mb-1.5 flex justify-between text-sm text-neutral-400">
            <span>Tax (8%)</span>
            <span>{tax}</span>
          </div> */}
                <div className="mt-2 flex justify-between border-t border-neutral-800 pt-2.5 text-base font-bold">
                    <span>Total</span>
                    <span>{total}</span>
                </div>

                <div className="mt-4 flex gap-2.5">
                    <button
                        onClick={onClearCart}
                        disabled={cartItems.length === 0}
                        className="rounded-lg border border-neutral-800 px-4 text-sm font-semibold text-neutral-400 transition hover:border-neutral-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleCheckout}
                        disabled={cartItems.length === 0 || checkoutState !== "idle"}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${checkoutState === "success"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 text-neutral-900 hover:bg-amber-400"
                            }`}
                    >
                        {checkoutState === "idle" && `Charge ${total}`}
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
                {checkoutError && (
                    <div className="mt-2 text-xs text-red-400">{checkoutError}</div>
                )}
            </div>
        </div>
    )
}

export default CurrentOrder