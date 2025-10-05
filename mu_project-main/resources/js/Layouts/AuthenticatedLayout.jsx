import React from "react";
import { Link, usePage, router } from "@inertiajs/react";

export default function AuthenticatedLayout({ header, children }) {
  const { auth } = usePage().props || {};
  const user = auth?.user;

  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const isActive = (p) => (p === "/" ? path === "/" : path.startsWith(p));

  const onLogout = (e) => {
    e.preventDefault();
    router.post("/logout"); // no Ziggy: direct POST to /logout
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* top bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Cafeteria</div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-slate-300">
                  {user.name || "User"}
                </span>
                <Link
                  href="/profile"
                  className="rounded px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700"
                >
                  Profile
                </Link>
                <button
                  onClick={onLogout}
                  className="rounded px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-12 gap-6">
        {/* left nav */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="rounded-lg border border-slate-800 bg-slate-900">
            <ul className="p-2">
              <li>
                <Link
                  href="/cafeteria"
                  className={`block rounded px-3 py-2 text-sm ${
                    isActive("/cafeteria")
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  Cafeteria
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className={`block rounded px-3 py-2 text-sm ${
                    isActive("/orders")
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/menu"
                  className={`block rounded px-3 py-2 text-sm ${
                    isActive("/menu")
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  Menu Items
                </Link>
              </li>
              <li>
                <Link
                  href="/inventory-logs"
                  className={`block rounded px-3 py-2 text-sm ${
                    isActive("/inventory-logs")
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  Inventory Logs
                </Link>
              </li>
              <li>
                <Link
                  href="/payments"
                  className={`block rounded px-3 py-2 text-sm ${
                    isActive("/payments")
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  Payments
                </Link>
              </li>

              {/* Show only for admins if your user has role/is_admin */}
              {user?.role === "admin" || user?.is_admin ? (
                <li className="mt-2 border-t border-slate-800 pt-2">
                  <Link
                    href="/admin/users"
                    className={`block rounded px-3 py-2 text-sm ${
                      isActive("/admin/users")
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    Admin → Users
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
        </aside>

        {/* main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          {header ? (
            <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
              {header}
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-800 bg-slate-900">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
