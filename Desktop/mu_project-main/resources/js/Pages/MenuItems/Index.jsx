import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const money = (n) => Number(n || 0).toFixed(2);

export default function MenuItemsIndex() {
  const { items, filters = {} } = usePage().props;

  const [search, setSearch] = useState(filters.search ?? "");

  const submitSearch = (e) => {
    e.preventDefault();
    router.get(
      "/menuitems",
      { search },
      { preserveState: true, replace: true }
    );
  };

  const resetSearch = () => {
    setSearch("");
    router.get("/menuitems", {}, { preserveState: false, replace: true });
  };

  const handleDelete = (item) => {
    if (
      !window.confirm(
        `Delete "${item.name}" from the menu? This cannot be undone.`
      )
    ) {
      return;
    }

    router.delete(`/menuitems/${item.id}`, {
      preserveScroll: true,
    });
  };

  const stockBadge = (qty) => {
    const q = Number(qty || 0);
    if (q <= 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-900/40 px-2 py-0.5 text-[11px] font-medium text-red-200">
          Out of stock
        </span>
      );
    }
    if (q <= 5) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-900/40 px-2 py-0.5 text-[11px] font-medium text-amber-200">
          Low ({q})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-900/40 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
        In stock ({q})
      </span>
    );
  };

  const activeBadge = (isActive) => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        isActive
          ? "bg-emerald-900/40 text-emerald-200"
          : "bg-slate-800 text-slate-300"
      }`}
    >
      <span
        className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-400" : "bg-slate-500"
        }`}
      />
      {isActive ? "Active" : "Hidden"}
    </span>
  );

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold text-gray-100">
          Cafeteria – Menu Items
        </h2>
      }
    >
      <Head title="Menu Items" />

      <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4 shadow-lg shadow-black/50 backdrop-blur">
        {/* Header row */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Menu Items
            </h3>
            <p className="text-xs text-slate-400">
              Manage what appears in the cafeteria menu.
            </p>
          </div>

          <Link
            href="/menuitems/create"
            className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-900/70 hover:bg-indigo-500"
          >
            + Add item
          </Link>
        </div>

        {/* Search bar */}
        <form
          onSubmit={submitSearch}
          className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-600 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 shadow-inner shadow-black/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
            <span className="pointer-events-none absolute left-2.5 top-1.5 text-xs text-slate-500">
              🔍
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-900/70 hover:bg-indigo-500"
            >
              Search
            </button>
            <button
              type="button"
              onClick={resetSearch}
              className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-700"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90">
                <th className="px-4 py-3 font-semibold text-slate-400">#</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Price</th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  Stock
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  Active
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400">
                  Image
                </th>
                <th className="px-4 py-3 font-semibold text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No menu items found.
                  </td>
                </tr>
              ) : (
                items.data.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900/60"
                  >
                    <td className="px-4 py-2 text-slate-200">#{item.id}</td>
                    <td className="px-4 py-2 text-slate-100">{item.name}</td>
                    <td className="px-4 py-2 text-slate-100">
                      ${money(item.price)}
                    </td>
                    <td className="px-4 py-2">{stockBadge(item.stock_qty)}</td>
                    <td className="px-4 py-2">
                      {activeBadge(item.is_active)}
                    </td>
                    <td className="px-4 py-2">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-7 w-7 rounded border border-slate-700 object-cover"
                        />
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/menuitems/${item.id}/edit`}
                          className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-700"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="rounded-full bg-red-900/70 px-3 py-1 text-[11px] font-medium text-red-50 shadow-sm shadow-red-900/50 hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (optional, if you use it) */}
        {items.links && items.links.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div>
              Page{" "}
              <span className="text-slate-200">{items.current_page}</span> of{" "}
              <span className="text-slate-200">{items.last_page}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {items.links.map((link, i) => (
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
    </AuthenticatedLayout>
  );
}
