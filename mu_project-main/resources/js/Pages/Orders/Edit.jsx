import React, { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';

export default function Edit() {
  const { order, menuItems, errors } = usePage().props || {};

  // Guard against undefined while dev server hydrates
  if (!order) {
    return <div className="p-6 text-center text-gray-600">Loading order...</div>;
  }

  // Initial form state from the order we received
  const [form, setForm] = useState({
    status: order.status || 'pending',
    payment_method: order.payment_method || 'cash',
    is_paid: !!order.is_paid,
    // If later you want to edit line items, you can hydrate here:
    // items: order.order_items?.map(i => ({ id: i.id, menu_item_id: i.menu_item_id, quantity: i.quantity })) || [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    router.post(route('orders.update', order.id), {
      ...form,
      _method: 'put',
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Edit Order #{order.id}</h1>
        <Link href={route('orders.index')} className="text-blue-600 hover:underline">Back</Link>
      </div>

      <div className="bg-white shadow rounded p-4 space-y-4">
        {/* Basic order info */}
        <div className="text-sm text-gray-600">
          <div>User: <span className="font-medium">{order.user?.name ?? 'N/A'}</span></div>
          <div>Items: <span className="font-medium">{(order.order_items || order.orderItems || []).length}</span></div>
          {/* Show a quick items list */}
          <ul className="list-disc ml-6 mt-2">
            {(order.order_items || order.orderItems || []).map((it) => (
              <li key={it.id}>
                {it.menu_item?.name || it.menuItem?.name || `Item #${it.menu_item_id}`} × {it.quantity}
              </li>
            ))}
          </ul>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="picked_up">Picked up</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {errors?.status && <p className="text-red-600 text-sm mt-1">{errors.status}</p>}
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-sm font-medium mb-1">Payment Method</label>
          <select
            name="payment_method"
            value={form.payment_method}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="cash">Cash</option>
            <option value="qr">QR</option>
          </select>
          {errors?.payment_method && <p className="text-red-600 text-sm mt-1">{errors.payment_method}</p>}
        </div>

        {/* Paid toggle */}
        <div className="flex items-center gap-2">
          <input
            id="is_paid"
            type="checkbox"
            name="is_paid"
            checked={form.is_paid}
            onChange={handleChange}
          />
          <label htmlFor="is_paid" className="text-sm">Mark as paid</label>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
