import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const FALLBACK_SVG =
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

function withVersion(url, v = Date.now()) {
  if (!url) return null;
  return url.includes("?") ? `${url}&v=${v}` : `${url}?v=${v}`;
}

export default function PaymentsReceipts() {
  // Props expected from controller
  const { orders = [], totals = {}, qr_public_path = null } = usePage().props;

  const cashTotal = Number(totals?.cash_total ?? 0);
  const qrTotal = Number(totals?.qr_total ?? 0);

  // image src state with cache-busting
  const [qrSrc, setQrSrc] = React.useState(
    qr_public_path ? withVersion(qr_public_path) : null
  );

  // if the server sends a new path later (partial reload), sync it
  React.useEffect(() => {
    setQrSrc(qr_public_path ? withVersion(qr_public_path) : null);
  }, [qr_public_path]);

  const sumTotal = (arr) =>
    arr.reduce((s, o) => s + Number(o.total ?? o.total_amount ?? 0), 0);

  const onChangeMethod = (id, value) => {
    router.patch(
      route("orders.update_method", id),
      { payment_method: value },
      { preserveScroll: true, preserveState: true }
    );
  };

  const onTogglePaid = (id, isPaid) => {
    router.patch(
      route("orders.mark_paid", id),
      { is_paid: !!isPaid },
      { preserveScroll: true, preserveState: true }
    );
  };

  const onUploadQr = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1) instant local preview
    const localPreview = URL.createObjectURL(file);
    setQrSrc(localPreview);

    // 2) upload
    const form = new FormData();
    form.append("qr", file);

    router.post(route("payments.qr_upload"), form, {
      forceFormData: true,
      preserveScroll: true,
      // 3) after upload, fetch only the new qr path and bust cache
      onSuccess: () => {
        router.reload({
          only: ["qr_public_path"],
          onSuccess: (page) => {
            const path = page.props.qr_public_path;
            setQrSrc(path ? withVersion(path) : null);
          },
          onError: () => {
            // fallback to server path if something goes wrong
            setQrSrc(qr_public_path ? withVersion(qr_public_path) : null);
          },
        });
      },
      onError: () => {
        // revert preview on error
        setQrSrc(qr_public_path ? withVersion(qr_public_path) : null);
      },
    });
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold text-gray-800">Payments &amp; Receipts</h2>}
    >
      <Head title="Payments & Receipts" />

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Orders</div>
          <div className="mt-2 text-2xl font-semibold">{orders.length}</div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Cash</div>
          <div className="mt-2 text-2xl font-semibold">${cashTotal.toFixed(2)}</div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">QR</div>
          <div className="mt-2 text-2xl font-semibold">${qrTotal.toFixed(2)}</div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Paid / Unpaid</div>
          <div className="mt-2 text-2xl font-semibold">
            ${sumTotal(orders.filter((o) => !!o.is_paid)).toFixed(2)} / ${sumTotal(orders).toFixed(2)}
          </div>
        </div>
      </div>

      {/* QR uploader + preview */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4 md:col-span-2">
          <div className="text-sm font-medium text-gray-700">QR Image for “QR” Payments</div>
          <div className="mt-3 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={onUploadQr} />
          </div>
          <p className="mt-2 text-xs text-gray-500">PNG/JPG/WEBP up to 4MB.</p>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Current QR</div>
          <div className="h-64 rounded border flex items-center justify-center bg-gray-50 p-2">
            {qrSrc ? (
              <img
                key={qrSrc} // helps React swap the image cleanly
                src={qrSrc}
                alt="QR"
                className="max-h-full max-w-full object-contain"
                onError={(e) => { e.currentTarget.src = FALLBACK_SVG; }}
              />
            ) : (
              <span className="text-gray-400 text-sm">No QR uploaded</span>
            )}
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="mt-6 rounded-lg border bg-white overflow-hidden">
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
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-10 text-center text-sm text-gray-500">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const total = Number(o.total ?? o.total_amount ?? 0);
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={route("orders.edit", o.id)} className="text-indigo-600 hover:underline">
                      #{o.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.user?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">${total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border-gray-300 text-sm"
                      value={o.payment_method ?? "cash"}
                      onChange={(e) => onChangeMethod(o.id, e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="qr">QR</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!o.is_paid}
                        onChange={(e) => onTogglePaid(o.id, e.target.checked)}
                      />
                      <span>{o.is_paid ? "Paid" : "Unpaid"}</span>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {o.created_at ? new Date(o.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AuthenticatedLayout>
  );
}
