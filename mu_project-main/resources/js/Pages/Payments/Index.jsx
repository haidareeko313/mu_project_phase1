import { usePage, router } from "@inertiajs/react";
import { useRef, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const money = (n) => Number(n || 0).toFixed(2);

export default function PaymentsIndex({ orders = [], qrUrl = null }) {
  const { flash } = usePage().props;
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);

  const markPaid = (id) => router.post(`/payments/${id}/paid`, {}, { preserveScroll: true });
  const markUnpaid = (id) => router.post(`/payments/${id}/unpaid`, {}, { preserveScroll: true });
  const setMethod = (id, method) => router.post(`/payments/${id}/method`, { method }, { preserveScroll: true });

  const uploadQr = (e) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append("qr", file);
    router.post(`/payments/qr`, fd, {
      forceFormData: true,
      onSuccess: () => {
        if (fileRef.current) fileRef.current.value = "";
        setFile(null);
      },
    });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Payments</h2>}>
      {flash?.success && (
        <div className="mb-4 rounded border border-green-700 bg-green-900/30 px-4 py-2 text-green-300">
          {flash.success}
        </div>
      )}
      {flash?.error && (
        <div className="mb-4 rounded border border-red-700 bg-red-900/30 px-4 py-2 text-red-300">
          {flash.error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* QR panel */}
        <div className="relative z-10 overflow-visible rounded border border-slate-700 bg-slate-800 p-4">
          <div className="text-slate-200 font-semibold mb-2">Current QR</div>
          <div className="rounded border border-slate-700 bg-slate-900 p-2 overflow-hidden">
            {qrUrl ? (
              <img src={qrUrl} alt="QR" className="w-full h-64 object-contain" />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">No QR uploaded</div>
            )}
          </div>

          <form onSubmit={uploadQr} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-slate-100 file:mr-3 file:rounded file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-slate-100 hover:file:bg-slate-600"
            />
            <button
              type="submit"
              disabled={!file}
              className="relative z-20 w-full sm:w-auto rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              Upload QR
            </button>
          </form>
        </div>

        {/* Orders table */}
        <div className="lg:col-span-2 rounded border border-slate-700 bg-slate-800 p-4">
          <div className="text-slate-200 font-semibold mb-2">Recent Orders</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-200">
              <thead>
                <tr className="bg-slate-900/60 text-left">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Paid</th>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-slate-700">
                    <td className="px-3 py-2">{o.id}</td>
                    <td className="px-3 py-2">{o.user}</td>
                    <td className="px-3 py-2">{o.status}</td>
                    <td className="px-3 py-2">{o.paid ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">{o.method}</td>
                    <td className="px-3 py-2">${money(o.total)}</td>
                    <td className="px-3 py-2">{o.created}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => markPaid(o.id)}
                          className="rounded bg-green-700 px-2 py-1 text-white hover:bg-green-600"
                        >
                          Mark paid
                        </button>
                        <button
                          onClick={() => markUnpaid(o.id)}
                          className="rounded bg-slate-700 px-2 py-1 text-white hover:bg-slate-600"
                        >
                          Mark unpaid
                        </button>
                        <button
                          onClick={() => setMethod(o.id, 'QR')}
                          className="rounded bg-indigo-700 px-2 py-1 text-white hover:bg-indigo-600"
                        >
                          Set QR
                        </button>
                        <button
                          onClick={() => setMethod(o.id, 'CASH')}
                          className="rounded bg-amber-700 px-2 py-1 text-white hover:bg-amber-600"
                        >
                          Set CASH
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!orders.length && (
                  <tr>
                    <td className="px-3 py-6 text-slate-400" colSpan={8}>
                      No orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
