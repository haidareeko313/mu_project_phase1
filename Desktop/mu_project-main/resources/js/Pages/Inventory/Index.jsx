import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

function FilterBar({ initial }) {
  return (
    <form method="get" className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col">
        <label className="text-xs text-slate-400">Search</label>
        <input
          name="q"
          defaultValue={initial?.q || ""}
          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
          placeholder="email, item, #id..."
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-slate-400">From</label>
        <input type="date" name="from" defaultValue={initial?.from || ""} className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-slate-400">To</label>
        <input type="date" name="to" defaultValue={initial?.to || ""} className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100" />
      </div>
      <button className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500">Apply</button>
      <a href={location.pathname} className="px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-600">Reset</a>
    </form>
  );
}

export default function InventoryIndex({ logs, filters }) {
  const rows = Array.isArray(logs?.data) ? logs.data : [];

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Inventory Logs</h2>}>
      <Head title="Inventory Logs" />
      <div className="rounded border border-slate-700 bg-slate-800">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="text-slate-200 font-medium">Logs</div>
          <FilterBar initial={filters ?? {}} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/40 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left w-16">#</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-slate-100">
              {rows.map((l) => (
                <tr key={l.id} className="odd:bg-slate-900/20">
                  <td className="px-3 py-2">#{l.id}</td>
                  <td className="px-3 py-2">{l.user || "—"}</td>
                  <td className="px-3 py-2">{l.item || "—"}</td>
                  <td className="px-3 py-2 text-right">{l.qty ?? 0}</td>
                  <td className="px-3 py-2">{l.created || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 flex gap-2 justify-end border-t border-slate-700">
          {logs?.prev_page_url && (
            <a href={logs.prev_page_url} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100">Prev</a>
          )}
          {logs?.next_page_url && (
            <a href={logs.next_page_url} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100">Next</a>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
