import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

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
        <span className="max-w-[120px] truncate font-medium">
          {currentLabel}
        </span>
        <span className="ml-1 text-[10px] text-slate-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 shadow-xl shadow-black/60">
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

export default function InventoryLogsIndex() {
  const { logs, filters = {} } = usePage().props;

  const [q, setQ] = useState(filters.q ?? "");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const [typeFilter, setTypeFilter] = useState(filters.type ?? "any");
  const [directionFilter, setDirectionFilter] = useState(
    filters.direction ?? "any"
  );

  const applyFilters = (e) => {
    e?.preventDefault?.();
    router.get(
      "/inventory-logs",
      {
        q,
        from,
        to,
        type: typeFilter,
        direction: directionFilter,
      },
      { preserveState: true, replace: true }
    );
  };

  const resetFilters = () => {
    setQ("");
    setFrom("");
    setTo("");
    setTypeFilter("any");
    setDirectionFilter("any");
    router.get("/inventory-logs", {}, { preserveState: false, replace: true });
  };

  const formatDelta = (log) => {
    const n = Number(log.quantity_changed || 0);

    if (n > 0) {
      return {
        label: `+${n}`,
        className:
          "inline-flex items-center rounded-full bg-emerald-900/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300",
        icon: "▲",
      };
    }
    if (n < 0) {
      return {
        label: `${n}`,
        className:
          "inline-flex items-center rounded-full bg-red-900/40 px-2 py-0.5 text-[11px] font-medium text-red-300",
        icon: "▼",
      };
    }
    return {
      label: "0",
      className:
        "inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300",
      icon: "•",
    };
  };

  const typeBadge = (action) => {
    const a = (action || "").toLowerCase();
    if (a === "order") {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-900/40 px-2 py-0.5 text-[11px] font-medium text-sky-300">
          Order
        </span>
      );
    }
    if (a === "adjustment") {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-900/40 px-2 py-0.5 text-[11px] font-medium text-amber-200">
          Manual adjustment
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
        {action || "—"}
      </span>
    );
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold text-gray-100">
          Cafeteria – Inventory Logs
        </h2>
      }
    >
      <Head title="Inventory Logs" />

      <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4 shadow-lg shadow-black/50 backdrop-blur">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Logs</h3>
            <p className="text-xs text-slate-400">
              Detailed history of stock changes for every menu item.
            </p>
          </div>
        </div>

        {/* FILTER BAR */}
        <form
          onSubmit={applyFilters}
          className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3"
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {/* Left: search + dropdowns */}
            <div className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative w-full max-w-sm">
                <input
                  type="text"
                  placeholder="email, item, #id..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-full border border-slate-600 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 shadow-inner shadow-black/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                />
                <span className="pointer-events-none absolute left-2.5 top-1.5 text-xs text-slate-500">
                  🔍
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <DropdownFilter
                  label="Type"
                  value={typeFilter}
                  options={[
                    { value: "any", label: "Any type" },
                    { value: "order", label: "Orders" },
                    { value: "adjustment", label: "Manual adjustments" },
                  ]}
                  onChange={setTypeFilter}
                />

                <DropdownFilter
                  label="Change"
                  value={directionFilter}
                  options={[
                    { value: "any", label: "Any change" },
                    { value: "up", label: "Increases only" },
                    { value: "down", label: "Decreases only" },
                  ]}
                  onChange={setDirectionFilter}
                />
              </div>
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

        {/* TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90">
                <th className="px-4 py-3 font-semibold text-slate-400">#</th>
                <th className="px-4 py-3 font-semibold text-slate-400">User</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Item</th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  Change
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  Type
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  Stock after
                </th>

                <th className="px-4 py-3 font-semibold text-slate-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No inventory activity for this period.
                  </td>
                </tr>
              ) : (
                logs.data.map((log) => {
                  const delta = formatDelta(log);

                  return (
                    <tr
                      key={log.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/60"
                    >
                      <td className="whitespace-nowrap px-4 py-2 text-slate-200">
                        #{log.id}
                      </td>
                      <td className="max-w-xs px-4 py-2 text-slate-200">
                        <span className="truncate">{log.user ?? "—"}</span>
                      </td>
                      <td className="max-w-xs px-4 py-2 text-slate-100">
                        <span className="truncate">{log.item ?? "—"}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={delta.className}>
                          <span className="mr-1 text-[9px]">{delta.icon}</span>
                          {delta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2">{typeBadge(log.action)}</td>
                      <td className="px-4 py-2 text-slate-200">
                        {log.stock_after ?? "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2 text-slate-300">
                        {log.created}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {logs.links && logs.links.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div>
              Page{" "}
              <span className="text-slate-200">{logs.current_page}</span> of{" "}
              <span className="text-slate-200">{logs.last_page}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {logs.links.map((link, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Link
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
    </AuthenticatedLayout>
  );
}
