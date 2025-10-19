import React from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

function FilterBar({ initial }) {
  return (
    <form method="get" className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col">
        <label className="text-xs text-slate-400">Search</label>
        <input
          name="q"
          defaultValue={initial?.q || ""}
          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
          placeholder="name or email..."
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-slate-400">Role</label>
        <select
          name="role"
          defaultValue={initial?.role || "any"}
          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
        >
          <option value="any">Any</option>
          <option value="admin">Admin</option>
          <option value="student">Student</option>
        </select>
      </div>
      <button className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500">Apply</button>
      <a href={location.pathname} className="px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-600">Reset</a>
    </form>
  );
}

function RoleSwitch({ userId, role }) {
  const [checked, setChecked] = React.useState(role === "admin");
  const [saving, setSaving] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);

  const onToggle = async (e) => {
    const newChecked = e.target.checked;
    const newRole = newChecked ? "admin" : "student";
    setChecked(newChecked);
    setSaving(true);
    setJustSaved(false);

    // Post immediately on toggle
    router.post(
      `/admin/roles/${userId}/role`,
      { role: newRole },
      {
        preserveScroll: true,
        onFinish: () => {
          setSaving(false);
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 1500);
        },
        onError: () => {
          // revert if server failed
          setChecked(!newChecked);
          setSaving(false);
        },
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onToggle}
          disabled={saving}
        />
        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-600 transition-colors"></div>
        <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`}></div>
      </label>
      <span className="text-xs text-slate-300">
        {checked ? "Admin" : "Student"} {justSaved && <span className="text-emerald-400 ml-1">✓</span>}
      </span>
    </div>
  );
}

export default function RolesPage({ users, filters }) {
  const rows = users?.data ?? [];
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-100">Roles</h2>}>
      <Head title="Roles" />
      <div className="rounded border border-slate-700 bg-slate-800">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="text-slate-200 font-medium">Users</div>
          <FilterBar initial={filters ?? {}} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/40 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left w-16">#</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-slate-100">
              {rows.map((u) => (
                <tr key={u.id} className="odd:bg-slate-900/20">
                  <td className="px-3 py-2">#{u.id}</td>
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <RoleSwitch userId={u.id} role={u.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 flex gap-2 justify-end border-t border-slate-700">
          {users?.prev_page_url && (
            <a href={users.prev_page_url} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100">Prev</a>
          )}
          {users?.next_page_url && (
            <a href={users.next_page_url} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100">Next</a>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
