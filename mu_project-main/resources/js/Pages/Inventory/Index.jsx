import React, { useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

function Th({ label, sortKey, sort, dir, onSort }) {
  const active = sort === sortKey;
  const arrow = active ? (dir === "asc" ? "▲" : "▼") : "⇅";
  return (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none"
      onClick={() => onSort(sortKey)}
      title="Sort"
    >
      <span className="inline-flex items-center gap-1">
        {label} <span className="text-gray-400">{arrow}</span>
      </span>
    </th>
  );
}

function Pagination({ paginator }) {
  if (!paginator || !paginator.links || paginator.links.length <= 3) return null;

  return (
    <nav className="mt-4 flex flex-wrap gap-1">
      {paginator.links.map((link, idx) => (
        <button
          key={idx}
          disabled={!link.url}
          onClick={() => link.url && router.visit(link.url, { preserveState: true })}
          className={[
            "px-3 py-1.5 rounded border text-sm",
            link.active
              ? "bg-indigo-600 text-white border-indigo-600"
              : link.url
              ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed",
          ].join(" ")}
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      ))}
    </nav>
  );
}

export default function InventoryIndex() {
  const { props } = usePage();
  const logs = props.logs;
  const filters = props.filters || {};
  const reasons = props.reasons || [];

  const [state, setState] = useState({
    search: filters.search ?? "",
    reason: filters.reason ?? "",
    from: filters.from ?? "",
    to: filters.to ?? "",
    per_page: Number(filters.per_page ?? 25),
    sort: filters.sort ?? "id",
    dir: filters.dir ?? "asc",
  });

  const apply = (extra = {}) => {
    const query = { ...state, ...extra };
    query.per_page = Number(query.per_page) || 25;

    router.get(route("inventory.index"), query, {
      preserveState: true,
      replace: true,
    });
  };

  const reset = () => {
    router.get(route("inventory.index"), {}, { replace: true });
  };

  const onSort = (key) => {
    const nextDir = state.sort === key && state.dir === "asc" ? "desc" : "asc";
    setState((s) => ({ ...s, sort: key, dir: nextDir }));
    apply({ sort: key, dir: nextDir });
  };

  const onDelete = (id) => {
    if (!confirm("Delete this log entry?")) return;
    router.delete(route("inventory.destroy", id), {
      preserveScroll: true,
    });
  };

  const totalChange = useMemo(
    () => (logs?.data || []).reduce((acc, l) => acc + Number(l.change || 0), 0),
    [logs]
  );

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold text-gray-800">📦 Inventory Logs</h2>}
    >
      <Head title="Inventory Logs" />

      {/* Filters */}
      <div className="mb-4 rounded-lg border bg-white">
        <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search Item</label>
            <input
              type="text"
              value={state.search}
              onChange={(e) => setState((s) => ({ ...s, search: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g. Chicken Burger"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <select
              value={state.reason}
              onChange={(e) => setState((s) => ({ ...s, reason: e.target.value }))}
              className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">From</label>
            <input
              type="date"
              value={state.from || ""}
              onChange={(e) => setState((s) => ({ ...s, from: e.target.value }))}
              className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">To</label>
            <input
              type="date"
              value={state.to || ""}
              onChange={(e) => setState((s) => ({ ...s, to: e.target.value }))}
              className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Per Page</label>
            <select
              value={state.per_page}
              onChange={(e) =>
                setState((s) => ({ ...s, per_page: Number(e.target.value) }))
              }
              className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => apply()}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Apply
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <div className="ml-auto text-sm text-gray-500">
            Net change this page:{" "}
            <span className={totalChange < 0 ? "text-red-600" : "text-green-600"}>
              {totalChange}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th label="ID"     sortKey="id"     sort={filters.sort} dir={filters.dir} onSort={onSort} />
              <Th label="Item"   sortKey="item"   sort={filters.sort} dir={filters.dir} onSort={onSort} />
              <Th label="Change" sortKey="change" sort={filters.sort} dir={filters.dir} onSort={onSort} />
              <Th label="Reason" sortKey="reason" sort={filters.sort} dir={filters.dir} onSort={onSort} />
              <Th label="Date"   sortKey="date"   sort={filters.sort} dir={filters.dir} onSort={onSort} />
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {(logs?.data || []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  No logs found.
                </td>
              </tr>
            )}

            {(logs?.data || []).map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">{row.id}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{row.item}</td>
                <td
                  className={[
                    "px-4 py-3 text-sm font-medium",
                    Number(row.change) < 0 ? "text-red-600" : "text-green-700",
                  ].join(" ")}
                >
                  {row.change}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{row.reason}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {row.date ? new Date(row.date).toLocaleString() : ""}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button
                    onClick={() => onDelete(row.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 pb-4">
          <Pagination paginator={logs} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
