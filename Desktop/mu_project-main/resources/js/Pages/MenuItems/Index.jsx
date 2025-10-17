import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function MenuItemsIndex({ filters, items }) {
  const [search, setSearch] = useState(filters?.search ?? "");

  const submitSearch = (e) => {
    e.preventDefault();
    router.get("/menuitems", { search }, { preserveState: true });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Menu Items</h2>}>
      <Head title="Menu Items" />

      <div className="mb-4 flex items-center justify-between">
        <form onSubmit={submitSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 w-64"
            placeholder="Search items..."
          />
          <button className="px-3 py-2 rounded bg-slate-700 text-white hover:bg-slate-600">Search</button>
        </form>

        <Link
          href="/menuitems/create"
          className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          + Add Item
        </Link>
      </div>

      <div className="rounded border border-slate-700 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/40 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Qty</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Image</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-slate-100">
            {!items?.data?.length && (
              <tr>
                <td colSpan="7" className="px-3 py-6 text-center text-slate-400">
                  No items found.
                </td>
              </tr>
            )}
            {items?.data?.map((i) => (
              <tr key={i.id}>
                <td className="px-3 py-2">{i.id}</td>
                <td className="px-3 py-2">{i.name}</td>
                <td className="px-3 py-2">${i.price}</td>
                <td className="px-3 py-2">{i.stock_qty}</td>
                <td className="px-3 py-2">{i.is_active ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  {i.image_url ? (
                    <img
                      src={i.image_url}
                      alt={i.name}
                      className="h-10 w-14 object-cover rounded border border-slate-700"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/menuitems/${i.id}/edit`}
                    className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between p-3 border-t border-slate-700 text-slate-300">
          <div>
            Page {items.current_page} of {items.last_page}
          </div>
          <div className="space-x-2">
            {items.prev_page_url && (
              <Link href={items.prev_page_url} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600">
                Prev
              </Link>
            )}
            {items.next_page_url && (
              <Link href={items.next_page_url} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600">
                Next
              </Link>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
