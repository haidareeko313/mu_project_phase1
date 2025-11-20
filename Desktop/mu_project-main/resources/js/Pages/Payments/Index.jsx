import React, { useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const statusOptions = [
  { value: "any", label: "Any status" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

const paidOptions = [
  { value: "any", label: "Any" },
  { value: "yes", label: "Paid" },
  { value: "no", label: "Unpaid" },
];

const methodOptions = [
  { value: "any", label: "Any method" },
  { value: "CASH", label: "Cash" },
  { value: "QR", label: "QR" },
];

function DropdownFilter({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const currentLabel =
    options.find((opt) => opt.value === value)?.label || label;

  return (
    <div className="relative text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full border border-slate-600 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-100 shadow-sm shadow-black/40 hover:border-indigo-500 hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
      >
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <span className="max-w-[120px] truncate font-medium">
          {currentLabel}
        </span>
        <span className="ml-1 text-[10px] text-slate-400">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 shadow-xl shadow-black/60">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-xs transition ${
                value === opt.value
                  ? "bg-indigo-600/90 text-white"
                  : "bg-transparent text-slate-100 hover:bg-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaymentsIndex() {
  const { orders, filters = {}, qrUrl } = usePage().props;

  // Filters state
  const [q, setQ] = useState(filters.q ?? "");
  const [status, setStatus] = useState(filters.status ?? "any");
  const [paid, setPaid] = useState(filters.paid ?? "any");
  const [method, setMethod] = useState(filters.method ?? "any");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");

  // QR upload form
  const { data, setData, post, processing, reset } = useForm({
    qr: null,
  });

  const handleQrChange = (e) => {
    setData("qr", e.target.files[0] || null);
  };

  const uploadQr = (e) => {
    e.preventDefault();
    if (!data.qr) return;

    post("/payments/qr", {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => reset("qr"),
    });
  };

  const applyFilters = (e) => {
    e?.preventDefault?.();

    router.get(
      "/payments",
      {
        q,
        status,
        paid,
        method,
        from,
        to,
      },
      {
        preserveState: true,
        replace: true,
      }
    );
  };

  const resetFilters = () => {
    setQ("");
    setStatus("any");
    setPaid("any");
    setMethod("any");
    setFrom("");
    setTo("");
    router.get(
      "/payments",
      {},
      {
        preserveState: false,
        replace: true,
      }
    );
  };

  // Action helpers
  const markPaid = (id) => {
    router.post(
      `/payments/${id}/paid`,
      {},
      { preserveScroll: true, preserveState: true }
    );
  };

  const markUnpaid = (id) => {
    router.post(
      `/payments/${id}/unpaid`,
      {},
      { preserveScroll: true, preserveState: true }
    );
  };

  const setMethodCash = (id) => {
    router.post(
      `/payments/${id}/method`,
      { method: "CASH" },
      { preserveScroll: true, preserveState: true }
    );
  };

  const setMethodQr = (id) => {
    router.post(
      `/payments/${id}/method`,
      { method: "QR" },
      { preserveScroll: true, preserveState: true }
    );
  };

  const badgeForStatus = (s) => {
    const value = (s || "").toLowerCase();
    if (value === "completed") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-900/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
          ● Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-900/40 px-2 py-0.5 text-[11px] font-medium text-amber-200">
        ● Pending
      </span>
    );
  };

  const badgeForPaid = (p) => {
    if ((p || "").toLowerCase() === "yes") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-900/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
          Yes
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
        No
      </span>
    );
  };

  const badgeForMethod = (m) => {
    if (m === "QR") {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-900/40 px-2 py-0.5 text-[11px] font-medium text-sky-300">
          QR
        </span>
      );
    }
    if (m === "CASH") {
      return (
        <span className="inline-flex items-center rounded-full bg-indigo-900/40 px-2 py-0.5 text-[11px] font-medium text-indigo-200">
          Cash
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
        —
      </span>
    );
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold text-gray-100">Cafeteria – Payments</h2>}
    >
      <Head title="Payments" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* QR CARD */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4 shadow-lg shadow-black/50 backdrop-blur">
            <h3 className="mb-2 text-base font-semibold text-slate-100">
              Current QR
            </h3>
            <p className="mb-3 text-xs text-slate-400">
              Students can scan this code when paying by QR. Upload a new image
              to update it instantly.
            </p>

            <div className="mb-4 flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 p-3">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Payment QR"
                  className="max-h-64 max-w-full rounded border border-slate-700 object-contain"
                />
              ) : (
                <div className="py-10 text-center text-xs text-slate-500">
                  No QR uploaded yet.
                </div>
              )}
            </div>

            <form onSubmit={uploadQr} className="space-y-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-300">
                  Upload new QR image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrChange}
                  className="block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950/80 text-xs text-slate-100 file:mr-3 file:rounded-l-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500"
                />
              </label>

              <button
                type="submit"
                disabled={processing || !data.qr}
                className="mt-1 inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-900/70 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {processing ? "Uploading..." : "Save QR"}
              </button>
            </form>
          </div>
        </div>

        {/* RECENT ORDERS / PAYMENTS */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4 shadow-lg shadow-black/50 backdrop-blur">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Recent Orders
                </h3>
                <p className="text-xs text-slate-400">
                  Manage payment status and methods for all orders.
                </p>
              </div>
            </div>

            {/* FILTERS BAR (more organized) */}
            <form
              onSubmit={applyFilters}
              className="mb-4 space-y-3 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3"
            >
              {/* Row 1: search + dropdowns in one clean line */}
              <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative w-full max-w-sm">
                    <input
                      type="text"
                      placeholder="email or #id..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="w-full rounded-full border border-slate-600 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 shadow-inner shadow-black/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                    />
                    <span className="pointer-events-none absolute left-2.5 top-1.5 text-xs text-slate-500">
                      🔍
                    </span>
                  </div>

                  <DropdownFilter
                    label="Status"
                    value={status}
                    options={statusOptions}
                    onChange={setStatus}
                  />
                  <DropdownFilter
                    label="Paid"
                    value={paid}
                    options={paidOptions}
                    onChange={setPaid}
                  />
                  <DropdownFilter
                    label="Method"
                    value={method}
                    options={methodOptions}
                    onChange={setMethod}
                  />
                </div>
              </div>

              {/* Row 2: dates + buttons aligned to the right */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">From</span>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="rounded-full border border-slate-600 bg-slate-950/80 px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">To</span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="rounded-full border border-slate-600 bg-slate-950/80 px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-900/70 hover:bg-indigo-500"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>

            {/* Orders/payment table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/90">
                    <th className="px-4 py-3 font-semibold text-slate-400">#</th>
                    <th className="px-4 py-3 font-semibold text-slate-400">
                      User
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-400">
                      Paid
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-400">
                      Method
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-400">
                      Cash Code
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-400">
                      Total
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-400">
                      Created
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        No orders found with the current filters.
                      </td>
                    </tr>
                  ) : (
                    orders.data.map((o) => {
                      const isPaid =
                        (o.paid || "").toLowerCase() === "yes";
                      const isCash = o.method === "CASH";
                      const isQr = o.method === "QR";

                      return (
                        <tr
                          key={o.id}
                          className="border-t border-slate-800/80 hover:bg-slate-900/60"
                        >
                          <td className="whitespace-nowrap px-4 py-2 text-slate-200">
                            #{o.id}
                          </td>
                          <td className="max-w-xs px-4 py-2 text-slate-200">
                            <span className="truncate">{o.user}</span>
                          </td>
                          <td className="px-4 py-2">
                            {badgeForStatus(o.status)}
                          </td>
                          <td className="px-4 py-2">{badgeForPaid(o.paid)}</td>
                          <td className="px-4 py-2">{badgeForMethod(o.method)}</td>
                          <td className="px-4 py-2 text-slate-300">
                            {o.cash_code && o.cash_code !== "—" ? (
                              <span className="font-mono text-[11px] tracking-widest text-slate-100">
                                {o.cash_code}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-200">
                            {o.total ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-slate-300">
                            {o.created}
                          </td>

                          {/* ACTIONS – compact & smart */}
                          <td className="px-4 py-2 align-top">
                            <div className="flex flex-col gap-1.5">
                              {/* Paid toggle */}
                              <button
                                type="button"
                                onClick={() =>
                                  isPaid ? markUnpaid(o.id) : markPaid(o.id)
                                }
                                className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${
                                  isPaid
                                    ? "bg-emerald-700 text-white shadow-emerald-900/70 hover:bg-emerald-600"
                                    : "bg-amber-600 text-slate-900 shadow-amber-900/70 hover:bg-amber-500"
                                }`}
                              >
                                {isPaid ? "Mark unpaid" : "Mark paid"}
                              </button>

                              {/* Method toggle */}
                              <div className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-1 py-1 text-[11px]">
                                <span className="px-2 text-slate-400">
                                  Method
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setMethodCash(o.id)}
                                  className={`rounded-full px-2 py-0.5 font-semibold ${
                                    isCash
                                      ? "bg-amber-500 text-slate-900 shadow-sm shadow-amber-900/60"
                                      : "bg-transparent text-slate-300 hover:bg-slate-800"
                                  }`}
                                >
                                  Cash
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMethodQr(o.id)}
                                  className={`rounded-full px-2 py-0.5 font-semibold ${
                                    isQr
                                      ? "bg-indigo-500 text-white shadow-sm shadow-indigo-900/60"
                                      : "bg-transparent text-slate-300 hover:bg-slate-800"
                                  }`}
                                >
                                  QR
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {orders.links && orders.links.length > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div>
                  Page{" "}
                  <span className="text-slate-200">
                    {orders.current_page}
                  </span>{" "}
                  of{" "}
                  <span className="text-slate-200">
                    {orders.last_page}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {orders.links.map((link, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Link
                      key={i}
                      href={link.url || "#"}
                      preserveState
                      preserveScroll
                      className={`rounded-full px-3 py-1 text-xs ${
                        link.active
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/70"
                          : link.url
                          ? "bg-slate-900 text-slate-200 hover:bg-slate-800"
                          : "bg-transparent text-slate-600"
                      }`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
