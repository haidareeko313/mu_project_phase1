import React from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Roles({ users = [] }) {
  const setRole = (id, role) => router.post(`/admin/roles/${id}`, { role });

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Roles</h2>}>
      <Head title="Roles" />
      <div className="rounded border border-slate-700 bg-slate-800 p-4">
        <h3 className="font-semibold text-slate-100 mb-3">Roles</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-slate-300">
              <tr className="bg-slate-900/40">
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/30">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 capitalize">{u.role}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setRole(u.id, 'admin')}
                        className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                        disabled={u.role === 'admin'}
                      >
                        Make Admin
                      </button>
                      <button
                        onClick={() => setRole(u.id, 'student')}
                        className="px-2 py-1 rounded bg-slate-700 text-slate-100 hover:bg-slate-600"
                        disabled={u.role === 'student'}
                      >
                        Make Student
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td className="px-3 py-2 text-slate-400" colSpan={4}>No users.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
