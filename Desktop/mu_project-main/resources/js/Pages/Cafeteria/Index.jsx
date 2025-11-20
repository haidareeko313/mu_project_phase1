// React & Inertia imports
import React, { useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// helper: money
const money = (n) => Number(n || 0).toFixed(2);

const SORT_OPTIONS = [
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];

export default function CafeteriaIndex({ items = [], qrUrl = null }) {
  const { flash } = usePage().props;

  // ----------------------- CART STATE -------------------------------
  const [cart, setCart] = useState({});
  const add = (mi) =>
    setCart((c) => {
      const n = { ...c };
      n[mi.id] =
        n[mi.id] || { id: mi.id, name: mi.name, price: mi.price, qty: 0 };
      n[mi.id].qty += 1;
      return n;
    });
  const inc = (id) =>
    setCart((c) => ({
      ...c,
      [id]: { ...c[id], qty: c[id].qty + 1 },
    }));
  const dec = (id) =>
    setCart((c) => ({
      ...c,
      [id]: { ...c[id], qty: Math.max(1, c[id].qty - 1) },
    }));
  const clear = () => setCart({});

  const list = useMemo(() => Object.values(cart).filter((x) => x.qty > 0), [cart]);
  const total = useMemo(
    () => list.reduce((s, it) => s + it.price * it.qty, 0),
    [list]
  );

  // -------------------- PAYMENT METHOD ------------------------------
  const [method, setMethod] = useState("CASH"); // "CASH" | "QR"

  // -------------------- MENU SEARCH + SORT --------------------------
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("price-asc");
  const [sortOpen, setSortOpen] = useState(false);

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort";

  const filteredItems = useMemo(() => {
    let list = [...items];

    // Filter by search
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      list = list.filter((mi) => mi.name?.toLowerCase().includes(q));
    }

    // Sort (available items first, then out-of-stock)
    list.sort((a, b) => {
      const aOut =
        (a.stock_qty ?? 0) <= 0 || (a.is_active === false && a.is_active !== null);
      const bOut =
        (b.stock_qty ?? 0) <= 0 || (b.is_active === false && b.is_active !== null);

      if (aOut && !bOut) return 1;
      if (!aOut && bOut) return -1;

      switch (sortBy) {
        case "price-asc":
          return Number(a.price) - Number(b.price);
        case "price-desc":
          return Number(b.price) - Number(a.price);
        case "name-asc":
          return String(a.name).localeCompare(String(b.name));
        case "name-desc":
          return String(b.name).localeCompare(String(a.name));
        default:
          return 0;
      }
    });

    return list;
  }, [items, search, sortBy]);

  // ---------------------- PLACE ORDER -------------------------------
  const placeOrder = () => {
    if (!list.length) return;
    router.post(
      "/orders",
      {
        method,
        items: list.map((x) => ({ id: x.id, qty: x.qty })),
      },
      { preserveScroll: true, onSuccess: () => clear() }
    );
  };

  // --------------------------- RENDER -------------------------------
  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold text-gray-100">Cafeteria</h2>}
    >
      <Head title="Cafeteria" />

      {/* Alerts */}
      {flash?.error && (
        <div className="mb-4 rounded border border-red-700 bg-red-900/30 px-4 py-2 text-red-300">
          {flash.error}
        </div>
      )}
      {flash?.success && (
        <div className="mb-4 rounded border border-green-700 bg-green-900/30 px-4 py-2 text-green-300">
          {flash.success}
        </div>
      )}

      {/* Order banner + show pickup code when CASH */}
      {(flash?.last_order_id || flash?.pickup_code) && (
        <div className="mb-4 rounded border border-amber-600 bg-amber-900/30 px-4 py-3 text-amber-200">
          <div className="font-semibold">
            Order #{flash.last_order_id ?? "—"} created.
          </div>
          {flash?.pickup_code && (
            <div className="mt-1">
              <span className="text-amber-300">Pickup code:</span>{" "}
              <span className="font-mono text-lg tracking-widest">
                {flash.pickup_code}
              </span>
            </div>
          )}
          <div className="mt-1 text-sm">
            Show this code at the counter for cash payment.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MENU */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4 shadow-lg shadow-black/50 backdrop-blur">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-100">Menu</h3>
                <p className="text-xs text-slate-400">
                  Search, sort, and pick your items.
                </p>
              </div>

              {/* Search + Sort bar */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full rounded-full border border-slate-600 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 shadow-inner shadow-black/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                  />
                  <span className="pointer-events-none absolute left-2.5 top-1.5 text-xs text-slate-500">
                    🔍
                  </span>
                </div>

                {/* Sort dropdown (single button) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortOpen((o) => !o)}
                    className="flex items-center gap-1 rounded-full border border-slate-600 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-100 shadow-sm shadow-black/40 hover:border-indigo-500 hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">
                      Sort by
                    </span>
                    <span className="font-medium">{sortLabel}</span>
                    <span className="ml-1 text-[10px] text-slate-400">▾</span>
                  </button>

                  {sortOpen && (
                    <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 shadow-xl shadow-black/60">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.value);
                            setSortOpen(false);
                          }}
                          className={`block w-full px-3 py-2 text-left text-xs transition ${
                            sortBy === opt.value
                              ? "bg-indigo-600/90 text-white"
                              : "bg-transparent text-slate-100 hover:bg-slate-800"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!items.length ? (
              <div className="text-slate-400">No items available.</div>
            ) : filteredItems.length ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {filteredItems.map((mi) => {
                  const src = mi.image
                    ? String(mi.image).startsWith("http")
                      ? String(mi.image)
                      : `/storage/${String(mi.image).replace(/^\/+/, "")}`
                    : null;

                  const out =
                    (mi.stock_qty ?? 0) <= 0 ||
                    (mi.is_active === false && mi.is_active !== null);

                  return (
                    <div
                      key={mi.id}
                      className={`group relative overflow-hidden rounded-2xl border bg-slate-950/80 shadow-md shadow-black/60 transition duration-200 ${
                        out
                          ? "cursor-not-allowed border-slate-800 opacity-40 grayscale"
                          : "border-slate-700/70 hover:-translate-y-1 hover:border-indigo-500/80 hover:shadow-2xl hover:shadow-indigo-900/60"
                      }`}
                    >
                      {/* top gradient accent */}
                      {!out && (
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      )}

                      {src ? (
                        <div className="overflow-hidden">
                          <img
                            src={src}
                            alt={mi.name}
                            className={`h-40 w-full object-cover transition duration-300 ${
                              out ? "" : "group-hover:scale-105"
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="h-40 w-full bg-slate-900/80" />
                      )}

                      {/* OUT OF STOCK / INACTIVE BADGE */}
                      {out && (
                        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                          <div className="rounded-full border border-red-700 bg-red-900/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-200 shadow-lg">
                            Out of stock
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-50">
                              {mi.name}
                            </div>
                          </div>

                          <div className="rounded-full bg-slate-900/90 px-2 py-0.5 text-xs font-semibold text-emerald-300 shadow-inner shadow-black/50">
                            ${money(mi.price)}
                          </div>
                        </div>

                        <button
                          onClick={() => !out && add(mi)}
                          disabled={out}
                          className={`mt-1 inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition ${
                            out
                              ? "cursor-not-allowed bg-slate-800 text-slate-500 shadow-none"
                              : "bg-indigo-600 text-white shadow-indigo-900/70 hover:bg-indigo-500"
                          }`}
                        >
                          {out ? (
                            "Unavailable"
                          ) : (
                            <>
                              <span className="text-sm">＋</span>
                              <span>Add to cart</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-400">
                No items match your search or sort selection.
              </div>
            )}
          </div>
        </div>

        {/* CART + PAYMENT */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/95 p-4 shadow-lg shadow-black/60">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold text-slate-100">Your Order</div>
              {list.length > 0 && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                  {list.length} item{list.length !== 1 && "s"}
                </span>
              )}
            </div>

            <div className="mb-2 text-xs text-slate-300">PAYMENT METHOD</div>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setMethod("QR")}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm ${
                  method === "QR"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/60"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                QR
              </button>
              <button
                onClick={() => setMethod("CASH")}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm ${
                  method === "CASH"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/60"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                Cash
              </button>
            </div>

            {!list.length ? (
              <div className="text-slate-500">No items selected yet.</div>
            ) : (
              <div className="space-y-3">
                {list.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between rounded-lg bg-slate-900/80 px-2 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm text-slate-100">
                        {it.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {it.qty} × {money(it.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dec(it.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-sm text-slate-100 hover:bg-slate-700"
                      >
                        −
                      </button>
                      <div className="w-6 text-center text-slate-100">
                        {it.qty}
                      </div>
                      <button
                        onClick={() => inc(it.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-sm text-slate-100 hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-3">
              <div className="text-sm font-semibold text-slate-200">Total</div>
              <div className="text-lg font-bold text-emerald-300">
                ${money(total)}
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={placeOrder}
                disabled={!list.length}
                className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-900/70 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Place Order
              </button>
              <button
                onClick={clear}
                className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Payment QR card */}
          <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-950/95 p-4 shadow-lg shadow-black/60">
            <div className="mb-2 font-semibold text-slate-100">Pay by QR</div>
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Payment QR"
                className="max-w-full rounded border border-slate-700 object-contain"
              />
            ) : (
              <div className="text-slate-500">QR not uploaded by admin.</div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
