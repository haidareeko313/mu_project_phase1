// React & Inertia imports
import React, { useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// ----- helper: format a number as money with 2 decimals -----
const money = (n) => Number(n || 0).toFixed(2);

// ===================================================================
//  PAGE: CafeteriaIndex
//  Props:
//    - items: array of menu items { id, name, price, image? }
//    - qrUrl: string | null (URL to the payment QR image)
// ===================================================================
export default function CafeteriaIndex({ items = [], qrUrl = null }) {
  // Inertia "flash" messages sent from server (success/error + order info)
  const { flash } = usePage().props;

  // ----------------------- CART STATE -------------------------------
  // cart shape: { [id]: { id, name, price, qty } }
  const [cart, setCart] = useState({});

  // Add 1 unit of a menu item to the cart (create entry if missing)
  const add = (mi) =>
    setCart((c) => {
      const n = { ...c };
      n[mi.id] = n[mi.id] || { id: mi.id, name: mi.name, price: mi.price, qty: 0 };
      n[mi.id].qty += 1;
      return n;
    });

  // Increase quantity for a given item id
  const inc = (id) => setCart((c) => ({ ...c, [id]: { ...c[id], qty: c[id].qty + 1 } }));

  // Decrease quantity but never below 1 (keeps an item present once added)
  const dec = (id) => setCart((c) => ({ ...c, [id]: { ...c[id], qty: Math.max(1, c[id].qty - 1) } }));

  // Clear the entire cart
  const clear = () => setCart({});

  // Derived values (memoized so they only recompute when cart changes)
  const list = useMemo(() => Object.values(cart).filter((x) => x.qty > 0), [cart]); // visible cart lines
  const total = useMemo(() => list.reduce((s, it) => s + it.price * it.qty, 0), [list]); // total $

  // -------------------- PAYMENT METHOD STATE ------------------------
  // method: "qr" or "cash" (default to "qr")
  const [method, setMethod] = useState("qr");

  // ---------------------- PLACE ORDER ACTION ------------------------
  // Sends POST /orders via Inertia with method & items, then clears cart
  const placeOrder = () => {
    if (!list.length) return; // ignore empty carts
    router.post(
      "/orders",
      {
        method, // "qr" | "cash"
        items: list.map((x) => ({ id: x.id, qty: x.qty })), // only send id + qty
      },
      { preserveScroll: true, onSuccess: () => clear() } // keep scroll position; clear cart on success
    );
  };

  // --------------------------- RENDER -------------------------------
  return (
    <AuthenticatedLayout
      // Header area of the authenticated layout (edit text/styles here)
      header={<h2 className="text-xl font-semibold text-gray-100">Cafeteria</h2>}
    >
      {/* Browser tab title */}
      <Head title="Cafeteria" />

      {/* ---------- Flash alerts from server ---------- */}
      {flash?.error && (
        <div className="mb-4 rounded bg-red-900/30 text-red-300 px-4 py-2 border border-red-700">
          {flash.error}
        </div>
      )}
      {flash?.success && (
        <div className="mb-4 rounded bg-green-900/30 text-green-300 px-4 py-2 border border-green-700">
          {flash.success}
        </div>
      )}

      {/* Order banner (shown after creating an order) */}
      {(flash?.last_order_id || flash?.pickup_code) && (
        <div className="mb-4 rounded border border-amber-600 bg-amber-900/30 text-amber-200 px-4 py-3">
          <div className="font-semibold">Order #{flash.last_order_id ?? "—"} created.</div>
          {flash?.pickup_code && (
            <div className="mt-1">
              <span className="text-amber-300">Pickup code:</span>{" "}
              <span className="font-mono text-lg tracking-widest">{flash.pickup_code}</span>
            </div>
          )}
          <div className="text-sm mt-1">Show this code at the counter for cash payment.</div>
        </div>
      )}

      {/* ==============================================================
         MAIN GRID LAYOUT (Tailwind)
         - 1 column on small screens
         - 3 columns on large screens (lg)
           * Left (2/3 width): Menu
           * Right (1/3 width): Cart & Payment
         Adjust with: grid-cols-1 / lg:grid-cols-3 / gap-6
         ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================ MENU COLUMN ============================ */}
        {/* Take 2/3 of the width on large screens */}
        <div className="lg:col-span-2">
          <div className="rounded border border-slate-700 bg-slate-800 p-4">
            <h3 className="font-semibold text-slate-100 mb-3">Menu</h3>

            {/* If no items provided */}
            {!items.length ? (
              <div className="text-slate-400">No items available.</div>
            ) : (
              // Card grid of menu items
              // Change columns by editing sm:grid-cols-2 / md:grid-cols-3
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {items.map((mi) => {
                  // Build image URL:
                  // - If image is already an absolute URL (http...), use it.
                  // - Else treat it as a path relative to Laravel's public storage (/storage/*).
                  const src = mi.image
                    ? (String(mi.image).startsWith("http")
                        ? String(mi.image)
                        : `/storage/${String(mi.image).replace(/^\/+/, "")}`)
                    : null;

                  return (
                    <div
                      key={mi.id}
                      className="rounded border border-slate-700 overflow-hidden bg-slate-900"
                    >
                      {/* Image area (fixed height). If no image, show a placeholder box */}
                      {src ? (
                        <img src={src} alt={mi.name} className="w-full h-36 object-cover" />
                      ) : (
                        <div className="w-full h-36 bg-slate-800" />
                      )}

                      {/* Item details + Add button */}
                      <div className="p-3">
                        <div className="font-medium text-slate-100">{mi.name}</div>
                        <div className="mt-1 font-semibold text-slate-200">
                          ${money(mi.price)}
                        </div>
                        <button
                          onClick={() => add(mi)} // add to cart
                          className="mt-2 text-sm px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =========================== CART COLUMN ============================ */}
        <div className="lg:col-span-1">
          {/* ---- Cart + payment card ---- */}
          <div className="rounded border border-slate-700 bg-slate-800 p-4">
            <div className="font-semibold text-slate-100 mb-2">Your Order</div>

            {/* Payment method toggle */}
            <div className="text-xs text-slate-300 mb-2">PAYMENT METHOD</div>
            <div className="flex gap-2 mb-4">
              {/* Select QR */}
              <button
                onClick={() => setMethod("qr")}
                className={`px-3 py-1.5 rounded ${
                  method === "qr"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                QR
              </button>

              {/* Select Cash */}
              <button
                onClick={() => setMethod("cash")}
                className={`px-3 py-1.5 rounded ${
                  method === "cash"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                Cash
              </button>
            </div>

            {/* Cart lines or empty state */}
            {!list.length ? (
              <div className="text-slate-400">No items selected.</div>
            ) : (
              <div className="space-y-3">
                {list.map((it) => (
                  <div key={it.id} className="flex items-center justify-between">
                    {/* Item title + unit price */}
                    <div className="min-w-0">
                      <div className="text-slate-100 truncate">{it.name}</div>
                      <div className="text-xs text-slate-400">
                        {it.qty} × {money(it.price)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dec(it.id)}
                        className="px-2 h-7 rounded bg-slate-700 text-slate-100"
                      >
                        −
                      </button>
                      <div className="w-6 text-center text-slate-100">{it.qty}</div>
                      <button
                        onClick={() => inc(it.id)}
                        className="px-2 h-7 rounded bg-slate-700 text-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total row */}
            <div className="mt-4 border-t border-slate-700 pt-3 flex items-center justify-between">
              <div className="text-slate-200 font-semibold">Total</div>
              <div className="text-slate-100 font-bold">${money(total)}</div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={placeOrder}
                disabled={!list.length}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                Place Order
              </button>
              <button
                onClick={clear}
                className="px-4 py-2 rounded bg-slate-700 text-slate-100 hover:bg-slate-600"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ---- Payment QR card ---- */}
          <div className="mt-4 rounded border border-slate-700 bg-slate-800 p-4">
            <div className="font-semibold text-slate-100 mb-2">Pay by QR</div>

            {/* If qrUrl provided, show image; else show a helpful note */}
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Payment QR"
                className="rounded border border-slate-700 max-w-full object-contain"
              />
            ) : (
              <div className="text-slate-400">QR not uploaded by admin.</div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
