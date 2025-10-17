import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function InventoryIndex({ logs }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Inventory Logs</h2>}>
      <Head title="Inventory Logs" />
      <div className="p-4">
        <div className="overflow-x-auto rounded border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800/60 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-left">Change</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs?.data?.map((row) => (
                <tr key={row.id} className="hover:bg-slate-900/60">
                  <td className="px-3 py-2">{row.id}</td>
                  <td className="px-3 py-2">
                    {row.menu_item?.name ?? "-"}
                  </td>
                  <td className="px-3 py-2">{row.quantity_changed}</td>
                  <td className="px-3 py-2">{row.action}</td>
                  <td className="px-3 py-2">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!logs?.data || logs.data.length === 0) && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-400" colSpan={5}>
                    No logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
