import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    price: "",
    stock_qty: 0,
    is_active: true,
    image: null,
  });

  const submit = (e) => {
    e.preventDefault();
    post("/menuitems");
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Add Menu Item</h2>}>
      <Head title="Add Menu Item" />
      <form onSubmit={submit} className="max-w-xl space-y-4">
        <div>
          <label className="block text-slate-300 mb-1">Name</label>
          <input
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
            value={data.name}
            onChange={(e) => setData("name", e.target.value)}
          />
          {errors.name && <div className="text-red-400 text-sm mt-1">{errors.name}</div>}
        </div>

        <div>
          <label className="block text-slate-300 mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
            value={data.price}
            onChange={(e) => setData("price", e.target.value)}
          />
          {errors.price && <div className="text-red-400 text-sm mt-1">{errors.price}</div>}
        </div>

        <div>
          <label className="block text-slate-300 mb-1">Quantity (stock)</label>
          <input
            type="number"
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
            value={data.stock_qty}
            onChange={(e) => setData("stock_qty", Number(e.target.value))}
          />
          {errors.stock_qty && <div className="text-red-400 text-sm mt-1">{errors.stock_qty}</div>}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            checked={data.is_active}
            onChange={(e) => setData("is_active", e.target.checked)}
          />
          <label htmlFor="is_active" className="text-slate-300">Active</label>
        </div>

        <div>
          <label className="block text-slate-300 mb-1">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setData("image", e.target.files[0])}
            className="text-slate-300"
          />
          {errors.image && <div className="text-red-400 text-sm mt-1">{errors.image}</div>}
        </div>

        <button
          disabled={processing}
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          Save
        </button>
      </form>
    </AuthenticatedLayout>
  );
}
