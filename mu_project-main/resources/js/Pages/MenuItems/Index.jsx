import React from "react";
import { Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Index({ menuItems }) {
  const { flash } = usePage().props;

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight">🍽️ Menu Items</h2>}
    >
      <div className="max-w-7xl mx-auto space-y-4">
        {flash?.success && (
          <div className="rounded bg-green-50 border border-green-200 p-3 text-green-700">
            {flash.success}
          </div>
        )}

        <div className="flex justify-between">
          <Link
            href={route("menu-items.create")}
            className="inline-flex items-center rounded bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
          >
            + Add New Item
          </Link>
        </div>

        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((mi) => (
                <tr key={mi.id} className="border-t">
                  <td className="px-4 py-3">
                    <img
                      src={mi.image_url}
                      alt={mi.name}
                      className="h-12 w-12 rounded object-cover"
                      loading="lazy"
                    />
                  </td>
                  <td className="px-4 py-3">{mi.name}</td>
                  <td className="px-4 py-3">${Number(mi.price).toFixed(2)}</td>
                  <td className="px-4 py-3">{mi.stock}</td>
                  <td className="px-4 py-3 space-x-3">
                    <Link
                      href={route("menu-items.edit", mi.id)}
                      className="text-indigo-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      as="button"
                      method="delete"
                      href={route("menu-items.destroy", mi.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </Link>
                  </td>
                </tr>
              ))}

              {menuItems.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={5}>
                    No menu items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
