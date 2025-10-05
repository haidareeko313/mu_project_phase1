import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function InventoryEdit({ log }) {
  const [change, setChange] = useState(log.change ?? 0);
  const [action, setAction] = useState(log.action ?? "decrement");

  const submit = (e) => {
    e.preventDefault();
    router.patch(route("inventory.update", log.id), { change, action });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Edit Inventory Log</h2>}>
      <Head title={`Edit Log #${log.id}`} />

      <form onSubmit={submit} className="rounded border border-slate-700 bg-slate-800 p-4 max-w-lg">
        <div className="text-slate-200 mb-3">
          <div className="mb-1"><span className="text-slate-400">Log ID:</span> {log.id}</div>
          <div className="mb-1"><span className="text-slate-400">Item:</span> {log.item}</div>
        </div>

        <label className="block text-slate-200 mb-1">Change</label>
        <input
          type="number"
          value={change}
          onChange={(e) => setChange(parseInt(e.target.value || 0))}
          className="w-full mb-3 rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
          required
        />

        <label className="block text-slate-200 mb-1">Action</label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="w-full mb-4 rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
        >
          <option value="increment">increment</option>
          <option value="decrement">decrement</option>
        </select>

        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Save</button>
          <a href={route("inventory.index")} className="px-4 py-2 rounded bg-slate-600 text-white">Cancel</a>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}
