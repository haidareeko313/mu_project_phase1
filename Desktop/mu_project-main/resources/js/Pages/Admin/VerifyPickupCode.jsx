import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";

export default function VerifyPickupCode() {
  const [orderId, setOrderId] = useState("");
  const [code, setCode] = useState("");

  const submit = (e) => {
    e.preventDefault();
    Inertia.post("/admin/orders/verify-code", { order_id: orderId || null, code });
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="font-semibold mb-3">Verify Cash Pickup Code</h2>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700">Order ID (optional)</label>
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} className="mt-1 w-full border px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">4-digit Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={4} className="mt-1 w-full border px-2 py-1" />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded">Verify</button>
        </div>
      </form>
    </div>
  );
}