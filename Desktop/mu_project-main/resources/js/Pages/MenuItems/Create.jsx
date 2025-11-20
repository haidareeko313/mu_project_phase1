import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function MenuItemsCreate() {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    price: "",
    stock_qty: 0,
    is_active: true,
    image: null,
  });

  const submit = (e) => {
    e.preventDefault();
    post("/menuitems", {
      forceFormData: true,
      preserveScroll: true,
    });
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold text-gray-100">Cafeteria – Add Menu Item</h2>}
    >
      <Head title="Add Menu Item" />

      <div className="mx-auto max-w-xl rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 shadow-lg shadow-black/50 backdrop-blur">
        <h3 className="mb-4 text-base font-semibold text-slate-100">
          Add Menu Item
        </h3>

        <form onSubmit={submit} className="space-y-4 text-sm">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Name
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData("name", e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              placeholder="e.g. Cheese Sandwich"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.price}
              onChange={(e) => setData("price", e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              placeholder="3.50"
            />
            {errors.price && (
              <p className="mt-1 text-xs text-red-400">{errors.price}</p>
            )}
          </div>

          {/* Stock */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Quantity (stock)
            </label>
            <input
              type="number"
              min="0"
              value={data.stock_qty}
              onChange={(e) => setData("stock_qty", e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
            {errors.stock_qty && (
              <p className="mt-1 text-xs text-red-400">{errors.stock_qty}</p>
            )}
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={data.is_active}
              onChange={(e) => setData("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-500/60"
            />
            <label
              htmlFor="active"
              className="text-xs font-medium text-slate-200"
            >
              Active (visible in menu)
            </label>
          </div>

          {/* Image */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setData("image", e.target.files[0] || null)}
              className="block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950/80 text-xs text-slate-100 file:mr-3 file:rounded-l-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Optional. PNG/JPG, up to 4&nbsp;MB.
            </p>
            {errors.image && (
              <p className="mt-1 text-xs text-red-400">{errors.image}</p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={processing}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-900/70 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {processing ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
