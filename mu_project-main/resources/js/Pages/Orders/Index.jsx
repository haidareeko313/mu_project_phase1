import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "picked_up", label: "Picked up" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersIndex({ orders = [], metrics = {} }) {
  const { flash } = usePage().props;

  const handleStatusChange = (orderId, newStatus) => {
    router.patch(
      route("orders.update", orderId),
      { status: newStatus }, // controller already supports this
      {
        preserveScroll: true,
        onSuccess: () => {
          // optional UX feedback
          // toast/sweetalert can go here if you like
        },
      }
    );
  };

  const handleDelete = (orderId) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;

    router.delete(route("orders.destroy", orderId), {
      preserveScroll: true,
      onSuccess: () => {
        // optional UX feedback
      },
    });
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Orders</h2>}
    >
      <Head title="Orders" />

      <div className="space-y-6">
        {/* Top cards / metrics (optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">Total Orders</div>
            <div className="mt-1 text-2xl font-semibold">{metrics?.count ?? orders.length}</div>
          </div>
        </div>

        {/* Flash message (optional) */}
        {flash?.success && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-800">
            {flash.success}
          </div>
        )}

        {/* Orders table */}
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}

              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">#{order.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {order.user?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      className="block w-44 rounded-md border-gray-300 text-sm"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.is_paid ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Unpaid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
