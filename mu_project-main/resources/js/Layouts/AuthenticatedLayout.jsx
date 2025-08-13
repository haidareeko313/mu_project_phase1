import React from "react";
import { Link, usePage, router, Head } from "@inertiajs/react";
import NavLink from "@/Components/NavLink";

/**
 * App shell with a fixed left sidebar + top bar in the content area.
 * - Sidebar: links to main sections
 * - Top bar: current page header + profile + POST logout button
 * - Content: render children
 *
 * Dark, clean, and readable.
 */
export default function AuthenticatedLayout({ header, children }) {
  const { auth } = usePage().props;

  // Helper to check "active" routes; accepts string or array of names
  const is = (names) => {
    if (Array.isArray(names)) return names.some((n) => route().current(n));
    return route().current(names);
  };

  return (
    <div className="min-h-screen bg-[#0c1222] text-slate-100">
      <Head />

      {/* --- Fixed Left Sidebar --- */}
      <aside className="fixed inset-y-0 left-0 z-30 w-60 border-r border-white/10 bg-[#0e1528]">
        <div className="flex h-14 items-center px-4 border-b border-white/10">
          <Link
            href={route("cafeteria")}
            className="text-lg font-semibold tracking-wide text-indigo-300"
          >
            Cafetería
          </Link>
        </div>

        <nav className="px-3 py-3 space-y-1">
          <NavLink
            href={route("cafeteria")}
            active={is("cafeteria")}
            icon="🏠"
          >
            Dashboard
          </NavLink>

          <NavLink
            href={route("orders.index")}
            active={is(["orders.index", "orders.create", "orders.edit"])}
            icon="📦"
          >
            Orders
          </NavLink>

          <NavLink
            href={route("menu-items.index")}
            active={is(["menu-items.index", "menu-items.create", "menu-items.edit"])}
            icon="🍽️"
          >
            Menu Items
          </NavLink>

          <NavLink
            href={route("inventory.index")}
            active={is("inventory.index")}
            icon="📦"
          >
            Inventory Logs
          </NavLink>

          <NavLink
            href={route("orders.receipts_payments")}
            active={is("orders.receipts_payments")}
            icon="💳"
          >
            Payments
          </NavLink>
        </nav>
      </aside>

      {/* --- Main Content area (with left padding equal to sidebar width) --- */}
      <div className="pl-60">
        {/* Top bar inside content area */}
        <header className="sticky top-0 z-20 h-14 border-b border-white/10 bg-[#0e1528]/80 backdrop-blur">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="text-sm opacity-80">
              {header ?? "Admin Dashboard"}
            </div>

            <div className="flex items-center gap-2">
              {/* Profile link */}
              <Link
                href={route("profile.edit")}
                className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
              >
                {auth?.user?.name ?? "Profile"}
              </Link>

              {/* POST logout (no 419s) */}
              <Link
                href={route("logout")}
                method="post"
                as="button"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
              >
                Logout
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
