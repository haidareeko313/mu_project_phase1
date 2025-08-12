import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import ThemeToggle from '@/Components/ThemeToggle';

export default function AuthenticatedLayout({ header, children }) {
  const { auth, ziggy } = usePage().props;

  return (
    <div className="min-h-screen flex bg-white dark:bg-fx-canvas">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r dark:border-fx-line bg-white dark:bg-fx-surface">
        <div className="h-16 flex items-center px-4 border-b dark:border-fx-line">
          <Link href={route('cafeteria')} className="flex items-center gap-2">
            <span className="text-xl font-semibold dark:text-white">Cafetería</span>
          </Link>
        </div>

        <nav className="p-3 space-y-1 text-sm">
          <Link href={route('cafeteria')} className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#142040] text-slate-700 dark:text-fx-text">Dashboard</Link>
          <Link href={route('orders.index')} className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#142040] text-slate-700 dark:text-fx-text">Orders</Link>
          <Link href={route('menu-items.index')} className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#142040] text-slate-700 dark:text-fx-text">Menu Items</Link>
          <Link href={route('inventory.index')} className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#142040] text-slate-700 dark:text-fx-text">Inventory Logs</Link>
          <Link href={route('orders.receipts_payments')} className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#142040] text-slate-700 dark:text-fx-text">Payments</Link>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b dark:border-fx-line bg-white/70 dark:bg-fx-surface/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-fx-surface/50">
          <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {header && <div className="fx-section-title">{header}</div>}
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2">
              {/* If you kept Breeze profile routes, they’re available */}
              <Link href={route('profile.edit')} className="fx-chip">{auth?.user?.name ?? 'Account'}</Link>
              <form method="post" action={route('logout')}>
                <input type="hidden" name="_token" value={usePage().props.csrf_token} />
                <button className="fx-btn">Logout</button>
              </form>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
