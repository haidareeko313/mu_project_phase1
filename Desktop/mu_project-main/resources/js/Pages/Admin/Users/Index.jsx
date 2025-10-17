import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function AdminUsersIndex({ users = [], filters = {} }) {
  const [q, setQ] = useState(filters.q || "");

  const search = (e) => {
    e.preventDefault();
    router.get(route("admin.users.index"), { q }, { preserveScroll: true, preserveState: true });
  };

  const toggle = (u) => {
    const role = u.role === "admin" ? "student" : "admin";
    router.put(route("admin.users.toggle", u.id), { role }, { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Users</h2>}>
      <Head title="Users" />

      <form onSubmit={search} className="mb-4 flex gap-2">
        <input
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 w-64"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Search</button>
      </form>

      <div className="rounded border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-700">
                <td className="p-3 text-slate-100">{u.name}</td>
                <td className="p-3 text-slate-300">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${u.role === "admin" ? "bg-emerald-700 text-emerald-100" : "bg-slate-700 text-slate-200"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => toggle(u)} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">
                    {u.role === "admin" ? "Make student" : "Make admin"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td className="p-4 text-slate-400" colSpan="4">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AuthenticatedLayout>
  );
}
