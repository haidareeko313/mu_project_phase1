import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

function currency(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

const fallback =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'>
       <rect width='100%' height='100%' fill='#f3f4f6'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#9ca3af' font-family='sans-serif' font-size='14'>
         No image
       </text>
     </svg>`
  );

export default function CafeteriaIndex({ cards = {}, menuItems = [] }) {
  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>}
    >
      <Head title="Dashboard" />

      {/* Top cards: Orders, Cash, QR, Paid/Unpaid (replaces 'Revenue') */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Orders</div>
          <div className="mt-2 text-2xl font-semibold">{cards.orders_count ?? 0}</div>
          {cards.low_stock > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              Low stock items: <span className="font-medium">{cards.low_stock}</span>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Cash</div>
          <div className="mt-2 text-2xl font-semibold">
            {currency(cards.cash_total)}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">QR</div>
          <div className="mt-2 text-2xl font-semibold">
            {currency(cards.qr_total)}
          </div>
        </div>

        {/* Replaces the old 'Revenue' card */}
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Paid / Unpaid</div>
          <div className="mt-2 text-2xl font-semibold">
            {currency(cards.paid_total)} <span className="text-gray-400">/</span>{" "}
            {currency(cards.unpaid_total)}
          </div>
        </div>
      </div>

      {/* Menu items grid */}
      <div className="mt-8">
        <h3 className="mb-3 text-lg font-semibold flex items-center gap-2">
          <span>🍔</span> <span>Menu Items</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {menuItems.map((item) => (
            <div key={item.id} className="rounded-xl border bg-white overflow-hidden">
              <div className="aspect-[16/9] bg-gray-100">
                <img
                  src={item.image_url || fallback}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.src = fallback; }}
                />
              </div>
              <div className="p-4">
                <div className="font-medium">{item.name}</div>
                <div className="mt-1 text-sm text-gray-600">
                  {currency(item.price)} • Stock: {item.stock}
                </div>
              </div>
            </div>
          ))}
          {menuItems.length === 0 && (
            <div className="text-sm text-gray-500">No menu items yet.</div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
