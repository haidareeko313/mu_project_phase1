import React from "react";
import { Head, usePage, router, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function PaymentsReceipts() {
  const { props } = usePage();
  const orders = props.orders || [];
  const summary = props.summary || { count: 0, cash: 0, qr: 0, paid: 0, unpaid: 0 };
  const qrUrl = props.qrUrl || null;

  const [file, setFile] = React.useState(null);

  const onUpload = (e) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("qr", file);

    router.post(route("payments.qr_upload"), form, {
      forceFormData: true,
      onSuccess: () => setFile(null),
    });
  };

  const changeMethod = (id, method) => {
    router.patch(route("orders.update_method", id), { method }, { preserveScroll: true });
  };

  const togglePaid = (id, isPaid) => {
    router.patch(route("orders.mark_paid", id), { is_paid: isPaid ? 1 : 0 }, { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold text-gray-800">💳 Payments & Receipts</h2>}
    >
      <Head title="Payments & Receipts" />

      {/* Summary */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Orders</div>
          <div className="text-2xl font-semibold">{summary.count}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Cash</div>
          <div className="text-2xl font-semibold">${summary.cash.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">QR</div>
          <div className="text-2xl font-semibold">${summary.qr.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Paid / Unpaid</div>
          <div className="text-2xl font-semibold">
            ${summary.paid.toFixed(2)} <span className="text-gray-400">/</span> ${summary.unpaid.toFixed(2)}
          </div>
        </div>
      </div>

      {/* QR uploader + Preview */}
      <div className="rounded-lg border bg-white p-4 mb-6">
        <div className="flex items-start gap-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">QR Image for “QR” Payments</div>
            <form onSubmit={onUpload} className="flex items-center gap-2">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:text-gray-700 hover:file:bg-gray-50"
              />
              <button
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                type="submit"
                disabled={!file}
              >
                Upload
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">PNG/JPG/WEBP up to 4MB.</p>
          </div>

          <div className="ml-auto">
            <div className="text-sm font-medium text-gray-700 mb-2">Current QR</div>
            <div className="w-40 h-40 border rounded-lg flex items-center justify-center bg-gray-50">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR"
                  className="w-40 h-40 object-contain rounded-md"
                />
              ) : (
                <span className="text-gray-400 text-sm">No image</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Method</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Paid</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">
                  <Link className="text-indigo-600 hover:underline" href={route('orders.edit', o.id)}>
                    #{o.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{o.customer ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">${o.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <select
                    className="rounded-md border-gray-300 text-sm"
                    value={o.method}
                    onChange={(e) => changeMethod(o.id, e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="qr">QR</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={o.is_paid}
                      onChange={(e) => togglePaid(o.id, e.target.checked)}
                    />
                    <span>{o.is_paid ? 'Paid' : 'Unpaid'}</span>
                  </label>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{o.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuthenticatedLayout>
  );
}
