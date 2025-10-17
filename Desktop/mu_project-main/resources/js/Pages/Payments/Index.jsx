import React from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function PaymentsIndex({ currentQr = null, orders }) {
  // Upload with Inertia useForm (multipart)
  const { data, setData, post, processing, reset } = useForm({ qr: null });
  const upload = (e) => {
    e.preventDefault();
    post("/payments/qr", {
      forceFormData: true,
      onSuccess: () => reset('qr'),
    });
  };

  const markPaid = (id) => router.post(`/payments/${id}/paid`);
  const markUnpaid = (id) => router.post(`/payments/${id}/unpaid`);
  const setMethod = (id, method) => router.post(`/payments/${id}/method`, { method });

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Payments</h2>}>
      <Head title="Payments" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Current QR + uploader */}
        <div>
          <div className="rounded border border-slate-700 bg-slate-800 p-4">
            <h3 className="font-semibold text-slate-100 mb-3">Current QR</h3>

            <div className="rounded border border-slate-700 bg-slate-900/50 p-2 mb-4">
              {currentQr ? (
                <img src={currentQr} alt="Payment QR" className="w-full h-auto object-contain rounded" />
              ) : (
                <div className="text-slate-400">No QR uploaded yet.</div>
              )}
            </div>

            {/* Uploader */}
            <form onSubmit={upload} className="flex items-center gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setData('qr', e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-200 file:mr-4 file:py-2 file:px-3 file:rounded
                           file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white
                           hover:file:bg-slate-600"
              />
              <button
                type="submit"
                disabled={processing || !data.qr}
                className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Upload
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Recent Orders (unchanged; keep your actions) */}
        <div className="lg:col-span-2 rounded border border-slate-700 bg-slate-800 p-4">
          <h3 className="font-semibold text-slate-100 mb-3">Recent Orders</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-slate-300">
                <tr className="bg-slate-900/40">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Paid</th>
                  <th className="px-3 py-2 text-left">Method</th>
                  <th className="px-3 py-2 text-left">Cash Code</th>
                  <th className="px-3 py-2 text-left">Total</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {orders?.data?.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-900/30">
                    <td className="px-3 py-2">{o.id}</td>
                    <td className="px-3 py-2">{o.user}</td>
                    <td className="px-3 py-2">{o.payment_status ?? o.status}</td>
                    <td className="px-3 py-2">{o.is_paid ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">{o.method}</td>
                    <td className="px-3 py-2">
                      {o.method === "CASH" && !o.is_paid && o.cash_code ? (
                        <span className="inline-flex items-center rounded bg-amber-600/20 text-amber-200 px-2 py-0.5 font-mono tracking-widest">
                          {o.cash_code}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">${o.total}</td>
                    <td className="px-3 py-2">{o.created}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => markPaid(o.id)} className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500">Mark paid</button>
                        <button onClick={() => markUnpaid(o.id)} className="px-2 py-1 rounded bg-slate-700 text-slate-100 hover:bg-slate-600">Mark unpaid</button>
                        <button onClick={() => setMethod(o.id, 'QR')} className="px-2 py-1 rounded bg-indigo-700 text-white hover:bg-indigo-600">Set QR</button>
                        <button onClick={() => setMethod(o.id, 'CASH')} className="px-2 py-1 rounded bg-amber-700 text-white hover:bg-amber-600">Set CASH</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
