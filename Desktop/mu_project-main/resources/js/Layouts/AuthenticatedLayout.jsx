import React from "react";
import { Link, usePage } from "@inertiajs/react";

/**
 * Authenticated app shell with a left sidebar.
 * - Shows different nav links for admins vs students
 * - Highlights the active link
 * - Displays the current user's name & role
 */
export default function AuthenticatedLayout({ header, children }) {
  const { auth } = usePage().props || {};
  const user = auth?.user || null;
  const isAdmin = user?.role === "admin";

  // Current URL for "active" state (Inertia exposes url on the page props in recent versions)
  const currentUrl =
    (usePage().url && usePage().url.split("?")[0]) ||
    (typeof window !== "undefined" ? window.location.pathname : "/");

  const links = [
    { label: "Cafeteria", href: "/cafeteria" },
    ...(isAdmin
      ? [
          { label: "Orders", href: "/orders" },
          { label: "Menu Items", href: "/menuitems" },
          { label: "Inventory Logs", href: "/inventory-logs" },
          { label: "Payments", href: "/payments" },
          { label: "Analytics", href: "/analytics" }, // <= NEW LINK
          { label: "Roles", href: "/admin/roles" },
        ]
      : []),
  ];

  const isActive = (href) => currentUrl === href;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Cafeteria</h1>

          <nav className="flex items-center gap-3">
            {user && (
              <span className="text-slate-300 text-sm">
                {user.name}{" "}
                <span className="text-slate-500 text-xs">
                  ({isAdmin ? "Admin" : "Student"})
                </span>
              </span>
            )}

            <Link
              href="/profile"
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm"
            >
              Profile
            </Link>

            <Link
              href="/logout"
              method="post"
              as="button"
              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-sm"
            >
              Logout
            </Link>
          </nav>
        </div>
      </header>

      {/* Main layout: sidebar + page content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 bg-slate-900 border-r border-slate-800 p-4">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "px-3 py-2 rounded text-sm transition-colors",
                  isActive(link.href)
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-700",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {header && (
            <div className="mb-6 text-lg font-semibold border-b border-slate-700 pb-2">
              {header}
            </div>
          )}

          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
