import React, { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

/** util */
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const cls = (...a) => a.filter(Boolean).join(" ");

export default function PaymentsIndex({ orders, filters, qrUrl }) {
  // ---- Filters local state (pre-populated from server) ----
  const [q, setQ] = useState(filters?.q ?? "");
  const [status, setStatus] = useState(filters?.status ?? "any");
  const [paid, setPaid] = useState(filters?.paid ?? "any");
  const [method, setMethod] = useState(filters?.method ?? "any");
  const [from, setFrom] = useState(filters?.from ?? "");
  const [to, setTo] = useState(filters?.to ?? "");

  const params = useMemo(
    () => ({
      q: q || "",
      status: status || "any",
      paid: paid || "any",
      method: method || "any",
      from: from || "",
      to: to || "",
    }),
    [q, status, paid, method, from, to]
  );

  const apply = () =>
    router.get("/payments", params, { preserveScroll: true, preserveState: true });

  const reset = () => {
    setQ("");
    setStatus("any");
    setPaid("any");
    setMethod("any");
    setFrom("");
    setTo("");
    router.get("/payments", { q: "", status: "any", paid: "any", method: "any", from: "", to: "" }, { preserveScroll: true });
  };

  // ---- QR Upload ----
  const onUploadQr = (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("qr", file);
    router.post("/payments/qr", fd, { forceFormData: true, preserveScroll: true });
  };

  // ---- Row actions ----
  const markPaid = (id) => router.post(`/payments/${id}/paid`, {}, { preserveScroll: true });
  const markUnpaid = (id) => router.post(`/payments/${id}/unpaid`, {}, { preserveScroll: true });
  const setMethodCash = (id) =>
    router.post(`/payments/${id}/method`, { method: "CASH" }, { preserveScroll: true });
  const setMethodQr = (id) =>
    router.post(`/payments/${id}/method`, { method: "QR" }, { preserveScroll: true });

  // ---- Pagination helpers (defensive for missing fields) ----
  const page = orders?.current_page ?? 1;
  const last = orders?.last_page ?? 1;
  const hasPrev = !!orders?.prev_page_url;
  const hasNext = !!orders?.next_page_url;

  const gotoPage = (p) => {
    if (p < 1 || p > last) return;
    router.get("/payments", { ...params, page: p }, { preserveScroll: true, preserveState: true });
  };

  const rows = orders?.data ?? [];

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Payments</h2>}>
      <Head title="Payments" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: QR Upload */}
        <div className="lg:col-span-1">
          <div className="rounded border border-slate-700 bg-slate-800 p-4">
            <div className="font-semibold text-slate-100 mb-2">Current QR</div>

            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Current QR"
                className="rounded border border-slate-700 w-full object-contain mb-3"
              />
            ) : (
              <div className="text-slate-400 mb-3">No QR set.</div>
            )}

            <label className="inline-flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 rounded bg-slate-700 text-slate-100 cursor-pointer hover:bg-slate-600">
                Choose File
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => onUploadQr(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        {/* Right: Orders + Filters */}
        <div className="lg:col-span-2">
          <div className="rounded border border-slate-700 bg-slate-800 p-4">
            <div className="font-semibold text-slate-100 mb-3">Recent Orders</div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-2 mb-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="email or #id..."
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 w-full lg:w-56"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 w-full lg:w-28"
              >
                <option value="any">Any</option>
                <option value="pending">pending</option>
                <option value="completed">completed</option>
              </select>
              <select
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 w-full lg:w-28"
              >
                <option value="any">Any</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 w-full lg:w-28"
              >
                <option value="any">Any</option>
                <option value="CASH">CASH</option>
                <option value="QR">QR</option>
              </select>
              <input
                type="date"
                value={from || ""}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 w-full lg:w-40"
              />
              <input
                type="date"
                value={to || ""}
                onChange={(e) => setTo(e.target.value)}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 w-full lg:w-40"
              />
              <div className="flex gap-2">
                <button
                  onClick={apply}
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Apply
                </button>
                <button
                  onClick={reset}
                  className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-100"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-300">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Paid</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Cash Code</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-6 text-slate-400 text-center">
                        No results.
                      </td>
                    </tr>
                  )}

                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-700 text-slate-200">
                      <td className="px-3 py-2">#{row.id}</td>
                      <td className="px-3 py-2">{row.user ?? "—"}</td>
                      <td className="px-3 py-2">{row.status}</td>
                      <td className="px-3 py-2">{row.paid}</td>
                      <td className="px-3 py-2">{row.method}</td>
                      <td className="px-3 py-2">
                        {row.cash_code ? <span className="font-mono">{row.cash_code}</span> : "—"}
                      </td>
                      <td className="px-3 py-2">{money(row.total)}</td>
                      <td className="px-3 py-2">{row.created}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => markPaid(row.id)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            Mark paid
                          </button>
                          <button
                            onClick={() => markUnpaid(row.id)}
                            className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs"
                          >
                            Mark unpaid
                          </button>
                          <button
                            onClick={() => setMethodQr(row.id)}
                            className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                          >
                            Set QR
                          </button>
                          <button
                            onClick={() => setMethodCash(row.id)}
                            className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs"
                          >
                            Set CASH
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={() => gotoPage(page - 1)}
                disabled={!hasPrev}
                className={cls(
                  "px-3 py-1.5 rounded",
                  hasPrev ? "bg-slate-700 hover:bg-slate-600 text-slate-100" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                )}
              >
                Prev
              </button>
              <div className="text-slate-300 text-sm">
                Page {page} / {last}
              </div>
              <button
                onClick={() => gotoPage(page + 1)}
                disabled={!hasNext}
                className={cls(
                  "px-3 py-1.5 rounded",
                  hasNext ? "bg-slate-700 hover:bg-slate-600 text-slate-100" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                )}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
