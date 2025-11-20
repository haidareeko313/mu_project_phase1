import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const statusOptions = [
  { value: "any", label: "Any status" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

const paidOptions = [
  { value: "any", label: "Any" },
  { value: "yes", label: "Paid" },
  { value: "no", label: "Unpaid" },
];

const methodOptions = [
  { value: "any", label: "Any method" },
  { value: "CASH", label: "Cash" },
  { value: "QR", label: "QR" },
];

function DropdownFilter({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const currentLabel =
    options.find((opt) => opt.value === value)?.label || label;

  return (
    <div className="relative text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full border border-slate-600 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-100 shadow-sm shadow-black/40 hover:border-indigo-500 hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
      >
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <span className="font-medium truncate max-w-[120px]">{currentLabel}</span>
        <span className="ml-1 text-[10px] text-slate-400">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 shadow-xl shadow-black/60">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-xs transition ${
                value === opt.value
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
  );
}

export default function OrdersIndex() {
  const { orders, filters = {} } = usePage().props;

  const [q, setQ] = useState(filters.q ?? "");
  const [status, setStatus] = useState(filters.status ?? "any");
  const [paid, setPaid] = useState(filters.paid ?? "any");
  const [method, setMethod] = useState(filters.method ?? "any");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");

  const applyFilters = (e) => {
    e?.preventDefault?.();

    router.get(
      "/orders",
      {
        q,
        status,
        paid,
        method,
        from,
        to,
      },
      {
        preserveState: true,
        replace: true,
      }
    );
  };

  const resetFilters = () => {
    setQ("");
    setStatus("any");
    setPaid("any");
    setMethod("any");
    setFrom("");
    setTo("");
    router.get(
      "/orders",
      {},
      {
        preserveState: false,
        replace: true,
      }
    );
  };

  const badgeForStatus = (s) => {
    const value = (s || "").toLowerCase();
    if (value === "completed") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-900/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
          ● Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-900/40 px-2 py-0.5 text-[11px] font-medium text-amber-200">
        ● Pending
      </span>
    );
  };

  const badgeForPaid = (p) => {
    if ((p || "").toLowerCase() === "yes") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-900/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
          Yes
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
        No
      </span>
    );
  };

  const badgeForMethod = (m) => {
    if (m === "QR") {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-900/40 px-2 py-0.5 text-[11px] font-medium text-sky-300">
          QR
        </span>
      );
    }
    if (m === "CASH") {
      return (
        <span className="inline-flex items-center rounded-full bg-indigo-900/40 px-2 py-0.5 text-[11px] font-medium text-indigo-200">
          Cash
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
        —
      </span>
    );
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold text-gray-100">Cafeteria – Orders</h2>}
    >
      <Head title="Orders" />

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4 shadow-lg shadow-black/50 backdrop-blur">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Orders</h3>
              <p className="text-xs text-slate-400">
                Filter and review all cafeteria orders.
              </p>
            </div>
          </div>

          {/* Filters bar */}
          <form
            onSubmit={applyFilters}
            className="mb-4 flex flex-col gap-3 rounded-xl bg-slate-950/80 p-3 border border-slate-800/80"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Left: search */}
              <div className="flex flex-1 items-center gap-2">
                <div className="relative w-full max-w-sm">
                  <input
                    type="text"
                    placeholder="email or #id..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full rounded-full border border-slate-600 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 shadow-inner shadow-black/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                  />
                  <span className="pointer-events-none absolute left-2.5 top-1.5 text-xs text-slate-500">
                    🔍
                  </span>
                </div>

                {/* Status dropdown */}
                <DropdownFilter
                  label="Status"
                  value={status}
                  options={statusOptions}
                  onChange={setStatus}
                />

                {/* Paid dropdown */}
                <DropdownFilter
                  label="Paid"
                  value={paid}
                  options={paidOptions}
                  onChange={setPaid}
                />

                {/* Method dropdown */}
                <DropdownFilter
                  label="Method"
                  value={method}
                  options={methodOptions}
                  onChange={setMethod}
                />
              </div>

              {/* Right: dates + buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">From</span>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="rounded-full border border-slate-600 bg-slate-950/80 px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">To</span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="rounded-full border border-slate-600 bg-slate-950/80 px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-900/70 hover:bg-indigo-500"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-700"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>

          {/* Orders table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90">
                  <th className="px-4 py-3 font-semibold text-slate-400">#</th>
                  <th className="px-4 py-3 font-semibold text-slate-400">User</th>
                  <th className="px-4 py-3 font-semibold text-slate-400">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-400">Paid</th>
                  <th className="px-4 py-3 font-semibold text-slate-400">Method</th>
                  <th className="px-4 py-3 font-semibold text-slate-400">
                    Pickup code
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      No orders found with the current filters.
                    </td>
                  </tr>
                ) : (
                  orders.data.map((o, idx) => (
                    <tr
                      key={o.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/60"
                    >
                      <td className="whitespace-nowrap px-4 py-2 text-slate-200">
                        #{o.id}
                      </td>
                      <td className="max-w-xs px-4 py-2 text-slate-200">
                        <span className="truncate">{o.user}</span>
                      </td>
                      <td className="px-4 py-2">{badgeForStatus(o.status)}</td>
                      <td className="px-4 py-2">{badgeForPaid(o.paid)}</td>
                      <td className="px-4 py-2">{badgeForMethod(o.method)}</td>
                      <td className="px-4 py-2 text-slate-300">
                        {o.cash_code && o.cash_code !== "—" ? (
                          <span className="font-mono text-[11px] tracking-widest text-slate-100">
                            {o.cash_code}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-300">
                        {o.created}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {orders.links && orders.links.length > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div>
                Page{" "}
                <span className="text-slate-200">
                  {orders.current_page}
                </span>{" "}
                of{" "}
                <span className="text-slate-200">
                  {orders.last_page}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {orders.links.map((link, i) => (
                  <Link
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    href={link.url || "#"}
                    preserveState
                    preserveScroll
                    className={`rounded-full px-3 py-1 text-xs ${
                      link.active
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/70"
                        : link.url
                        ? "bg-slate-900 text-slate-200 hover:bg-slate-800"
                        : "bg-transparent text-slate-600"
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
