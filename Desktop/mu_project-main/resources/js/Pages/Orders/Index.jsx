import React, { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const cls = (...a) => a.filter(Boolean).join(" ");

export default function OrdersIndex({ orders, filters }) {
  const [q, setQ] = useState(filters?.q ?? "");
  const [status, setStatus] = useState(filters?.status ?? "any");
  const [paid, setPaid] = useState(filters?.paid ?? "any");
  const [method, setMethod] = useState(filters?.method ?? "any");
  const [from, setFrom] = useState(filters?.from ?? "");
  const [to, setTo] = useState(filters?.to ?? "");

  const params = useMemo(
    () => ({ q, status, paid, method, from, to }),
    [q, status, paid, method, from, to]
  );

  const apply = () =>
    router.get("/orders", params, {
      preserveScroll: true,
      preserveState: true,
    });

  const reset = () => {
    setQ("");
    setStatus("any");
    setPaid("any");
    setMethod("any");
    setFrom("");
    setTo("");
    router.get(
      "/orders",
      { q: "", status: "any", paid: "any", method: "any", from: "", to: "" },
      { preserveScroll: true }
    );
  };

  const page = orders?.current_page ?? 1;
  const last = orders?.last_page ?? 1;
  const hasPrev = !!orders?.prev_page_url;
  const hasNext = !!orders?.next_page_url;
  const gotoPage = (p) => {
    if (p < 1 || p > last) return;
    router.get("/orders", { ...params, page: p }, { preserveScroll: true, preserveState: true });
  };

  const rows = orders?.data ?? [];

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Orders</h2>}>
      <Head title="Orders" />

      <div className="rounded border border-slate-700 bg-slate-800 p-4">
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
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-slate-400 text-center">
                    No results.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-700 text-slate-200 align-top">
                  <td className="px-3 py-2">#{r.id}</td>
                  <td className="px-3 py-2">{r.user}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.paid}</td>
                  <td className="px-3 py-2">{r.method}</td>
                  <td className="px-3 py-2">{r.created}</td>
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
              hasPrev
                ? "bg-slate-700 hover:bg-slate-600 text-slate-100"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
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
              hasNext
                ? "bg-slate-700 hover:bg-slate-600 text-slate-100"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            )}
          >
            Next
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
