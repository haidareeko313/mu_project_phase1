import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const FALLBACK_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'>
       <rect width='100%' height='100%' fill='#0f172a'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#94a3b8' font-family='sans-serif' font-size='14'>
         No image
       </text>
     </svg>`
  );

export default function PaymentsReceipts() {
  const { orders = [], totals = {}, qr_public_path = null } = usePage().props;

  const cashTotal = Number(totals?.cash_total ?? 0);
  const qrTotal   = Number(totals?.qr_total ?? 0);

  const onChangeMethod = (id, value) => {
    router.patch(route('orders.update_method', id), { payment_method: value }, {
      preserveScroll: true, preserveState: true,
    });
  };

  const onTogglePaid = (id, isPaid) => {
    router.patch(route('orders.mark_paid', id), { is_paid: !!isPaid }, {
      preserveScroll: true, preserveState: true,
    });
  };

  const onUploadQr = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('qr', file);
    router.post(route('payments.qr_upload'), form, {
      forceFormData: true, preserveScroll: true,
    });
  };

  const paid = orders.filter((o) => !!o.is_paid)
    .reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
  const all  = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold">Payments &amp; Receipts</h2>}
    >
      <Head title="Payments & Receipts" />

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="fx-kpi">
          <div className="fx-kpi-label">Orders</div>
          <div className="fx-kpi-value">{orders.length}</div>
        </div>
        <div className="fx-kpi">
          <div className="fx-kpi-label">Cash</div>
          <div className="fx-kpi-value">${cashTotal.toFixed(2)}</div>
        </div>
        <div className="fx-kpi">
          <div className="fx-kpi-label">QR</div>
          <div className="fx-kpi-value">${qrTotal.toFixed(2)}</div>
        </div>
        <div className="fx-kpi">
          <div className="fx-kpi-label">Paid / Unpaid</div>
          <div className="fx-kpi-value">${paid.toFixed(2)} / ${all.toFixed(2)}</div>
        </div>
      </div>

      {/* QR uploader + preview */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="fx-card md:col-span-2">
          <div className="text-sm font-medium fx-muted">QR Image for “QR” Payments</div>
          <div className="mt-3 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={onUploadQr} className="fx-input max-w-xs" />
          </div>
          <p className="mt-2 text-xs fx-muted">PNG/JPG/WEBP up to 4MB.</p>
        </div>

        <div className="fx-card">
          <div className="text-sm font-medium fx-muted mb-2">Current QR</div>
          <div className="h-64 rounded-lg border fx-divider flex items-center justify-center overflow-hidden">
            {qr_public_path ? (
              <img
                src={qr_public_path}
                alt="QR"
                className="max-h-full max-w-full object-contain"
                onError={(e) => { e.currentTarget.src = FALLBACK_SVG; }}
              />
            ) : (
              <img src={FALLBACK_SVG} className="max-h-full max-w-full object-contain" />
            )}
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="mt-6 fx-table-wrap">
        <table className="fx-table">
          <thead className="fx-thead">
            <tr>
              <th className="fx-th">ID</th>
              <th className="fx-th">Customer</th>
              <th className="fx-th">Total</th>
              <th className="fx-th">Method</th>
              <th className="fx-th">Paid</th>
              <th className="fx-th">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr className="fx-tr">
                <td className="fx-td text-center" colSpan={6}>No orders yet.</td>
              </tr>
            )}
            {orders.map((o) => {
              const total = Number(o.total_amount ?? 0);
              return (
                <tr key={o.id} className="fx-tr">
                  <td className="fx-td">
                    <Link href={route('orders.edit', o.id)} className="text-indigo-300 hover:underline">#{o.id}</Link>
                  </td>
                  <td className="fx-td">{o.user?.name ?? '—'}</td>
                  <td className="fx-td">${total.toFixed(2)}</td>
                  <td className="fx-td">
                    <select
                      className="fx-input max-w-[110px]"
                      value={o.payment_method ?? 'cash'}
                      onChange={(e) => onChangeMethod(o.id, e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="qr">QR</option>
                    </select>
                  </td>
                  <td className="fx-td">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!o.is_paid}
                        onChange={(e) => onTogglePaid(o.id, e.target.checked)}
                      />
                      <span className="fx-muted">{o.is_paid ? 'Paid' : 'Unpaid'}</span>
                    </label>
                  </td>
                  <td className="fx-td">{o.created_at ? new Date(o.created_at).toLocaleString() : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AuthenticatedLayout>
  );
}
