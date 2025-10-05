import React from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function OrdersIndex({ orders }) {
  const rows = orders?.data ?? [];

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Orders</h2>}>
      <Head title="Orders" />
      <div className="rounded border border-slate-700 bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/40 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left w-16">#</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Items</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Paid</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-slate-100">
              {!rows.length && (
                <tr>
                  <td colSpan="7" className="px-3 py-6 text-center text-slate-400">
                    No orders.
                  </td>
                </tr>
              )}
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="px-3 py-2">{o.id}</td>
                  <td className="px-3 py-2">{o.user || "-"}</td>
                  <td className="px-3 py-2">
                    {(o.items || [])
                      .map((i) => `${i.name} × ${i.qty}`)
                      .join(", ") || "-"}
                  </td>
                  <td className="px-3 py-2 capitalize">{o.status}</td>
                  <td className="px-3 py-2">{o.is_paid ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{o.method}</td>
                  <td className="px-3 py-2">{o.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3 border-t border-slate-700 text-slate-300">
          <div>
            Page {orders.current_page} of {orders.last_page}
          </div>
          <div className="space-x-2">
            {orders.prev_page_url && (
              <Link
                href={orders.prev_page_url}
                className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
              >
                Prev
              </Link>
            )}
            {orders.next_page_url && (
              <Link
                href={orders.next_page_url}
                className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
