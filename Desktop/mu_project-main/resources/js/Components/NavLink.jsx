import React from "react";
import { Link } from "@inertiajs/react";

/**
 * Simple sidebar link with "active" styling.
 * Usage: <NavLink href={route('cafeteria')} active={route().current('cafeteria')}>Dashboard</NavLink>
 */
export default function NavLink({ href, active = false, children, icon = null }) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-300 hover:text-white hover:bg-white/5",
      ].join(" ")}
    >
      {icon && <span className="text-base leading-none">{icon}</span>}
      <span className="truncate">{children}</span>
    </Link>
  );
}
