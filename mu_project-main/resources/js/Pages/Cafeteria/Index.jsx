import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function CafeteriaIndex({ stats, menuItems }) {
  const money = (n) => `$${Number(n ?? 0).toFixed(2)}`;

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>}
    >
      <Head title="Dashboard" />

      {/* Top stats — same figures as Payments page */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Orders</div>
          <div className="mt-2 text-2xl font-semibold">{stats.orders_count}</div>
          <div className="mt-2 text-xs text-amber-600">
            Low stock items: {stats.low_stock_count}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Cash</div>
          <div className="mt-2 text-2xl font-semibold">{money(stats.cash_total)}</div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">QR</div>
          <div className="mt-2 text-2xl font-semibold">{money(stats.qr_total)}</div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Paid / Unpaid</div>
          <div className="mt-2 text-2xl font-semibold">
            {money(stats.paid_total)} / {money((stats.grand_total ?? 0) - (stats.paid_total ?? 0))}
          </div>
        </div>
      </div>

      {/* Menu items grid */}
      <div className="mt-8">
        <h3 className="mb-3 text-base font-semibold text-gray-800">🍔 Menu Items</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((mi) => (
            <div key={mi.id} className="rounded-lg border bg-white overflow-hidden">
              <div className="aspect-[16/9] bg-gray-50 flex items-center justify-center">
                {mi.image_url ? (
                  <img
                    src={mi.image_url}
                    alt={mi.name}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-gray-400 text-sm">No image</span>
                )}
              </div>
              <div className="p-4">
                <div className="font-medium text-gray-900">{mi.name}</div>
                <div className="text-sm text-gray-600">
                  ${Number(mi.price ?? 0).toFixed(2)} • Stock: {mi.stock}
                </div>
              </div>
            </div>
          ))}

          {menuItems.length === 0 && (
            <div className="col-span-full text-sm text-gray-500">
              No items yet.
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
