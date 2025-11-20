import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const roleOptions = [
  { value: "any", label: "Any role" },
  { value: "admin", label: "Admin" },
  { value: "student", label: "Student" },
];

function DropdownFilter({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const currentLabel =
    options.find((opt) => opt.value === value)?.label || label;

  return (
    <div className="relative text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full border border-slate-600 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-100 shadow-sm shadow-black/40 hover:border-indigo-500 hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
      >
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <span className="max-w-[120px] truncate font-medium">
          {currentLabel}
        </span>
        <span className="ml-1 text-[10px] text-slate-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 shadow-xl shadow-black/60">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-xs transition ${
                value === opt.value
                  ? "bg-indigo-600/90 text-white"
                  : "bg-transparent text-slate-100 hover:bg-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Roles() {
  const { users, filters = {} } = usePage().props;

  const [q, setQ] = useState(filters.q ?? "");
  const [roleFilter, setRoleFilter] = useState(filters.role ?? "any");

  // ---------- Filters ----------
  const applyFilters = (e) => {
    e?.preventDefault?.();
    router.get(
      "/admin/roles",
      { q, role: roleFilter },
      { preserveState: true, replace: true }
    );
  };

  const resetFilters = () => {
    setQ("");
    setRoleFilter("any");
    router.get(
      "/admin/roles",
      {},
      { preserveState: false, replace: true }
    );
  };

  // backend might send "role" or "is_admin"
  const isAdmin = (user) =>
    (user.role && user.role.toLowerCase() === "admin") ||
    (!!user.is_admin && user.is_admin !== 0);

  // ---------- Toggle role ----------
  const toggleRole = (user) => {
    const nextRole = isAdmin(user) ? "student" : "admin";

    // IMPORTANT: match your route: POST /admin/roles/{user}/role
    router.post(
      `/admin/roles/${user.id}/role`,
      { role: nextRole },
      { preserveScroll: true, preserveState: true }
    );
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold text-gray-100">Cafeteria – Roles</h2>}
    >
      <Head title="Roles" />

      <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4 shadow-lg shadow-black/50 backdrop-blur">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Users</h3>
            <p className="text-xs text-slate-400">
              Toggle whether users are Admins or Students.
            </p>
          </div>
        </div>

        {/* FILTERS BAR */}
        <form
          onSubmit={applyFilters}
          className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full max-w-sm">
                <input
                  type="text"
                  placeholder="name or email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-full border border-slate-600 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 shadow-inner shadow-black/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                />
                <span className="pointer-events-none absolute left-2.5 top-1.5 text-xs text-slate-500">
                  🔍
                </span>
              </div>

              <DropdownFilter
                label="Role"
                value={roleFilter}
                options={roleOptions}
                onChange={setRoleFilter}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-900/70 hover:bg-indigo-500"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-700"
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        {/* USERS TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90">
                <th className="px-4 py-3 font-semibold text-slate-400">#</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No users found with the current filters.
                  </td>
                </tr>
              ) : (
                users.data.map((u) => {
                  const admin = isAdmin(u);

                  return (
                    <tr
                      key={u.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/60"
                    >
                      <td className="whitespace-nowrap px-4 py-2 text-slate-200">
                        #{u.id}
                      </td>
                      <td className="px-4 py-2 text-slate-100">{u.name}</td>
                      <td className="px-4 py-2 text-slate-300">{u.email}</td>
                      <td className="px-4 py-2">
                        <div className="inline-flex items-center gap-3 rounded-full bg-slate-900 px-2 py-1">
                          {/* toggle pill */}
                          <button
                            type="button"
                            onClick={() => toggleRole(u)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full border px-0.5 transition ${
                              admin
                                ? "border-emerald-500 bg-emerald-600"
                                : "border-slate-600 bg-slate-800"
                            }`}
                          >
                            <span
                              className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                admin ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>

                          <span className="text-xs font-medium text-slate-100">
                            {admin ? "Admin" : "Student"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
