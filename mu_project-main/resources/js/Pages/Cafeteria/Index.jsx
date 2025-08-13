import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
  const { stats = {}, menuItems = [] } = usePage().props;

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold">Cafetería</h2>}
    >
      <Head title="Dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="fx-kpi">
          <div className="fx-kpi-label">Orders</div>
          <div className="fx-kpi-value">{stats.orders_count ?? 0}</div>
          <div className="text-xs fx-muted">Low stock items: {stats.low_stock_count ?? 0}</div>
        </div>

        <div className="fx-kpi">
          <div className="fx-kpi-label">Cash</div>
          <div className="fx-kpi-value">${Number(stats.cash_total ?? 0).toFixed(2)}</div>
        </div>

        <div className="fx-kpi">
          <div className="fx-kpi-label">QR</div>
          <div className="fx-kpi-value">${Number(stats.qr_total ?? 0).toFixed(2)}</div>
        </div>

        <div className="fx-kpi">
          <div className="fx-kpi-label">Paid / Unpaid</div>
          <div className="fx-kpi-value">
            ${Number(stats.paid_total ?? 0).toFixed(2)} / ${Number(stats.grand_total ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      <h3 className="mt-8 mb-3 text-sm font-semibold fx-muted">🍔 Menu Items</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {menuItems.map((mi) => (
          <div key={mi.id} className="fx-card">
            <img
              src={mi.image_url || '/images/placeholder.png'}
              alt={mi.name}
              className="h-44 w-full object-cover rounded-lg mb-3"
              loading="lazy"
              onError={(e) => { e.currentTarget.src = '/images/placeholder.png'; }}
            />
            <div className="text-base font-medium">{mi.name}</div>
            <div className="fx-muted text-sm">${Number(mi.price).toFixed(2)} · Stock: {mi.stock}</div>
          </div>
        ))}
      </div>
    </AuthenticatedLayout>
  );
}
