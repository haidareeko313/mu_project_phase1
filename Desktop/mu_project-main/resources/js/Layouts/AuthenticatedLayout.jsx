import React from "react";
import { Link, usePage } from "@inertiajs/react";

export default function AuthenticatedLayout({ header, children }) {
  // Access the shared user info from Inertia (provided in HandleInertiaRequests middleware)
  const { auth } = usePage().props;
  const user = auth?.user;
  const isAdmin = user?.role === "admin";

  // Build the sidebar links dynamically
  const links = [
    { label: "Cafeteria", href: "/cafeteria" },
    ...(isAdmin
      ? [
          { label: "Orders", href: "/orders" },
          { label: "Menu Items", href: "/menuitems" },
          { label: "Inventory Logs", href: "/inventory-logs" },
          { label: "Payments", href: "/payments" },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* ---- Top Navigation Bar ---- */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
          <h1 className="text-lg font-semibold">Cafeteria</h1>
          <nav className="flex items-center gap-3">
            <span className="text-slate-300 text-sm">
              {user?.name}{" "}
              <span className="text-slate-500 text-xs">
                ({user?.role === "admin" ? "Admin" : "Student"})
              </span>
            </span>
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
              className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-sm"
            >
              Logout
            </Link>
          </nav>
        </div>
      </header>

      {/* ---- Main Body: Sidebar + Page Content ---- */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-slate-800 border-r border-slate-700 p-4">
          <nav className="flex flex-col space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md hover:bg-slate-700 transition-colors duration-150 ${
                  window.location.pathname === link.href
                    ? "bg-slate-700 text-white"
                    : "text-slate-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Page Content */}
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
