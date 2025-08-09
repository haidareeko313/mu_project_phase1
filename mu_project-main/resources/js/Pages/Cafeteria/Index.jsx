import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Index({ menuItems, metrics }) {
  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight">Admin Dashboard</h2>}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Quick metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">Orders</div>
            <div className="text-2xl font-semibold">{metrics.total_orders ?? 0}</div>
          </div>
          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">Revenue</div>
            <div className="text-2xl font-semibold">${Number(metrics.total_revenue ?? 0).toFixed(2)}</div>
          </div>
          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">Payments</div>
            <div className="text-sm">Cash: ${Number(metrics.cash_payments ?? 0).toFixed(2)}</div>
            <div className="text-sm">QR: ${Number(metrics.qr_payments ?? 0).toFixed(2)}</div>
          </div>
        </div>

        {/* Menu list */}
        <section>
          <h3 className="mb-3 text-lg font-semibold">🍔 Menu Items</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className="rounded border overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-36 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-3">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    ${Number(item.price).toFixed(2)} • Stock: {item.stock}
                  </div>
                </div>
              </div>
            ))}

            {menuItems.length === 0 && (
              <div className="text-gray-500">No items yet.</div>
            )}
          </div>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
