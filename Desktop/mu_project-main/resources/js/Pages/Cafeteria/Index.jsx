// React & Inertia imports
import React, { useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// helper: money
const money = (n) => Number(n || 0).toFixed(2);

export default function CafeteriaIndex({ items = [], qrUrl = null }) {
  const { flash } = usePage().props;

  // ----------------------- CART STATE -------------------------------
  const [cart, setCart] = useState({});
  const add = (mi) =>
    setCart((c) => {
      const n = { ...c };
      n[mi.id] = n[mi.id] || { id: mi.id, name: mi.name, price: mi.price, qty: 0 };
      n[mi.id].qty += 1;
      return n;
    });
  const inc = (id) => setCart((c) => ({ ...c, [id]: { ...c[id], qty: c[id].qty + 1 } }));
  const dec = (id) => setCart((c) => ({ ...c, [id]: { ...c[id], qty: Math.max(1, c[id].qty - 1) } }));
  const clear = () => setCart({});

  const list  = useMemo(() => Object.values(cart).filter((x) => x.qty > 0), [cart]);
  const total = useMemo(() => list.reduce((s, it) => s + it.price * it.qty, 0), [list]);

  // -------------------- PAYMENT METHOD ------------------------------
  // Default to CASH so a 4-digit code is generated and flashed
  const [method, setMethod] = useState("CASH"); // "CASH" | "QR"

  // ---------------------- PLACE ORDER -------------------------------
  const placeOrder = () => {
    if (!list.length) return;
    router.post(
      "/orders",
      {
        method, // send uppercase "CASH" | "QR"
        items: list.map((x) => ({ id: x.id, qty: x.qty })),
      },
      { preserveScroll: true, onSuccess: () => clear() }
    );
  };

  // --------------------------- RENDER -------------------------------
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Cafeteria</h2>}>
      <Head title="Cafeteria" />

      {/* Alerts */}
      {flash?.error && (
        <div className="mb-4 rounded bg-red-900/30 text-red-300 px-4 py-2 border border-red-700">{flash.error}</div>
      )}
      {flash?.success && (
        <div className="mb-4 rounded bg-green-900/30 text-green-300 px-4 py-2 border border-green-700">{flash.success}</div>
      )}

      {/* Order banner + show pickup code when CASH */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MENU */}
        <div className="lg:col-span-2">
          <div className="rounded border border-slate-700 bg-slate-800 p-4">
            <h3 className="font-semibold text-slate-100 mb-3">Menu</h3>

            {!items.length ? (
              <div className="text-slate-400">No items available.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {items.map((mi) => {
                  const src = mi.image
                    ? (String(mi.image).startsWith("http")
                        ? String(mi.image)
                        : `/storage/${String(mi.image).replace(/^\/+/, "")}`)
                    : null;

                  return (
                    <div key={mi.id} className="rounded border border-slate-700 overflow-hidden bg-slate-900">
                      {src ? (
                        <img src={src} alt={mi.name} className="w-full h-36 object-cover" />
                      ) : (
                        <div className="w-full h-36 bg-slate-800" />
                      )}

                      <div className="p-3">
                        <div className="font-medium text-slate-100">{mi.name}</div>
                        <div className="mt-1 font-semibold text-slate-200">${money(mi.price)}</div>
                        <button
                          onClick={() => add(mi)}
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

        {/* CART + PAYMENT */}
        <div className="lg:col-span-1">
          <div className="rounded border border-slate-700 bg-slate-800 p-4">
            <div className="font-semibold text-slate-100 mb-2">Your Order</div>

            <div className="text-xs text-slate-300 mb-2">PAYMENT METHOD</div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMethod("QR")}
                className={`px-3 py-1.5 rounded ${
                  method === "QR" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                QR
              </button>
              <button
                onClick={() => setMethod("CASH")}
                className={`px-3 py-1.5 rounded ${
                  method === "CASH" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                Cash
              </button>
            </div>

            {!list.length ? (
              <div className="text-slate-400">No items selected.</div>
            ) : (
              <div className="space-y-3">
                {list.map((it) => (
                  <div key={it.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-slate-100 truncate">{it.name}</div>
                      <div className="text-xs text-slate-400">
                        {it.qty} × {money(it.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => dec(it.id)} className="px-2 h-7 rounded bg-slate-700 text-slate-100">−</button>
                      <div className="w-6 text-center text-slate-100">{it.qty}</div>
                      <button onClick={() => inc(it.id)} className="px-2 h-7 rounded bg-slate-700 text-slate-100">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-slate-700 pt-3 flex items-center justify-between">
              <div className="text-slate-200 font-semibold">Total</div>
              <div className="text-slate-100 font-bold">${money(total)}</div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={placeOrder}
                disabled={!list.length}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                Place Order
              </button>
              <button onClick={clear} className="px-4 py-2 rounded bg-slate-700 text-slate-100 hover:bg-slate-600">
                Clear
              </button>
            </div>
          </div>

          {/* Payment QR card */}
          <div className="mt-4 rounded border border-slate-700 bg-slate-800 p-4">
            <div className="font-semibold text-slate-100 mb-2">Pay by QR</div>
            {qrUrl ? (
              <img src={qrUrl} alt="Payment QR" className="rounded border border-slate-700 max-w-full object-contain" />
            ) : (
              <div className="text-slate-400">QR not uploaded by admin.</div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
