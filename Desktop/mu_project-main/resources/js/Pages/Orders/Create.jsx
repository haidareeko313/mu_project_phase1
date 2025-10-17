import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Create({ menuItems }) {
  const [lines, setLines] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  function addLine(mi) {
    setLines((prev) => {
      const existing = prev.find((l) => l.menu_item_id === mi.id);
      if (existing) {
        return prev.map((l) =>
          l.menu_item_id === mi.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { menu_item_id: mi.id, quantity: 1, name: mi.name, image_url: mi.image_url }];
    });
  }

  function updateQty(id, q) {
    setLines((prev) =>
      prev.map((l) =>
        l.menu_item_id === id ? { ...l, quantity: Math.max(1, Number(q) || 1) } : l
      )
    );
  }

  function removeLine(id) {
    setLines((prev) => prev.filter((l) => l.menu_item_id !== id));
  }

  function submit() {
    router.post(route("orders.store"), {
      items: lines.map((l) => ({ menu_item_id: l.menu_item_id, quantity: l.quantity })),
      payment_method: paymentMethod,
    });
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold">Create Order</h2>}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu to pick from */}
        <div className="space-y-3">
          <h3 className="font-semibold">Menu</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {menuItems.map((mi) => (
              <button
                key={mi.id}
                onClick={() => addLine(mi)}
                className="rounded border text-left overflow-hidden hover:shadow"
              >
                <img
                  src={mi.image_url}
                  alt={mi.name}
                  className="h-28 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-2">
                  <div className="font-medium">{mi.name}</div>
                  <div className="text-sm text-gray-600">
                    ${Number(mi.price).toFixed(2)} • Stock: {mi.stock}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Basket */}
        <div className="space-y-4">
          <h3 className="font-semibold">Basket</h3>
          <div className="rounded border divide-y">
            {lines.map((l) => (
              <div key={l.menu_item_id} className="flex items-center gap-3 p-3">
                <img
                  src={l.image_url}
                  alt={l.name}
                  className="h-12 w-12 rounded object-cover"
                  loading="lazy"
                />
                <div className="flex-1">
                  <div className="font-medium">{l.name}</div>
                </div>
                <input
                  type="number"
                  min={1}
                  value={l.quantity}
                  onChange={(e) => updateQty(l.menu_item_id, e.target.value)}
                  className="w-20 rounded border px-2 py-1"
                />
                <button
                  onClick={() => removeLine(l.menu_item_id)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}

            {lines.length === 0 && (
              <div className="p-6 text-gray-500">No items selected.</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="font-semibold">Payment Method</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pm"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                />
                Cash
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pm"
                  value="qr"
                  checked={paymentMethod === "qr"}
                  onChange={() => setPaymentMethod("qr")}
                />
                QR
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={submit}
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              disabled={lines.length === 0}
            >
              Place Order
            </button>
            <Link href={route("orders.index")} className="rounded border px-4 py-2">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
